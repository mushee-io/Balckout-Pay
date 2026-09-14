/**
 * @file wallet-connector.ts
 * Manages connection to Midnight Lace Wallet (LIVE) or isolated Demo Mode.
 *
 * LIVE mode is fail-closed: only the DApp Connector v4 `connect(networkId)`
 * flow is accepted and the wallet-reported network must exactly match the
 * network requested by Blackout Pay.
 */

import { MidnightNetwork, WalletState } from './types';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

export interface LaceSession {
  wallet: any;
  configuration: { proverServerUri?: string; indexerUri?: string; indexerWsUri?: string };
  addresses: { shieldedAddress?: string; shieldedCoinPublicKey?: string; shieldedEncryptionPublicKey?: string };
  networkId: string;
}

export const DEFAULT_WALLET_STATE: WalletState = {
  isConnected: false,
  address: '',
  network: 'Midnight Preview',
  walletName: 'Lace (Midnight)',
  balanceDust: '0.00 DUST',
  isConnecting: false,
  mode: 'DEMO',
};

export interface DiscoveredMidnightWallet {
  id: string;
  name: string;
  icon?: string;
  apiVersion?: string;
  rdns?: string;
  api: {
    name?: string;
    icon?: string;
    apiVersion?: string;
    rdns?: string;
    connect?: (networkId: string) => Promise<any>;
    enable?: () => Promise<any>;
  };
}

const EXPECTED_NETWORK_IDS: Record<MidnightNetwork, string> = {
  'Midnight Preview': 'preview',
  'Midnight TestNet-02': 'testnet-02',
  'Midnight DevNet': 'devnet',
  'Midnight Local Sandbox': 'undeployed',
};

export function isInIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function getInjectedMidnightWallets(): DiscoveredMidnightWallet[] {
  if (typeof window === 'undefined') return [];
  const anyWin = window as unknown as { midnight?: Record<string, any> };
  if (!anyWin.midnight || typeof anyWin.midnight !== 'object') return [];

  const wallets: DiscoveredMidnightWallet[] = [];
  for (const [key, val] of Object.entries(anyWin.midnight)) {
    if (!val || typeof val !== 'object') continue;
    const candidate = val as any;
    if (typeof candidate.connect !== 'function' && typeof candidate.enable !== 'function') continue;
    wallets.push({
      id: key,
      name: candidate.name || (key.toLowerCase().includes('lace') ? 'Lace (Midnight Network)' : key),
      icon: candidate.icon,
      apiVersion: candidate.apiVersion,
      rdns: candidate.rdns,
      api: candidate,
    });
  }
  return wallets;
}

let activeLaceApi: any = null;
let activeLaceSession: LaceSession | null = null;

export function getActiveLaceApi(): any {
  return activeLaceApi;
}

export function setActiveLaceApi(api: any): void {
  activeLaceApi = api;
}

export function getActiveLaceSession(): LaceSession | null {
  return activeLaceSession;
}

export function clearActiveLaceSession(): void {
  activeLaceApi = null;
  activeLaceSession = null;
}

export function isLaceMidnightAvailable(): boolean {
  return getInjectedMidnightWallets().some((wallet) => typeof wallet.api.connect === 'function');
}

/**
 * Connect to Midnight Lace Wallet in REAL WALLET MODE.
 *
 * Security invariants:
 * - Requires the v4 `connect(networkId)` API.
 * - Never falls back to a legacy connection that cannot attest its network.
 * - Clears any previous active session before a new attempt.
 * - Rejects a wallet that reports a different network than requested.
 * - Never fabricates an address or balance.
 */
export async function connectLiveLaceWallet(
  preferredNetwork: MidnightNetwork = 'Midnight Preview'
): Promise<WalletState> {
  if (typeof window === 'undefined') {
    throw new Error('Wallet connection requires a browser environment.');
  }

  clearActiveLaceSession();

  const inFrame = isInIframe();
  const availableWallets = getInjectedMidnightWallets();

  if (availableWallets.length === 0) {
    if (inFrame) {
      throw new Error(
        'Lace (Midnight) extension not detected. Browser extensions cannot inject window.midnight inside sandboxed iframes. Open the app in a top-level tab and ensure Lace Midnight is installed.'
      );
    }
    throw new Error(
      'Lace (Midnight) browser extension not detected. Install the official Midnight-compatible Lace wallet and select Midnight Preview.'
    );
  }

  const selectedWallet =
    availableWallets.find((wallet) => wallet.id.toLowerCase().includes('lace') || wallet.name.toLowerCase().includes('lace')) ||
    availableWallets[0];

  if (typeof selectedWallet.api.connect !== 'function') {
    throw new Error(
      'The detected Midnight wallet only exposes a legacy connector. Blackout Pay LIVE requires DApp Connector v4 connect(networkId) so the network can be verified before transactions.'
    );
  }

  const expectedNetworkId = EXPECTED_NETWORK_IDS[preferredNetwork];

  try {
    const connectedApi = await selectedWallet.api.connect(expectedNetworkId);
    if (!connectedApi || typeof connectedApi !== 'object') {
      throw new Error('Wallet returned an invalid Midnight connector session.');
    }
    if (typeof connectedApi.getConfiguration !== 'function' || typeof connectedApi.getConnectionStatus !== 'function') {
      throw new Error('Wallet session is missing required DApp Connector v4 status/configuration methods.');
    }

    const configuration = await connectedApi.getConfiguration();
    const connectionStatus = await connectedApi.getConnectionStatus();
    if (connectionStatus?.status !== 'connected' || typeof connectionStatus.networkId !== 'string') {
      throw new Error('Lace did not establish a connected Midnight network session.');
    }
    if (connectionStatus.networkId !== expectedNetworkId) {
      throw new Error(
        `Wallet network mismatch: Blackout Pay requested "${expectedNetworkId}" but the wallet connected to "${connectionStatus.networkId}".`
      );
    }

    setNetworkId(connectionStatus.networkId);

    if (typeof connectedApi.hintUsage === 'function') {
      await connectedApi.hintUsage([
        'getUnshieldedAddress',
        'getShieldedAddresses',
        'getDustBalance',
      ]);
    }

    const shieldedAddresses = typeof connectedApi.getShieldedAddresses === 'function'
      ? await connectedApi.getShieldedAddresses()
      : {};

    let address = '';
    if (typeof connectedApi.getUnshieldedAddress === 'function') {
      const addrObj = await connectedApi.getUnshieldedAddress();
      address = typeof addrObj?.unshieldedAddress === 'string' ? addrObj.unshieldedAddress.trim() : '';
    }
    if (!address && typeof shieldedAddresses?.shieldedAddress === 'string') {
      address = shieldedAddresses.shieldedAddress.trim();
    }
    if (!address) {
      throw new Error('Connected to wallet but no Midnight account address was provided.');
    }

    let balanceDust = '0 DUST';
    if (typeof connectedApi.getDustBalance === 'function') {
      const dustObj = await connectedApi.getDustBalance();
      if (dustObj && dustObj.balance !== undefined) {
        const balBigInt = BigInt(dustObj.balance);
        if (balBigInt < 0n) throw new Error('Wallet returned a negative DUST balance.');
        balanceDust = `${balBigInt.toString()} DUST`;
      }
    }

    const session: LaceSession = {
      wallet: connectedApi,
      configuration: configuration ?? {},
      addresses: shieldedAddresses ?? {},
      networkId: connectionStatus.networkId,
    };

    activeLaceApi = connectedApi;
    activeLaceSession = session;

    return {
      isConnected: true,
      address,
      network: preferredNetwork,
      walletName: selectedWallet.name,
      balanceDust,
      isConnecting: false,
      mode: 'LIVE',
    };
  } catch (error: unknown) {
    clearActiveLaceSession();
    const message = error instanceof Error && error.message.trim()
      ? error.message
      : 'User rejected Midnight wallet connection';
    throw new Error(`Midnight wallet connection failed: ${message}`);
  }
}

/**
 * Explicit DEMO MODE for local testing and UI evaluation.
 * Always tagged DEMO and never creates an active Lace session.
 */
export async function connectDemoWallet(
  preferredNetwork: MidnightNetwork = 'Midnight Preview'
): Promise<WalletState> {
  clearActiveLaceSession();
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    isConnected: true,
    address: 'mn_addr_test1q9x_demo_sandbox_893c04be1299dfa871239cc8',
    network: preferredNetwork,
    walletName: 'Midnight Sandbox Keypair (Demo)',
    balanceDust: '500.00 DUST (Demo)',
    isConnecting: false,
    mode: 'DEMO',
  };
}
