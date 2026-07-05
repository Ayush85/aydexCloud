// Plain vanilla-JS mirror of ./crypto.ts, meant to be pasted into a
// customer's own site (no bundler / import available there). Keep the
// algorithm (PBKDF2 100k iterations SHA-256 -> AES-GCM 256, base64(iv||ct))
// in sync with crypto.ts if it ever changes.
export const CRYPTO_SNIPPET = `<script>
// aydex client-side encryption — encrypt custom event properties with your
// own passphrase before they ever leave the browser. aydex's server only
// ever stores ciphertext and never sees your passphrase or the plaintext.
window.aydexCrypto = (function () {
  async function deriveKey(passphrase, salt) {
    var baseKey = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' },
      baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    );
  }
  function toBase64(bytes) {
    var binary = '';
    for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
  async function encrypt(plaintext, key) {
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(plaintext));
    var combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return toBase64(combined);
  }
  return { deriveKey: deriveKey, encrypt: encrypt };
})();
</script>`

export const CRYPTO_USAGE_EXAMPLE = `// Derive a key from a passphrase only you know (never sent to aydex)
const key = await aydexCrypto.deriveKey('your-own-passphrase', 'YOUR_SITE_TRACKING_ID')

// Encrypt any custom event property before tracking it
const encryptedEmail = await aydexCrypto.encrypt(userEmail, key)
window.aydex.track('signup', { email: encryptedEmail })`
