'use client';

import { useState } from 'react';
import { UserPlus, Mail, Copy, Check, Link, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { api } from '@/services/api';
import { User, UserRelationship } from '@/types';
import { cn } from '@/lib/utils';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestSent: () => void;
}

type SearchStatus = 'idle' | 'searching' | 'found' | 'not_found' | 'error' | 'sent' | 'already_friend';

export function AddFriendModal({ isOpen, onClose, onRequestSent }: AddFriendModalProps) {
  const [email, setEmail] = useState('');
  const [searchResult, setSearchResult] = useState<{
    user: User;
    relationship: UserRelationship;
  } | null>(null);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [copied, setCopied] = useState(false);

  const resetForm = () => {
    setEmail('');
    setSearchResult(null);
    setSearchStatus('idle');
    setInviteCode(null);
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSearch = async () => {
    if (!email.trim()) return;

    setSearchStatus('searching');
    setSearchResult(null);

    try {
      const result = await api.searchUsersByEmail(email.trim());

      if (result.error) {
        setSearchStatus('error');
        return;
      }

      if (!result.data?.found || !result.data?.user) {
        setSearchStatus('not_found');
        return;
      }

      setSearchResult({
        user: result.data.user,
        relationship: result.data.relationship || 'none',
      });

      if (result.data.relationship === 'friends') {
        setSearchStatus('already_friend');
      } else if (result.data.relationship === 'request_sent') {
        setSearchStatus('sent');
      } else {
        setSearchStatus('found');
      }
    } catch {
      setSearchStatus('error');
    }
  };

  const handleSendRequest = async () => {
    if (!searchResult) return;

    setIsSendingRequest(true);
    try {
      const result = await api.sendFriendRequest({ receiverId: searchResult.user.id });

      if (!result.error) {
        setSearchStatus('sent');
        onRequestSent();
      }
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleGenerateCode = async () => {
    setIsGeneratingCode(true);
    try {
      const result = await api.generateInviteCode(7);
      if (result.data) {
        setInviteCode(result.data.code);
      }
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleCopyCode = async () => {
    if (!inviteCode) return;

    const inviteLink = `${window.location.origin}/invite/${inviteCode}`;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Friend" size="md">
      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium">Search by email</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                placeholder="friend@email.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={searchStatus === 'searching'}
              />
            </div>
            <Button onClick={handleSearch} disabled={!email.trim() || searchStatus === 'searching'}>
              {searchStatus === 'searching' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </div>
        </div>

        {searchStatus === 'found' && searchResult && (
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <Avatar src={searchResult.user.avatarUrl} name={searchResult.user.name} size="md" />
              <div className="flex-1">
                <p className="font-medium">{searchResult.user.name}</p>
                <p className="text-sm text-muted-foreground">{searchResult.user.email}</p>
              </div>
              <Button onClick={handleSendRequest} disabled={isSendingRequest}>
                {isSendingRequest ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Send Request
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {searchStatus === 'already_friend' && searchResult && (
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <Avatar src={searchResult.user.avatarUrl} name={searchResult.user.name} size="md" />
              <div className="flex-1">
                <p className="font-medium">{searchResult.user.name}</p>
                <p className="text-sm text-muted-foreground">Already friends</p>
              </div>
            </div>
          </div>
        )}

        {searchStatus === 'sent' && searchResult && (
          <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              <Avatar src={searchResult.user.avatarUrl} name={searchResult.user.name} size="md" />
              <div className="flex-1">
                <p className="font-medium">{searchResult.user.name}</p>
                <p className="text-sm text-primary">Request sent!</p>
              </div>
            </div>
          </div>
        )}

        {searchStatus === 'not_found' && (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No user found with this email</p>
            <p className="mt-1 text-sm text-muted-foreground">Try inviting them instead</p>
          </div>
        )}

        {searchStatus === 'error' && (
          <div className="text-center py-4">
            <p className="text-destructive">Something went wrong. Please try again.</p>
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Invite someone new</label>
          {!inviteCode ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGenerateCode}
              disabled={isGeneratingCode}
            >
              {isGeneratingCode ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link className="mr-2 h-4 w-4" />
              )}
              Generate Invite Code
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
                <code className="flex-1 text-center font-mono text-lg font-semibold">{inviteCode}</code>
                <Button size="sm" variant="ghost" onClick={handleCopyCode}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Share this link: {typeof window !== 'undefined' && `${window.location.origin}/invite/${inviteCode}`}
              </p>
              <Button variant="outline" className="w-full" onClick={handleCopyCode}>
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-dashed border-muted-foreground/25 p-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">Send Email Invitation</p>
              <p className="text-sm text-muted-foreground">Coming soon</p>
            </div>
            <Button variant="secondary" disabled>
              Coming soon
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
