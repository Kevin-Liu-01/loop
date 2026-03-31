type SeoJsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

function safeJsonLdStringify(payload: unknown): string {
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}

export function SeoJsonLd({ data }: SeoJsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(data) }}
    />
  );
}
