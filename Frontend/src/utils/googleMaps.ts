const iframeSrcPattern = /<iframe[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/i;

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

export const normalizeGoogleMapsEmbedUrl = (value?: string) => {
  if (!value) return '';

  const trimmed = decodeHtmlEntities(value.trim());
  const iframeMatch = trimmed.match(iframeSrcPattern);
  return iframeMatch ? decodeHtmlEntities(iframeMatch[1].trim()) : trimmed;
};

export const isGoogleMapsEmbedUrl = (value?: string) => {
  const normalized = normalizeGoogleMapsEmbedUrl(value);
  if (!normalized) return false;

  try {
    const url = new URL(normalized);
    const hostname = url.hostname.toLowerCase();
    const isGoogleHost = /^(.+\.)?google\.[a-z.]+$/.test(hostname);
    const isWebProtocol = url.protocol === 'https:' || url.protocol === 'http:';
    return isWebProtocol && isGoogleHost && url.pathname.startsWith('/maps/embed');
  } catch {
    return false;
  }
};
