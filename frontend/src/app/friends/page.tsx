'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageLayout } from '@/components/page-layout';
import { Users, UserPlus, Search, Ban, Clock, Send, Loader2 } from 'lucide-react';
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
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search friends..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Friend
          </Button>
        </div>

        <div className="flex gap-1 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors relative',
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  'ml-1 rounded-full px-2 py-0.5 text-xs',
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {activeTab === 'friends' && (
              <Card className="p-4">
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
                  <div className="space-y-3">
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
              <Card className="p-4">
                <h2 className="mb-4 text-lg font-semibold">Friend Requests</h2>
                {receivedRequests.length === 0 ? (
                  <EmptyState
                    title="No pending requests"
                    description="When you receive friend requests, they'll appear here"
                  />
                ) : (
                  <div className="space-y-3">
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
              <Card className="p-4">
                <h2 className="mb-4 text-lg font-semibold">Sent Requests</h2>
                {sentRequests.length === 0 ? (
                  <EmptyState
                    title="No sent requests"
                    description="Sent friend requests will appear here"
                  />
                ) : (
                  <div className="space-y-3">
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
              <Card className="p-4">
                <h2 className="mb-4 text-lg font-semibold">Blocked Users</h2>
                {blockedUsers.length === 0 ? (
                  <EmptyState
                    title="No blocked users"
                    description="Blocked users won't appear in search results or be able to send you messages"
                  />
                ) : (
                  <div className="space-y-3">
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
