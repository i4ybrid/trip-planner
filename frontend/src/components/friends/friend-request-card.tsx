'use client';

import { useState } from 'react';
import { Check, X, Ban, Clock, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FriendRequest } from '@/types';

interface FriendRequestCardProps {
  request: FriendRequest;
  type: 'received' | 'sent';
  onAccept?: () => void | Promise<void>;
  onDecline?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  onBlock?: () => void | Promise<void>;
}

export function FriendRequestCard({
  request,
  type,
  onAccept,
  onDecline,
  onCancel,
  onBlock,
}: FriendRequestCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const user = type === 'received' ? request.sender : request.receiver;
  const isReceived = type === 'received';

  const handleAction = async (action: () => void | Promise<void>) => {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
      <Avatar src={user?.avatarUrl} name={user?.name || 'Unknown'} size="md" />

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{user?.name || 'Unknown User'}</p>
        <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
        {isReceived && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {new Date(request.createdAt).toLocaleDateString()}
          </p>
        )}
        {!isReceived && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Waiting for response
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isReceived ? (
          <>
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleAction(onAccept!)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="mr-1 h-4 w-4" />
                  Accept
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction(onDecline!)}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
            {onBlock && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAction(onBlock!)}
                disabled={isLoading}
              >
                <Ban className="h-4 w-4" />
              </Button>
            )}
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction(onCancel!)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <X className="mr-1 h-4 w-4" />
                Cancel
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
