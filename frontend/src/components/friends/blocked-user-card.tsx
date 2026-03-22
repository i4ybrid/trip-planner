'use client';

import { useState } from 'react';
import { Ban, UserX, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BlockedUser } from '@/types';

interface BlockedUserCardProps {
  blocked: BlockedUser;
  onUnblock: () => void;
}

export function BlockedUserCard({ blocked, onUnblock }: BlockedUserCardProps) {
  const [isUnblocking, setIsUnblocking] = useState(false);

  const handleUnblock = async () => {
    setIsUnblocking(true);
    try {
      await onUnblock();
    } finally {
      setIsUnblocking(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
      <Avatar src={blocked.blocked?.avatarUrl} name={blocked.blocked?.name || 'Unknown'} size="md" />

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{blocked.blocked?.name || 'Unknown User'}</p>
        <p className="text-sm text-muted-foreground truncate">{blocked.blocked?.email}</p>
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={handleUnblock}
        disabled={isUnblocking}
      >
        {isUnblocking ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <UserX className="mr-2 h-4 w-4" />
        )}
        Unblock
      </Button>
    </div>
  );
}
