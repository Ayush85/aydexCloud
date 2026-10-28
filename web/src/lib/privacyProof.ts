import { createHash } from 'crypto'

// Static checks over the exact tracker script a visitor's browser receives.
// They verify what the *script* can do; server-side handling is covered by the
// open-source tracker (hashing, IP discarded, no raw IP stored).

export interface ProofCheck { id: string; claim: string; pass: boolean; detail: string }

export function sha256Hex(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

/** Strips comments so a forbidden word inside a comment does not trip a check. */
function code(js: string): string {
  return js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/.*$/gm, '$1')
}

const FORBIDDEN: { id: string; claim: string; re: RegExp }[] = [
  { id: 'cookies', claim: 'Never reads or writes cookies', re: /document\s*\.\s*cookie/ },
  { id: 'canvas', claim: 'No canvas fingerprinting', re: /toDataURL|getImageData|createElement\(\s*['"]canvas['"]\s*\)|getContext\(/ },
  { id: 'audio', claim: 'No audio fingerprinting', re: /AudioContext|OfflineAudioContext/ },
  { id: 'webgl', claim: 'No WebGL / GPU fingerprinting', re: /WEBGL_debug_renderer_info|getParameter\(\s*37446/ },
  { id: 'fonts', claim: 'No font enumeration', re: /document\s*\.\s*fonts|queryLocalFonts/ },
  { id: 'keys', claim: 'Does not log keystrokes or form input', re: /addEventListener\(\s*['"](keydown|keyup|keypress|input|change)['"]/ },
  { id: 'replay', claim: 'No session recording (no DOM serialization)', re: /outerHTML|innerHTML\s*[^=]|XMLSerializer|html2canvas|rrweb/ },
  { id: 'xhr', claim: 'Sends data only through image / beacon requests to its own collector', re: /XMLHttpRequest|\bfetch\s*\(/ },
]

export function analyzeScript(js: string): { sha256: string; bytes: number; checks: ProofCheck[]; storageOptIn: boolean } {
  const c = code(js)
  const checks: ProofCheck[] = FORBIDDEN.map((f) => {
    const m = f.re.exec(c)
    return { id: f.id, claim: f.claim, pass: !m, detail: m ? `Found "${m[0]}" in the script` : 'Not present in the served script' }
  })
  // Storage is allowed only behind the explicit data-storage opt-in.
  const usesStorage = /localStorage|sessionStorage/.test(c)
  const gated = /storageMode/.test(c) && /data-storage/.test(c)
  checks.push({
    id: 'storage',
    claim: 'Uses no browser storage unless you opt in with data-storage',
    pass: !usesStorage || gated,
    detail: usesStorage ? (gated ? 'Storage code exists but only runs when data-storage is set' : 'Storage used without an opt-in gate') : 'No storage APIs referenced',
  })
  return { sha256: sha256Hex(js), bytes: Buffer.byteLength(js, 'utf8'), checks, storageOptIn: usesStorage && gated }
}
