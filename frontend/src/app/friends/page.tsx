'use client';

import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/page-layout';
import { Users, UserPlus, Search, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

export default function FriendsPage() {
  const [friends, setFriends] = useState<{ id: string; name: string; email: string; status: string; avatar: null }[]>([]);
  const [pendingRequests, setPendingRequests] = useState<{ id: string; name: string; email: string; avatar: null }[]>([]);

  useEffect(() => {
    if (USE_MOCK) {
      setFriends([
        { id: '1', name: 'Sarah Chen', email: 'sarah@example.com', status: 'online', avatar: null },
        { id: '2', name: 'Mike Johnson', email: 'mike@example.com', status: 'offline', avatar: null },
        { id: '3', name: 'Emily Davis', email: 'emily@example.com', status: 'away', avatar: null },
        { id: '4', name: 'Alex Rivera', email: 'alex@example.com', status: 'online', avatar: null },
      ]);
      setPendingRequests([
        { id: '5', name: 'Jordan Lee', email: 'jordan@example.com', avatar: null },
      ]);
    } else {
      setFriends([]);
      setPendingRequests([]);
    }
  }, []);

  return (
    <PageLayout title="Friends">
      <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search friends..." className="pl-10" />
              </div>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Friend
              </Button>
            </div>

            {pendingRequests.length > 0 && (
              <Card className="p-4">
                <h2 className="mb-4 text-lg font-semibold">Pending Requests</h2>
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{request.name}</p>
                          <p className="text-sm text-muted-foreground">{request.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="primary">Accept</Button>
                        <Button size="sm" variant="outline">Decline</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-4">
              <h2 className="mb-4 text-lg font-semibold">Friends ({friends.length})</h2>
              <div className="space-y-3">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                          friend.status === 'online' ? 'bg-green-500' :
                          friend.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">{friend.name}</p>
                        <p className="text-sm text-muted-foreground">{friend.email}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </PageLayout>
      );
    }
