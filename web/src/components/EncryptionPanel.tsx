'use client'

import { useState } from 'react'
import { deriveKey, decryptValue } from '@/lib/crypto'
import { CRYPTO_SNIPPET, CRYPTO_USAGE_EXAMPLE } from '@/lib/cryptoSnippet'

interface Props {
  siteId: string
  trackingId: string
  eventNames: string[]
}

interface DecryptedRow {
  timestamp: string
  fields: Record<string, string>
}

export function EncryptionPanel({ siteId, trackingId, eventNames }: Props) {
  const [passphrase, setPassphrase] = useState('')
  const [eventName, setEventName] = useState(eventNames[0] ?? '')
  const [rows, setRows] = useState<DecryptedRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDecrypt() {
    if (!passphrase || !eventName) return
    setLoading(true)
    setError('')
    setRows([])
    try {
      const res = await fetch(`/api/analytics/${siteId}/events/${encodeURIComponent(eventName)}`)
      if (!res.ok) throw new Error()
      const { rows: raw } = await res.json() as { rows: { timestamp: string; event_props: string }[] }

      const key = await deriveKey(passphrase, trackingId)
      const decrypted: DecryptedRow[] = []
      for (const r of raw) {
        let props: Record<string, string> = {}
        try {
          props = JSON.parse(r.event_props || '{}')
        } catch {
          continue
        }
        const fields: Record<string, string> = {}
        for (const [k, v] of Object.entries(props)) {
          try {
            fields[k] = await decryptValue(String(v), key)
          } catch {
            fields[k] = '⚠️ could not decrypt — check your passphrase'
          }
        }
        decrypted.push({ timestamp: r.timestamp, fields })
      }
      setRows(decrypted)
    } catch {
      setError('Could not load events for that name.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 space-y-6">
      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 mb-1">Encrypt custom event data with your own key</h3>
        <p className="text-sm text-slate-500 mb-4">
          Add this snippet to your site alongside the tracking script. Encryption and decryption both happen
          in the browser — your passphrase and plaintext data are never sent to aydex&apos;s servers.
        </p>
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-slate-700 select-none">
            🔒 Encryption snippet — paste before &lt;/head&gt;
          </summary>
          <div className="mt-3 bg-slate-900 rounded-lg p-3 overflow-x-auto">
            <pre className="text-green-400 text-xs font-mono whitespace-pre">{CRYPTO_SNIPPET}</pre>
          </div>
        </details>
        <details className="group mt-3">
          <summary className="cursor-pointer text-sm font-medium text-slate-700 select-none">
            💡 Usage example
          </summary>
          <div className="mt-3 bg-slate-900 rounded-lg p-3 overflow-x-auto">
            <pre className="text-green-400 text-xs font-mono whitespace-pre">
              {CRYPTO_USAGE_EXAMPLE.replace('YOUR_SITE_TRACKING_ID', trackingId)}
            </pre>
          </div>
        </details>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 mb-1">Preview decrypted events</h3>
        <p className="text-sm text-slate-500 mb-4">
          Enter your passphrase to decrypt recent event properties for this browser session only. It is never
          stored or sent anywhere except used locally to derive the decryption key.
        </p>
        {eventNames.length === 0 ? (
          <p className="text-sm text-slate-400">No custom events yet — send one with <code className="bg-slate-100 px-1 rounded">aydex.track()</code> to preview decryption here.</p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <select className="input sm:w-48" value={eventName} onChange={(e) => setEventName(e.target.value)}>
              {eventNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <input
              className="input flex-1"
              type="password"
              placeholder="Your passphrase"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
            />
            <button onClick={handleDecrypt} disabled={loading || !passphrase} className="btn-primary text-sm whitespace-nowrap">
              {loading ? 'Decrypting…' : 'Decrypt & preview'}
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

        {rows.length > 0 && (
          <table className="w-full text-sm mt-4">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Time</th>
                <th className="px-3 py-2 text-left font-medium">Decrypted properties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{new Date(r.timestamp).toLocaleString()}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-800">
                    {Object.entries(r.fields).map(([k, v]) => `${k}: ${v}`).join(', ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
