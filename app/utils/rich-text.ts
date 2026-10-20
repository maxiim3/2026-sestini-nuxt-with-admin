const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }

/** Markdown minimal et sûr : paragraphes (ligne vide), retours à la ligne, **gras**, *italique* */
export function richText(source: string): string {
  const escaped = source.replace(/[&<>"']/g, c => ESCAPES[c]!)
  return escaped
    .split(/\n{2,}/)
    .map(block => block
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>'))
    .map(block => `<p>${block}</p>`)
    .join('')
}
