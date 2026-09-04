/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MIDNIGHT_NODE_RPC_URL?: string;
  readonly VITE_MIDNIGHT_INDEXER_URL?: string;
  readonly VITE_MIDNIGHT_PROOF_SERVER_URL?: string;
  readonly VITE_MIDNIGHT_NETWORK_ID?: string;
  readonly VITE_MIDNIGHT_CONTRACT_ADDRESS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
