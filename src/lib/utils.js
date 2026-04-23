/**
 * Format number as USD currency
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

/**
 * Format date as readable string
 */
export function formatDate(date, options = {}) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function timeAgo(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now - d) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate initials from a full name
 */
export function getInitials(name) {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Pipeline status labels & colors
 */
export const PIPELINE_STAGES = [
  { key: 'new_lead', label: 'New Lead', color: '#60a5fa' },
  { key: 'contacted', label: 'Contacted', color: '#a78bfa' },
  { key: 'appointment_set', label: 'Appointment Set', color: '#fbbf24' },
  { key: 'estimate_sent', label: 'Estimate Sent', color: '#fb923c' },
  { key: 'closed_won', label: 'Closed Won', color: '#34d399' },
  { key: 'closed_lost', label: 'Lost', color: '#f87171' },
];

/**
 * Project status labels & colors
 */
export const PROJECT_STATUSES = [
  { key: 'pending', label: 'Pending', color: '#94a3b8' },
  { key: 'scheduled', label: 'Scheduled', color: '#60a5fa' },
  { key: 'in_progress', label: 'In Progress', color: '#fbbf24' },
  { key: 'on_hold', label: 'On Hold', color: '#fb923c' },
  { key: 'completed', label: 'Completed', color: '#34d399' },
  { key: 'cancelled', label: 'Cancelled', color: '#f87171' },
];
