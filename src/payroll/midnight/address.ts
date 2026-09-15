const BECH32M_CONST = 0x2bc830a3;
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const ALLOWED_PREVIEW_HRPS = new Set(['mn_addr_preview', 'mn_shield-addr_preview']);

function hrpExpand(hrp: string): number[] {
  const high = Array.from(hrp, (char) => char.charCodeAt(0) >> 5);
  const low = Array.from(hrp, (char) => char.charCodeAt(0) & 31);
  return [...high, 0, ...low];
}

function polymod(values: number[]): number {
  const generators = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const value of values) {
    const top = chk >>> 25;
    chk = (((chk & 0x1ffffff) << 5) ^ value) >>> 0;
    for (let i = 0; i < 5; i += 1) {
      if ((top >>> i) & 1) chk = (chk ^ generators[i]) >>> 0;
    }
  }
  return chk >>> 0;
}

export interface PreviewAddressValidation {
  ok: boolean;
  normalized?: string;
  kind?: 'UNSHIELDED' | 'SHIELDED';
  error?: string;
}

/**
 * Strict Bech32m validation for Midnight Preview recipient addresses.
 *
 * BLACKOUT intentionally refuses mainnet/preprod/undeployed addresses in LIVE
 * Preview mode. This catches both wrong-network copy/paste mistakes and broken
 * checksums instead of relying on a prefix-only check.
 */
export function validateMidnightPreviewAddress(input: string): PreviewAddressValidation {
  const value = input.trim();
  if (!value) return { ok: false, error: 'Midnight Preview recipient address is required.' };
  if (value !== value.toLowerCase() && value !== value.toUpperCase()) {
    return { ok: false, error: 'Midnight addresses must not mix upper- and lower-case characters.' };
  }

  const normalized = value.toLowerCase();
  const separator = normalized.lastIndexOf('1');
  if (separator <= 0 || separator + 7 > normalized.length) {
    return { ok: false, error: 'Invalid Midnight Bech32m address structure.' };
  }

  const hrp = normalized.slice(0, separator);
  if (!ALLOWED_PREVIEW_HRPS.has(hrp)) {
    return {
      ok: false,
      error: 'Preview address required. Use mn_addr_preview1… or mn_shield-addr_preview1… from a Midnight Preview wallet.',
    };
  }

  const dataPart = normalized.slice(separator + 1);
  const data: number[] = [];
  for (const char of dataPart) {
    const index = CHARSET.indexOf(char);
    if (index < 0) return { ok: false, error: 'Midnight address contains an invalid Bech32m character.' };
    data.push(index);
  }

  if ((polymod([...hrpExpand(hrp), ...data]) ^ BECH32M_CONST) !== 0) {
    return { ok: false, error: 'Midnight Preview address checksum is invalid. Copy the address directly from the wallet.' };
  }

  return {
    ok: true,
    normalized,
    kind: hrp === 'mn_shield-addr_preview' ? 'SHIELDED' : 'UNSHIELDED',
  };
}
