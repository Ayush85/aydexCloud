export const MAX_ANNOTATIONS_PER_SITE = 500
export const MAX_ANNOTATION_TEXT = 140

/** Validates a client-supplied annotation. Returns the cleaned value or an error message. */
export function parseAnnotation(
  input: unknown,
  today = new Date()
): { ok: true; date: string; text: string } | { ok: false; error: string } {
  const b = input as { date?: unknown; text?: unknown } | null
  const text = typeof b?.text === 'string' ? b.text.trim() : ''
  if (!text) return { ok: false, error: 'Write a short note.' }
  if (text.length > MAX_ANNOTATION_TEXT) return { ok: false, error: `Keep notes under ${MAX_ANNOTATION_TEXT} characters.` }
  const date = typeof b?.date === 'string' ? b.date : ''
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!m) return { ok: false, error: 'Date must look like 2026-10-28.' }
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) {
    return { ok: false, error: 'That date does not exist.' }
  }
  if (date > new Date(today.getTime() + 24 * 3600 * 1000).toISOString().slice(0, 10)) {
    return { ok: false, error: 'Notes cannot be in the future.' }
  }
  if (+m[1] < 2005) return { ok: false, error: 'That date is too old.' }
  return { ok: true, date, text }
}

/** Short insight sentences for annotations that fall inside the current period. */
export function annotationInsights(notes: { date: string; text: string }[], limit = 2) {
  return notes.slice(0, limit).map((a) => ({
    kind: 'note' as const,
    tone: 'neutral' as const,
    weight: 60,
    text: `Your note on ${a.date}: “${a.text}” falls in this period.`,
  }))
}
