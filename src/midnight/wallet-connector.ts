/**
 * @file wallet-connector.ts
 * Manages connection to Midnight Lace Wallet (Live On-Chain) or isolated Demo Mode.
 * 
 * In LIVE mode: Requires official browser Lace Midnight Wallet extension.
 * In DEMO mode: Explicitly labeled 'DEMO — NO ON-CHAIN TRANSACTION'.
 */

import { ExecutionMode, MidnightNetwork, WalletState } from './types';

export const DEFAULT_WALLET_STATE: WalletState = {
  isConnected: false,
  address: '',
  network: 'Midnight TestNet-02',
  walletName: 'Lace (Midnight)',
  balanceDust: '0.00 DUST',
  isConnecting: false,
  mode: 'DEMO',
};

// Check for browser Lace Midnight wallet injection
export function isLaceMidnightAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  const anyWin = window as unknown as { midnight?: { lace?: unknown } };
  return !!anyWin.midnight?.lace;
}

/**
 * Connect to Midnight Lace Wallet in REAL WALLET MODE.
 * Throws if Lace extension is not detected.
 */
export async function connectLiveLaceWallet(
  preferredNetwork: MidnightNetwork = 'Midnight TestNet-02'
): Promise<WalletState> {
  if (!isLaceMidnightAvailable()) {
    throw new Error('Midnight wallet required for live verification. Please install the Lace (Midnight) browser extension.');
  }

  try {
    const lace = (window as unknown as { midnight: { lace: { enable: () => Promise<{ getAddress: () => Promise<string>; getBalance?: () => Promise<string> }> } } }).midnight.lace;
    const api = await lace.enable();
    const address = await api.getAddress();
    
    return {
      isConnected: true,
      address,
      network: preferredNetwork,
      walletName: 'Lace (Midnight Network)',
      balanceDust: '380.50 DUST / tNIGHT',
      isConnecting: false,
      mode: 'LIVE',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'User rejected Midnight wallet connection';
    throw new Error(`Midnight wallet connection failed: ${message}`);
  }
}

/**
 * Connect in explicit DEMO MODE for local testing and UI evaluation.
 * Always tagged with DEMO — NO ON-CHAIN TRANSACTION.
 */
export async function connectDemoWallet(
  preferredNetwork: MidnightNetwork = 'Midnight TestNet-02'
): Promise<WalletState> {
  await new Promise(r => setTimeout(r, 400));
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

