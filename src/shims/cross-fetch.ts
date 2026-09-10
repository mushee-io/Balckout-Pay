/**
 * Safe browser shim for cross-fetch.
 * In modern browser environments, globalThis.fetch is native and immutable.
 * This shim prevents cross-fetch's faulty browser-ponyfill prototype assignment
 * which causes "Cannot set property fetch of #<Window> which has only a getter".
 */

const nativeFetch =
  typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function'
    ? globalThis.fetch.bind(globalThis)
    : (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init);

export const fetch = nativeFetch;
export const Headers = typeof globalThis !== 'undefined' ? globalThis.Headers : class Headers {};
export const Request = typeof globalThis !== 'undefined' ? globalThis.Request : class Request {};
export const Response = typeof globalThis !== 'undefined' ? globalThis.Response : class Response {};

export default nativeFetch;
