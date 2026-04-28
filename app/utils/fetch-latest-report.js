export async function fetchLatestReportId(endpointUrl) {
  try {
    const url = `/validation-summaries?filter[endpoint-url]=${encodeURIComponent(endpointUrl)}&sort=-coverage-job.modified&page[size]=1`;
    const response = await fetch(url, { headers: { Accept: 'application/vnd.api+json' } });
    if (!response.ok) return null;
    const { data } = await response.json();
    return Array.isArray(data) ? (data[0]?.id ?? null) : null;
  } catch {
    return null;
  }
}
