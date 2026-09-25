/** Formats today's date the way a Nigerian business document would show it. */
export function formatDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default formatDate;
