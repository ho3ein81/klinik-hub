/**
 * Emits one schema.org block as JSON-LD. Server component on purpose: the
 * script has to be in the HTML that leaves the server, because that is the
 * document Google parses for structured data.
 *
 * `</script>` inside a string value would end the tag early, so it is escaped —
 * the only injection risk here, since article bodies reach this component as
 * text.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return null

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
