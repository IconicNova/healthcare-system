export function buildReviewQueueFilters(searchParams = {}) {
  return {
    status: searchParams.status || '',
    clientId: searchParams.clientId || '',
    templateId: searchParams.templateId || '',
    dateFrom: searchParams.dateFrom || '',
    dateTo: searchParams.dateTo || '',
  };
}
