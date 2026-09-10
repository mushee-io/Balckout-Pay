import { Buffer } from 'buffer';

// MidnightJS and its ledger/serialization dependency chain expect Node's
// Buffer global. Vite intentionally does not provide Node globals in the
// browser, so expose only the Buffer polyfill required by the LIVE path.
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}
