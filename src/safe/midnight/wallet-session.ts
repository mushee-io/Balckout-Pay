import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  clearActiveLaceSession,
  connectLiveLaceWallet,
  getActiveLaceSession,
} from '../../midnight/wallet-connector.ts';
import { disposeBlackoutSafePrivateStateScope } from './private-state.ts';
import { assertSafeEndpointUri } from './security-hardening.ts';

export interface SafeWalletSession {
  wallet: any;
  configuration: { proverServerUri?: string; indexerUri?: string; indexerWsUri?: string; networkId?: string };
  addresses: { shieldedAddress?: string; shieldedCoinPublicKey?: string; shieldedEncryptionPublicKey?: string };
  networkId: 'preview';
  walletName: string;
  connectorId: string;
}

let activeSession: SafeWalletSession | null = null;

export function getActiveSafeWalletSession(): SafeWalletSession | null {
  return activeSession;
}

export function clearActiveSafeWalletSession(): void {
  if (activeSession) disposeBlackoutSafePrivateStateScope(activeSession);
  activeSession = null;
  clearActiveLaceSession();
}

function normalizeConfiguration(configuration: SafeWalletSession['configuration']) {
  return {
    ...configuration,
    indexerUri: assertSafeEndpointUri(configuration.indexerUri, 'HTTP'),
    indexerWsUri: assertSafeEndpointUri(configuration.indexerWsUri, 'WS'),
  };
}

export async function connectBlackoutSafeWallet(): Promise<SafeWalletSession> {
  const view = await connectLiveLaceWallet('Midnight Preview');
  const shared = getActiveLaceSession();
  if (!shared || shared.networkId !== 'preview') throw new Error('BLACKOUT_SAFE_PREVIEW_SESSION_REQUIRED');
  const configuration = normalizeConfiguration({ ...shared.configuration, networkId: shared.networkId });
  if (!shared.addresses.shieldedCoinPublicKey || !shared.addresses.shieldedEncryptionPublicKey) {
    throw new Error('BLACKOUT_SAFE_SHIELDED_KEYS_MISSING');
  }
  setNetworkId('preview');
  const session: SafeWalletSession = {
    wallet: shared.wallet,
    configuration,
    addresses: shared.addresses,
    networkId: 'preview',
    walletName: view.walletName,
    connectorId: view.walletName,
  };
  if (activeSession && activeSession !== session) disposeBlackoutSafePrivateStateScope(activeSession);
  activeSession = session;
  return session;
}

export async function requirePreviewDust(session: SafeWalletSession): Promise<bigint> {
  await revalidateBlackoutSafeWalletSession(session);
  const raw = await session.wallet.getDustBalance();
  const value = raw && typeof raw === 'object' && 'balance' in raw ? (raw as { balance: unknown }).balance : raw;
  const dust = typeof value === 'bigint' ? value : BigInt(String(value ?? '0'));
  if (dust < 0n) throw new Error('BLACKOUT_SAFE_INVALID_DUST_BALANCE');
  return dust;
}

export async function revalidateBlackoutSafeWalletSession(session: SafeWalletSession): Promise<void> {
  if (session.networkId !== 'preview') throw new Error('BLACKOUT_SAFE_PREVIEW_ONLY');
  const status = await session.wallet.getConnectionStatus();
  if (status?.status !== 'connected' || status.networkId !== 'preview') throw new Error('BLACKOUT_SAFE_WALLET_SESSION_CHANGED');
  const latestConfiguration = normalizeConfiguration(await session.wallet.getConfiguration());
  if (
    latestConfiguration.indexerUri !== session.configuration.indexerUri ||
    latestConfiguration.indexerWsUri !== session.configuration.indexerWsUri
  ) {
    throw new Error('BLACKOUT_SAFE_NETWORK_CONFIGURATION_CHANGED');
  }
  const latestAddresses = await session.wallet.getShieldedAddresses();
  if (
    latestAddresses?.shieldedCoinPublicKey !== session.addresses.shieldedCoinPublicKey ||
    latestAddresses?.shieldedEncryptionPublicKey !== session.addresses.shieldedEncryptionPublicKey
  ) {
    throw new Error('BLACKOUT_SAFE_WALLET_ACCOUNT_CHANGED');
  }
}
