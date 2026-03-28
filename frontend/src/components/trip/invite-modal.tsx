'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button, Input, Avatar, Badge } from '@/components';
import { api } from '@/services/api';
import { User, TripMember, TripStyle, Friend } from '@/types';
import { Search, Users, Link, Mail, Copy, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripStyle: TripStyle;
  onMemberAdded?: () => void;
}

export function InviteModal({ isOpen, onClose, tripId, tripStyle, onMemberAdded }: InviteModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set());
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailStatus, setEmailStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      loadFriends();
    }
  }, [isOpen]);

  const loadFriends = async () => {
    const result = await api.getFriends();
    if (result.data) {
      setFriends(result.data);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const result = await api.searchUsersByEmail(searchQuery);
      if (result.data?.found && result.data.user) {
        setSearchResults([result.data.user]);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInviteUser = async (userId: string) => {
    setIsInviting(true);
    setError(null);
    try {
      await api.addTripMember(tripId, userId);
      setInvitedUsers((prev) => {
        const newSet = new Set(Array.from(prev));
        newSet.add(userId);
        return newSet;
      });
      onMemberAdded?.();
    } catch (error: any) {
      setError(error.message || 'Failed to invite user');
    } finally {
      setIsInviting(false);
    }
  };

  const handleGenerateCode = async () => {
    const result = await api.generateTripInviteCode(tripId);
    if (result.data) {
      setInviteCode(result.data.code || result.data.inviteUrl?.split('/').pop() || null);
    }
  };

  const handleCopyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(`${window.location.origin}/invite/${inviteCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendEmail = async () => {
    if (!emailInput.trim()) return;
    setEmailStatus(null);
    try {
      const result = await api.sendTripEmailInvite(tripId, emailInput);
      setEmailStatus({
        success: result.data?.success || false,
        message: result.data?.message || result.error || 'Unknown response'
      });
      if (result.data?.existingUserNotified) {
        onMemberAdded?.();
      }
    } catch (error: any) {
      setEmailStatus({
        success: false,
        message: error.message || 'Failed to send invite'
      });
    }
  };

  const displayFriends = friends
    .map(f => f.friend)
    .filter(Boolean) as User[];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite to Trip" className="max-w-lg">
      <div className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
          {isSearching && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          )}
          {searchResults.length > 0 && (
            <div className="mt-2 space-y-2">
              {searchResults.map(result => (
                <div key={result.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={result.avatarUrl} name={result.name} size="sm" />
                    <div>
                      <p className="font-medium">{result.name}</p>
                      <p className="text-xs text-muted-foreground">{result.email}</p>
                    </div>
                  </div>
                  {invitedUsers.has(result.id) ? (
                    <Badge variant="outline" className="text-green-600">
                      <Check className="mr-1 h-3 w-3" /> Invited
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleInviteUser(result.id)}
                      disabled={isInviting}
                    >
                      {isInviting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                      Invite
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-border" />
          <span className="flex-shrink-0 mx-4 text-muted-foreground">OR</span>
          <div className="flex-grow border-t border-border" />
        </div>

        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4" />
            Select from Friends
          </h4>
          {displayFriends.length > 0 ? (
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {displayFriends.map(friend => (
                <div key={friend.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={friend.avatarUrl} name={friend.name} size="sm" />
                    <div>
                      <p className="font-medium">{friend.name}</p>
                      <p className="text-xs text-muted-foreground">{friend.email}</p>
                    </div>
                  </div>
                  {invitedUsers.has(friend.id) ? (
                    <Badge variant="outline" className="text-green-600">
                      <Check className="mr-1 h-3 w-3" /> Invited
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleInviteUser(friend.id)}
                      disabled={isInviting}
                    >
                      {isInviting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                      Invite
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No friends yet. Add some friends first!</p>
          )}
        </div>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-border" />
          <span className="flex-shrink-0 mx-4 text-muted-foreground">OR</span>
          <div className="flex-grow border-t border-border" />
        </div>

        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Link className="h-4 w-4" />
            Generate Invite Link
          </h4>
          {!inviteCode ? (
            <Button variant="outline" onClick={handleGenerateCode} className="w-full">
              Generate Invite Link
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${inviteCode}`}
                readOnly
                className="font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={handleCopyCode}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-border" />
          <span className="flex-shrink-0 mx-4 text-muted-foreground">OR</span>
          <div className="flex-grow border-t border-border" />
        </div>

        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4" />
            Invite by Email
            <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
          </h4>
          <div className="flex gap-2">
            <Input
              placeholder="Enter email address..."
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              type="email"
            />
            <Button variant="outline" onClick={handleSendEmail}>
              Send
            </Button>
          </div>
          {emailStatus && (
            <p className={`mt-2 text-sm ${emailStatus.success ? 'text-green-600' : 'text-red-600'}`}>
              {emailStatus.message}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}