import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | undefined): string {
  if (!date) return 'TBD';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateRange(start?: string | Date, end?: string | Date): string {
  if (!start) return 'TBD';
  if (!end) return formatDate(start);
  
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
    return `${startMonth} ${startDate.getDate()}-${endDate.getDate()}, ${startDate.getFullYear()}`;
  }
  
  return `${formatDate(start)} - ${formatDate(end)}`;
}

export function formatCurrency(amount?: number, currency: string = 'USD'): string {
  if (!amount) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  
  // Take first letter from first name
  const initials = [parts[0][0].toUpperCase()];
  
  // If there are 3+ parts, include middle initial(s)
  if (parts.length >= 3) {
    // Add middle initial(s) - all parts between first and last
    for (let i = 1; i < parts.length - 1; i++) {
      initials.push(parts[i][0].toUpperCase());
    }
  }
  
  // Add last initial if there's more than just the first name
  if (parts.length >= 2) {
    initials.push(parts[parts.length - 1][0].toUpperCase());
  }
  
  return initials.join('').slice(0, 3); // Max 3 initials
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    IDEA: 'bg-gray-100 text-gray-800',
    PLANNING: 'bg-blue-100 text-blue-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    HAPPENING: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-gray-100 text-gray-600',
    CANCELLED: 'bg-red-100 text-red-800',
    INVITED: 'bg-yellow-100 text-yellow-800',
    DECLINED: 'bg-red-100 text-red-800',
    MAYBE: 'bg-orange-100 text-orange-800',
    REMOVED: 'bg-gray-100 text-gray-500',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return formatDate(date);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function generateShareUrl(token: string): string {
  return `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${token}`;
}

export function generateWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function generateTelegramShareUrl(message: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(message)}`;
}

export function generateEmailShareUrl(to: string, subject: string, body: string): string {
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
