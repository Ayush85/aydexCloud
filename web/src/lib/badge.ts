/** Flat two-part SVG badge. `visitors === null` renders a neutral "unavailable" badge. Only a number is ever interpolated. */
export function badgeSvg(visitors: number | null): string {
  const label = 'visitors · 7d'
  const value = visitors === null || !Number.isFinite(visitors) ? 'n/a' : Math.max(0, Math.floor(visitors)).toLocaleString('en-US')
  const lw = 8 + label.length * 6.4, vw = 12 + value.length * 7
  const w = Math.round(lw + vw)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${label}: ${value}">
<title>${label}: ${value}</title>
<rect width="${Math.round(lw)}" height="20" rx="3" fill="#3f3f46"/><rect x="${Math.round(lw)}" width="${Math.round(vw)}" height="20" rx="3" fill="#6366f1"/>
<rect x="${Math.round(lw) - 3}" width="6" height="20" fill="#6366f1"/>
<g fill="#fff" font-family="Verdana,DejaVu Sans,sans-serif" font-size="11" text-anchor="middle">
<text x="${Math.round(lw / 2)}" y="14">${label}</text><text x="${Math.round(lw + vw / 2)}" y="14" font-weight="bold">${value}</text></g></svg>`
}
