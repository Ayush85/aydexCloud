// Parses a Google Analytics 4 CSV export into daily rows. Pure and runs in the
// browser (so the file never leaves the user's machine until they confirm) and
// again on the server as validation.

export interface ImportRow { date: string; pageviews: number; visitors: number; sessions: number }
export interface ParseResult { rows: ImportRow[]; warnings: string[]; error?: string }

export const MAX_IMPORT_ROWS = 5000

const DATE_KEYS = ['date', 'day', 'date range', 'day index']
const VIEW_KEYS = ['views', 'screen page views', 'screenpageviews', 'pageviews', 'page views']
const USER_KEYS = ['total users', 'users', 'active users', 'visitors', 'unique visitors']
const SESSION_KEYS = ['sessions']

export function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (c === '"') q = false
      else cur += c
    } else if (c === '"') q = true
    else if (c === ',') { out.push(cur); cur = '' }
    else cur += c
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

export function normalizeDate(raw: string): string | null {
  const s = raw.trim()
  let y: number, m: number, d: number
  let mt = /^(\d{4})(\d{2})(\d{2})$/.exec(s) // GA4: 20240131
  if (!mt) mt = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!mt) return null
  y = +mt[1]; m = +mt[2]; d = +mt[3]
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null
  if (y < 2005) return null
  return `${mt[1]}-${mt[2]}-${mt[3]}`
}

function toInt(raw: string | undefined): number | null {
  if (raw === undefined) return null
  const n = Number(raw.replace(/[,\s]/g, ''))
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null
}

export function parseGa4Csv(text: string, today = new Date()): ParseResult {
  const warnings: string[] = []
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim() !== '' && !l.trim().startsWith('#'))
  if (lines.length < 2) return { rows: [], warnings, error: 'The file has no data rows.' }

  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase())
  const find = (keys: string[]) => header.findIndex((h) => keys.includes(h))
  const di = find(DATE_KEYS), vi = find(VIEW_KEYS), ui = find(USER_KEYS), si = find(SESSION_KEYS)
  if (di < 0) return { rows: [], warnings, error: 'No Date column found. Export a report broken down by day (Date or Day).' }
  if (vi < 0 && ui < 0) return { rows: [], warnings, error: 'Need a Views and/or Users column.' }

  const byDate = new Map<string, ImportRow>()
  let skipped = 0
  const todayStr = today.toISOString().slice(0, 10)
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line)
    const date = normalizeDate(cells[di] ?? '')
    if (!date || date > todayStr) { skipped++; continue }
    const pageviews = vi >= 0 ? toInt(cells[vi]) : 0
    const visitors = ui >= 0 ? toInt(cells[ui]) : 0
    if (pageviews === null || visitors === null) { skipped++; continue }
    const sessions = si >= 0 ? toInt(cells[si]) ?? 0 : 0
    const prev = byDate.get(date)
    // Duplicate days (e.g. a report split by another dimension) are summed.
    if (prev) { prev.pageviews += pageviews; prev.visitors += visitors; prev.sessions += sessions }
    else byDate.set(date, { date, pageviews, visitors, sessions })
  }
  if (skipped) warnings.push(`${skipped} row(s) skipped (unrecognised date or number).`)
  const rows = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))
  if (rows.length === 0) return { rows, warnings, error: 'No valid rows found. Dates must look like 20240131 or 2024-01-31.' }
  if (rows.length > MAX_IMPORT_ROWS) return { rows: [], warnings, error: `Too many rows (max ${MAX_IMPORT_ROWS}).` }
  if (vi < 0) warnings.push('No Views column: pageviews are recorded as 0 and only visitors are imported.')
  if (duplicatesSummed(lines.length - 1, rows.length, skipped)) warnings.push('Some days appeared more than once and were added together.')
  return { rows, warnings }
}

function duplicatesSummed(dataLines: number, rows: number, skipped: number): boolean {
  return dataLines - skipped > rows
}

/** Server-side re-validation of rows posted by the client. */
export function validateRows(input: unknown, today = new Date()): ImportRow[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_IMPORT_ROWS) return null
  const todayStr = today.toISOString().slice(0, 10)
  const seen = new Set<string>()
  const out: ImportRow[] = []
  for (const r of input) {
    if (!r || typeof r.date !== 'string') return null
    const date = normalizeDate(r.date)
    if (!date || date > todayStr || seen.has(date)) return null
    const nums = [r.pageviews, r.visitors, r.sessions ?? 0]
    if (!nums.every((n) => Number.isInteger(n) && n >= 0 && n < 1e10)) return null
    seen.add(date)
    out.push({ date, pageviews: r.pageviews, visitors: r.visitors, sessions: r.sessions ?? 0 })
  }
  return out
}
