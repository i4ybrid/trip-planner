import { Calendar, DollarSign, ThumbsUp, MessageSquare, Flag, Bell } from 'lucide-react';

export type NotificationType = 'reminder' | 'payment' | 'vote' | 'message' | 'milestone' | 'invite';

export const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
  reminder: <Calendar className="h-4 w-4" />,
  payment: <DollarSign className="h-4 w-4" />,
  vote: <ThumbsUp className="h-4 w-4" />,
  message: <MessageSquare className="h-4 w-4" />,
  milestone: <Flag className="h-4 w-4" />,
  invite: <Bell className="h-4 w-4" />,
};

export const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  payment: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  vote: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  reminder: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  message: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  milestone: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  invite: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    }
    return `${hours}h ago`;
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days}d ago`;
  }
  return date.toLocaleDateString();
}
