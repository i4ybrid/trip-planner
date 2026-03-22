'use client';

import { useState } from 'react';
import { MessageSquare, MoreVertical, UserX, Ban } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Friend } from '@/types';
import { cn } from '@/lib/utils';

interface FriendCardProps {
  friend: Friend;
  onMessage: () => void;
  onRemove: () => void;
  onBlock: () => void;
}

export function FriendCard({ friend, onMessage, onRemove, onBlock }: FriendCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove();
    } finally {
      setIsRemoving(false);
      setShowMenu(false);
    }
  };

  const handleBlock = async () => {
    setIsBlocking(true);
    try {
      await onBlock();
    } finally {
      setIsBlocking(false);
      setShowMenu(false);
    }
  };

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
      <div className="relative">
        <Avatar
          src={friend.friend?.avatarUrl}
          name={friend.friend?.name || 'Unknown'}
          size="md"
        />
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{friend.friend?.name || 'Unknown User'}</p>
        <p className="text-sm text-muted-foreground truncate">{friend.friend?.email}</p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onMessage}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <MessageSquare className="mr-1 h-4 w-4" />
        Message
      </Button>

      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowMenu(!showMenu)}
          className="h-8 w-8"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-md border bg-background py-1 shadow-lg">
              <button
                onClick={onMessage}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
              >
                <MessageSquare className="h-4 w-4" />
                Message
              </button>
              <button
                onClick={handleBlock}
                disabled={isBlocking}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
              >
                <Ban className="h-4 w-4" />
                {isBlocking ? 'Blocking...' : 'Block User'}
              </button>
              <hr className="my-1 border-border" />
              <button
                onClick={handleRemove}
                disabled={isRemoving}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                <UserX className="h-4 w-4" />
                {isRemoving ? 'Removing...' : 'Remove Friend'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
