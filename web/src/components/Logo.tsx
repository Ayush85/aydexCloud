interface Props {
  /** Pixel height of the mark. */
  size?: number
  /** Hide the wordmark (mark only). */
  markOnly?: boolean
  /** "auto" follows the light/dark theme; "on-dark" is for always-dark surfaces (landing page). */
  tone?: 'auto' | 'on-dark'
  className?: string
}

/** aydex.cloud logo: an "A" chevron with a data point, plus the wordmark. */
export function Logo({ size = 26, markOnly = false, tone = 'auto', className = '' }: Props) {
  const stroke = tone === 'on-dark' ? 'stroke-[#F4F6F2]' : 'stroke-[#0E1B17] dark:stroke-[#F4F6F2]'
  const dot = tone === 'on-dark' ? 'fill-[#2DD4A0]' : 'fill-[#0E9F78] dark:fill-[#2DD4A0]'
  const word = tone === 'on-dark' ? 'text-[#F4F6F2]' : 'text-[#0E1B17] dark:text-[#F4F6F2]'
  const sub = tone === 'on-dark' ? 'text-[#9FB0A8]' : 'text-[#5B6B64] dark:text-[#9FB0A8]'
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} aria-label="aydex.cloud">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
        <path d="M12 54L32 12L52 54" fill="none" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" className={stroke} />
        <circle cx="32" cy="42" r="5" className={dot} />
      </svg>
      {!markOnly && (
        <span className={`font-bold leading-none tracking-tight ${word}`} style={{ fontSize: size * 0.72, letterSpacing: '-0.03em' }}>
          aydex<span className={`font-normal ${sub}`}>.cloud</span>
        </span>
      )}
    </span>
  )
}
