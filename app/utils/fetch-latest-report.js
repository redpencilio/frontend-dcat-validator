export async function fetchLatestReport(endpointUrl) {
  try {
    const url = `/validation-summaries?filter[endpoint-url]=${encodeURIComponent(endpointUrl)}&sort=-coverage-job.modified&page[size]=1&include=coverage-job`;
    const response = await fetch(url, { headers: { Accept: 'application/vnd.api+json' } });
    if (!response.ok) return null;
    const { data, included } = await response.json();
    if (!Array.isArray(data) || !data[0]) return null;
    const summary = data[0];
    const jobId = summary.relationships?.['coverage-job']?.data?.id;
    const job = included?.find((r) => r.type === 'validation-jobs' && r.id === jobId);
    const date = job?.attributes?.modified ?? job?.attributes?.created ?? null;
    return { id: summary.id, date };
  } catch {
    return null;
  }
}
