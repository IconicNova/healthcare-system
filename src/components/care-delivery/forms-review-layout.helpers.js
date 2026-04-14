export function buildFormsReviewFilterRows({ embedded, clientLocked }) {
  return [
    [
      { key: 'status', width: embedded ? 'minmax(180px, 220px)' : 'minmax(180px, 1fr)' },
      {
        key: 'client',
        width: embedded ? 'minmax(180px, 220px)' : 'minmax(180px, 1fr)',
        disabled: clientLocked,
      },
      { key: 'template', width: embedded ? 'minmax(200px, 1fr)' : 'minmax(180px, 1fr)' },
    ],
    [
      { key: 'dateRange', width: embedded ? 'minmax(320px, 420px)' : 'minmax(280px, 420px)' },
    ],
  ];
}
