'use client';

import { useEffect, useState } from 'react';
import { PageLayout } from '@/components/page-layout';
import { Users, UserPlus, Search, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api } from '@/services/api';
import { Friend, FriendRequest } from '@/types';

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [friendsResult, requestsResult] = await Promise.all([
        api.getFriends(),
        api.getFriendRequests(),
      ]);
      if (friendsResult.data) setFriends(friendsResult.data);
      if (requestsResult.data) setFriendRequests(requestsResult.data.received);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleAcceptRequest = async (requestId: string) => {
    const result = await api.respondToFriendRequest(requestId, 'ACCEPTED');
    if (!result.error) {
      setFriendRequests(fr => fr.filter(r => r.id !== requestId));
      api.getFriends().then(r => r.data && setFriends(r.data));
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    const result = await api.respondToFriendRequest(requestId, 'DECLINED');
    if (!result.error) {
      setFriendRequests(fr => fr.filter(r => r.id !== requestId));
    }
  };

  const filteredFriends = friends.filter(f => {
    const name = f.friend?.name?.toLowerCase() || '';
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <PageLayout title="Friends">
      <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search friends..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Friend
              </Button>
            </div>

            {friendRequests.length > 0 && (
              <Card className="p-4">
                <h2 className="mb-4 text-lg font-semibold">Pending Requests</h2>
                <div className="space-y-3">
                  {friendRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{request.sender?.name || 'Unknown User'}</p>
                          <p className="text-sm text-muted-foreground">Friend Request</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="default" onClick={() => handleAcceptRequest(request.id)}>Accept</Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeclineRequest(request.id)}>Decline</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-4">
              <h2 className="mb-4 text-lg font-semibold">Friends ({filteredFriends.length})</h2>
              {isLoading ? (
                <div className="flex justify-center py-8">Loading...</div>
              ) : filteredFriends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No friends found' : 'No friends yet'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFriends.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                        </div>
                        <div>
                          <p className="font-medium">{friend.friend?.name || 'Unknown User'}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </PageLayout>
      );
    }
