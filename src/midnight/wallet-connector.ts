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
  network: 'Midnight Preview',
  walletName: 'Lace (Midnight)',
  balanceDust: '0.00 DUST',
  isConnecting: false,
  mode: 'DEMO',
};

// Check for browser Lace Midnight wallet injection
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
    if (val && typeof val === 'object') {
      const cand = val as any;
      if (typeof cand.connect === 'function' || typeof cand.enable === 'function') {
        wallets.push({
          id: key,
          name: cand.name || (key.toLowerCase().includes('lace') ? 'Lace (Midnight Network)' : key),
          icon: cand.icon,
          apiVersion: cand.apiVersion,
          rdns: cand.rdns,
          api: cand,
        });
      }
    }
  }
  return wallets;
}

let activeLaceApi: any = null;

export function getActiveLaceApi(): any {
  return activeLaceApi;
}

export function setActiveLaceApi(api: any): void {
  activeLaceApi = api;
}

export function isLaceMidnightAvailable(): boolean {
  const wallets = getInjectedMidnightWallets();
  return wallets.length > 0;
}

/**
 * Connect to Midnight Lace Wallet in REAL WALLET MODE.
 * Strictly adheres to @midnight-ntwrk/dapp-connector-api v4 standard.
 * Throws if Lace extension is not detected or permission is rejected.
 * Strictly avoids fabricated balance or address.
 */
export async function connectLiveLaceWallet(
  preferredNetwork: MidnightNetwork = 'Midnight Preview'
): Promise<WalletState> {
  if (typeof window === 'undefined') {
    throw new Error('Wallet connection requires a browser environment.');
  }

  const inFrame = isInIframe();
  const availableWallets = getInjectedMidnightWallets();

  if (availableWallets.length === 0) {
    if (inFrame) {
      throw new Error(
        'Lace (Midnight) extension not detected. Browser extensions cannot inject window.midnight inside sandboxed iframes. Please open the app in a new top-level tab (or run locally on http://localhost:3000) and ensure Lace Midnight is installed.'
      );
    } else {
      throw new Error(
        'Lace (Midnight) browser extension not detected. Please install the official Lace (Midnight Network) browser extension and ensure it is set to Midnight Preview / TestNet.'
      );
    }
  }

  // Select Lace or first available Midnight wallet
  const selectedWallet = 
    availableWallets.find(w => w.id.toLowerCase().includes('lace') || w.name.toLowerCase().includes('lace')) ||
    availableWallets[0];

  try {
    // Map human-readable network to networkId string
    const networkId = preferredNetwork === 'Midnight Preview' ? 'preview' : 'testnet-02';

    let address = '';
    let balanceDust = '0.00 DUST';

    // Standard DApp Connector API v4: connect(networkId)
    if (typeof selectedWallet.api.connect === 'function') {
      const connectedApi = await selectedWallet.api.connect(networkId);
      activeLaceApi = connectedApi;
      
      // Hint usage for permission acquisition
      if (typeof connectedApi.hintUsage === 'function') {
        await connectedApi.hintUsage([
          'getUnshieldedAddress',
          'getShieldedAddresses',
          'getDustBalance',
        ]);
      }

      // Fetch unshielded address (Bech32m)
      if (typeof connectedApi.getUnshieldedAddress === 'function') {
        const addrObj = await connectedApi.getUnshieldedAddress();
        address = addrObj?.unshieldedAddress || '';
      } else if (typeof connectedApi.getShieldedAddresses === 'function') {
        const sAddr = await connectedApi.getShieldedAddresses();
        address = sAddr?.shieldedAddress || '';
      }

      // Fetch Dust balance
      if (typeof connectedApi.getDustBalance === 'function') {
        const dustObj = await connectedApi.getDustBalance();
        if (dustObj && dustObj.balance !== undefined) {
          const balBigInt = BigInt(dustObj.balance);
          // Dust precision (usually 1e6 or raw units)
          balanceDust = `${balBigInt.toString()} DUST`;
        }
      }
    } else if (typeof selectedWallet.api.enable === 'function') {
      // Compatibility fallback for pre-v4 extensions
      const api = await selectedWallet.api.enable();
      if (typeof api.getAddress === 'function') {
        address = await api.getAddress();
      }
      if (typeof api.getBalance === 'function') {
        const rawBal = await api.getBalance();
        balanceDust = `${rawBal} DUST`;
      }
    }

    if (!address) {
      throw new Error('Connected to wallet but no account address was provided.');
    }

    return {
      isConnected: true,
      address,
      network: preferredNetwork,
      walletName: selectedWallet.name,
      balanceDust,
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
  preferredNetwork: MidnightNetwork = 'Midnight Preview'
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

