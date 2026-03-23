'use client';

import { useState, useEffect } from 'react';
import { X, Search, MessageCircle, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { api } from '@/services/api';
import { Friend } from '@/types';

import { DmConversation } from '@/types';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversation: DmConversation) => void;
  currentUserId: string;
}

export function NewConversationModal({
  isOpen,
  onClose,
  onConversationCreated,
}: NewConversationModalProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [creatingId, setCreatingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadFriends();
    }
  }, [isOpen]);

  const loadFriends = async () => {
    setIsLoading(true);
    try {
      const result = await api.getFriends();
      if (result.data) {
        setFriends(result.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFriends = friends.filter((f) => {
    const name = f.friend?.name?.toLowerCase() || '';
    const email = f.friend?.email?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  const handleSelectFriend = async (friendId: string) => {
    setCreatingId(friendId);
    try {
      const result = await api.createDmConversation(friendId);
      if (result.data) {
        onConversationCreated(result.data);
        onClose();
      }
    } finally {
      setCreatingId(null);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Message" size="sm">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search friends..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No friends found' : 'No friends yet'}
            </div>
          ) : (
            filteredFriends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => handleSelectFriend(friend.friendId)}
                disabled={creatingId === friend.friendId}
                className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted disabled:opacity-50"
              >
                <div className="relative">
                  <Avatar
                    src={friend.friend?.avatarUrl}
                    name={friend.friend?.name || 'Unknown'}
                    size="sm"
                  />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{friend.friend?.name || 'Unknown User'}</p>
                  <p className="text-sm text-muted-foreground truncate">{friend.friend?.email}</p>
                </div>
                {creatingId === friend.friendId && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {creatingId !== friend.friendId && (
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
