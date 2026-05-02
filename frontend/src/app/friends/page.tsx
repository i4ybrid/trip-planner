'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageLayout } from '@/components/page-layout';
import { Users, UserPlus, Search, Ban, Clock, Send, Loader2, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/modal';
import { AddFriendModal, FriendCard, FriendRequestCard, BlockedUserCard } from '@/components/friends';
import { api } from '@/services/api';
import { Friend, FriendRequest, BlockedUser } from '@/types';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

type Tab = 'friends' | 'pending' | 'sent' | 'blocked';

function FriendsPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = (searchParams.get('tab') as Tab) || 'friends';

  const [friends, setFriends] = useState<Friend[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab') as Tab;
    if (tab && ['friends', 'pending', 'sent', 'blocked'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/friends?${params.toString()}`, { scroll: false });
  };

  const loadData = useCallback(async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      const [friendsResult, requestsResult, blockedResult] = await Promise.all([
        api.getFriends(),
        api.getFriendRequests(),
        api.getBlockedUsers(),
      ]);

      if (friendsResult.data) setFriends(friendsResult.data);
      if (requestsResult.data) {
        setReceivedRequests(requestsResult.data.received);
        setSentRequests(requestsResult.data.sent);
      }
      if (blockedResult.data) setBlockedUsers(blockedResult.data);
    } catch (error) {
      logger.error('Failed to load data:', error);
    }
    setIsLoading(false);
  }, [session]);

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session, loadData]);

  const handleAcceptRequest = async (requestId: string) => {
    const result = await api.respondToFriendRequest(requestId, 'ACCEPTED');
    if (!result.error) {
      setReceivedRequests(req => req.filter(r => r.id !== requestId));
      loadData();
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    const result = await api.respondToFriendRequest(requestId, 'DECLINED');
    if (!result.error) {
      setReceivedRequests(req => req.filter(r => r.id !== requestId));
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/friend-requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      setSentRequests(req => req.filter(r => r.id !== requestId));
    } catch (error) {
      logger.error('Failed to cancel request:', error);
    }
  };

  const handleBlockFromRequest = async (request: FriendRequest) => {
    const userId = request.sender?.id;
    if (!userId) return;

    const result = await api.blockUser(userId);
    if (!result.error) {
      setReceivedRequests(req => req.filter(r => r.id !== request.id));
      loadData();
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    const result = await api.removeFriend(friendId);
    if (!result.error) {
      setFriends(f => f.filter(fr => fr.friendId !== friendId));
    }
  };

  const handleBlockFriend = async (friendId: string) => {
    const result = await api.blockUser(friendId);
    if (!result.error) {
      setFriends(f => f.filter(fr => fr.friendId !== friendId));
      loadData();
    }
  };

  const handleUnblockUser = async (userId: string) => {
    const result = await api.unblockUser(userId);
    if (!result.error) {
      setBlockedUsers(b => b.filter(u => u.blockedId !== userId));
    }
  };

  const handleMessage = (friendId: string) => {
    router.push(`/messages?friend=${friendId}`);
  };

  const filteredFriends = friends.filter(f => {
    const name = f.friend?.name?.toLowerCase() || '';
    const email = f.friend?.email?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  if (status === 'loading') {
    return (
      <PageLayout title="Friends">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  const tabs = [
    { id: 'friends' as Tab, label: 'All Friends', count: friends.length, icon: Users },
    { id: 'pending' as Tab, label: 'Pending', count: receivedRequests.length, icon: Clock },
    { id: 'sent' as Tab, label: 'Sent', count: sentRequests.length, icon: Send },
    { id: 'blocked' as Tab, label: 'Blocked', count: blockedUsers.length, icon: Ban },
  ];

  return (
    <PageLayout title="Friends">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-lg border border-border/70 bg-card/85 p-5 shadow-[var(--travel-card-shadow)] backdrop-blur md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Travel Crew
              </div>
              <div>
                <h1 className="font-display text-4xl font-bold leading-tight text-foreground md:text-5xl">
                  Keep your trip people close.
                </h1>
                <p className="mt-2 max-w-xl text-base text-muted-foreground">
                  Search, invite, and manage the friends you plan with most often.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:min-w-[22rem]">
              <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Friends</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{friends.length}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Pending</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{receivedRequests.length}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Blocked</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{blockedUsers.length}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card/80 p-3 shadow-[var(--travel-card-shadow)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <Input
              placeholder="Search friends..."
              className="h-12 rounded-lg border-border/70 bg-background/80 pl-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="h-12 shrink-0 rounded-lg px-5" onClick={() => setShowAddModal(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Friend
          </Button>
        </div>

        <div className="grid gap-2 rounded-lg border border-border/70 bg-card/80 p-2 shadow-[var(--travel-card-shadow)] backdrop-blur sm:grid-cols-2 lg:grid-cols-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-background/80 hover:text-foreground'
              )}
            >
              <span className="flex items-center gap-2">
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </span>
              <span className={cn(
                'rounded-full px-2 py-0.5 text-xs',
                activeTab === tab.id
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center rounded-lg border border-border/70 bg-card/80 py-16 shadow-[var(--travel-card-shadow)] backdrop-blur">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {activeTab === 'friends' && (
              <Card className="border-border/70 bg-card/85 p-4 shadow-[var(--travel-card-shadow)] backdrop-blur">
                {filteredFriends.length === 0 ? (
                  <EmptyState
                    title={searchQuery ? 'No friends found' : 'No friends yet'}
                    description={searchQuery ? 'Try a different search term' : 'Add friends to start planning trips together'}
                    action={
                      !searchQuery && (
                        <Button onClick={() => setShowAddModal(true)}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Friend
                        </Button>
                      )
                    }
                  />
                ) : (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {filteredFriends.map((friend) => (
                      <FriendCard
                        key={friend.id}
                        friend={friend}
                        onMessage={() => handleMessage(friend.friendId)}
                        onRemove={() => handleRemoveFriend(friend.friendId)}
                        onBlock={() => handleBlockFriend(friend.friendId)}
                      />
                    ))}
                  </div>
                )}
              </Card>
            )}

            {activeTab === 'pending' && (
              <Card className="border-border/70 bg-card/85 p-4 shadow-[var(--travel-card-shadow)] backdrop-blur">
                <h2 className="mb-4 font-display text-2xl font-bold">Friend Requests</h2>
                {receivedRequests.length === 0 ? (
                  <EmptyState
                    title="No pending requests"
                    description="When you receive friend requests, they'll appear here"
                  />
                ) : (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {receivedRequests.map((request) => (
                      <FriendRequestCard
                        key={request.id}
                        request={request}
                        type="received"
                        onAccept={() => handleAcceptRequest(request.id)}
                        onDecline={() => handleDeclineRequest(request.id)}
                        onBlock={() => handleBlockFromRequest(request)}
                      />
                    ))}
                  </div>
                )}
              </Card>
            )}

            {activeTab === 'sent' && (
              <Card className="border-border/70 bg-card/85 p-4 shadow-[var(--travel-card-shadow)] backdrop-blur">
                <h2 className="mb-4 font-display text-2xl font-bold">Sent Requests</h2>
                {sentRequests.length === 0 ? (
                  <EmptyState
                    title="No sent requests"
                    description="Sent friend requests will appear here"
                  />
                ) : (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {sentRequests.map((request) => (
                      <FriendRequestCard
                        key={request.id}
                        request={request}
                        type="sent"
                        onCancel={() => handleCancelRequest(request.id)}
                      />
                    ))}
                  </div>
                )}
              </Card>
            )}

            {activeTab === 'blocked' && (
              <Card className="border-border/70 bg-card/85 p-4 shadow-[var(--travel-card-shadow)] backdrop-blur">
                <h2 className="mb-4 font-display text-2xl font-bold">Blocked Users</h2>
                {blockedUsers.length === 0 ? (
                  <EmptyState
                    title="No blocked users"
                    description="Blocked users won't appear in search results or be able to send you messages"
                  />
                ) : (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {blockedUsers.map((blocked) => (
                      <BlockedUserCard
                        key={blocked.id}
                        blocked={blocked}
                        onUnblock={() => handleUnblockUser(blocked.blockedId)}
                      />
                    ))}
                  </div>
                )}
              </Card>
            )}
          </>
        )}

        <AddFriendModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onRequestSent={() => {
            loadData();
            handleTabChange('sent');
          }}
        />
      </div>
    </PageLayout>
  );
}

export default function FriendsPage() {
  return (
    <Suspense fallback={
      <PageLayout title="Friends">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </PageLayout>
    }>
      <FriendsPageContent />
    </Suspense>
  );
}
