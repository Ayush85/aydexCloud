/** Renders a JSON-LD structured data block. Content is server-generated, never user input. */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  // "<" is escaped so a stray "</script>" in a string can never close the tag early.
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
