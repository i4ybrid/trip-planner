'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTripStore, useActivityStore } from '@/store';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Badge, Input, Textarea, Select, Modal, Avatar, EmptyState, LoadingOverlay } from '@/components';
import { formatDateRange, formatCurrency, cn } from '@/lib/utils';
import { mockApi, mockTrip } from '@/services/mock-api';
import { LeftSidebar } from '@/components/left-sidebar';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { NotificationDrawer } from '@/components/notification-drawer';
import { MapPin, Calendar, Users, DollarSign, ThumbsUp, ThumbsDown, HelpCircle, Plus, Settings, Share2, ArrowLeft, Send, CreditCard, Clock, CheckCircle2, AlertCircle, Wallet, MessageCircle, Images } from 'lucide-react';
import { CreateActivityInput, ActivityCategory, TripMessage, TripEvent, Settlement, User, MediaItem } from '@/types';

const categoryOptions = [
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'excursion', label: 'Excursion' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'transport', label: 'Transport' },
  { value: 'activity', label: 'Activity' },
  { value: 'other', label: 'Other' },
];

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const { currentTrip, isLoading, error, fetchTrip, updateTrip, changeStatus } = useTripStore();
  const { activities, fetchActivities, createActivity, castVote } = useActivityStore();

  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddMemoryModal, setShowAddMemoryModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'activities' | 'chat' | 'payments' | 'memories'>('activities');
  const [newActivity, setNewActivity] = useState<CreateActivityInput>({
    title: '',
    category: 'activity',
  });
  
  const [messages, setMessages] = useState<TripMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [events, setEvents] = useState<TripEvent[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [balances, setBalances] = useState<{ userId: string; balance: number; user?: User }[]>([]);
  const [memories, setMemories] = useState<MediaItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  
  const tripMembers = mockTrip.getTripMembersWithUsers(tripId);

  useEffect(() => {
    if (tripId) {
      fetchTrip(tripId);
      fetchActivities(tripId);
      mockApi.getMessages(tripId).then(r => r.data && setMessages(r.data));
      mockApi.getEvents(tripId).then(r => r.data && setEvents(r.data));
      mockApi.getSettlements(tripId).then(r => r.data && setSettlements(r.data));
      mockApi.getBalances(tripId).then(r => r.data && setBalances(r.data));
      mockApi.getMedia(tripId).then(r => r.data && setMemories(r.data));
    }
  }, [tripId, fetchTrip, fetchActivities]);

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    await createActivity(tripId, newActivity);
    setShowActivityModal(false);
    setNewActivity({ title: '', category: 'activity' });
  };

  const handleVote = async (activityId: string, option: 'yes' | 'no' | 'maybe') => {
    await castVote(activityId, option);
  };

  const getUserName = (userId: string) => {
    const names: Record<string, string> = {
      'user-1': 'Test User',
      'user-2': 'Sarah Chen',
      'user-3': 'Mike Johnson',
      'user-4': 'Emma Wilson',
    };
    return names[userId] || 'Unknown';
  };

  const handleMessageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');
    
    setNewMessage(value);
    
    if (lastAtPos !== -1) {
      const searchText = textBeforeCursor.slice(lastAtPos + 1);
      const isLastAt = !textBeforeCursor.slice(lastAtPos + 1).includes(' ');
      
      if (isLastAt || searchText.length > 0) {
        setShowMentions(true);
        setMentionSearch(searchText.toLowerCase());
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (name: string) => {
    const cursorPos = document.getElementById('chat-input')?.selectionStart || newMessage.length;
    const textBeforeCursor = newMessage.slice(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtPos !== -1) {
      const textAfterCursor = newMessage.slice(cursorPos);
      const textBeforeAt = newMessage.slice(0, lastAtPos);
      const newText = `${textBeforeAt}@${name} ${textAfterCursor}`;
      setNewMessage(newText);
    }
    setShowMentions(false);
    document.getElementById('chat-input')?.focus();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const result = await mockApi.sendMessage(tripId, 'user-1', { content: newMessage });
    if (result.data) {
      setMessages([...messages, result.data]);
      setNewMessage('');
      setShowMentions(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const getVoteCounts = (activity: typeof activities[0]) => {
    const votes = activity.votes || [];
    return {
      yes: votes.filter((v) => v.option === 'yes').length,
      no: votes.filter((v) => v.option === 'no').length,
      maybe: votes.filter((v) => v.option === 'maybe').length,
    };
  };

  if (isLoading && !currentTrip) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !currentTrip) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error || 'Trip not found'}</p>
        <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LeftSidebar />
      <div className="lg:pl-64">
        <header className="relative h-48 bg-gradient-to-br from-primary to-primary/60">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="relative mx-auto flex h-full max-w-6xl items-end justify-between p-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-5 w-5 text-white" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">{currentTrip.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-4 text-white/80">
                  {currentTrip.destination && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {currentTrip.destination}
                  </span>
                )}
                {currentTrip.startDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDateRange(currentTrip.startDate, currentTrip.endDate)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowInviteModal(true)}>
              <Share2 className="mr-2 h-4 w-4" />
              Invite
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur lg:left-64">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">{currentTrip.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <NotificationDrawer />
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-6 flex items-center gap-4">
          <Badge status={currentTrip.status} className="text-sm" />
          <Select
            value={currentTrip.status}
            onChange={(e) => changeStatus(tripId, e.target.value as any)}
            options={[
              { value: 'IDEA', label: 'Idea (Feelers)' },
              { value: 'PLANNING', label: 'Planning' },
              { value: 'CONFIRMED', label: 'Confirmed' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
        </div>

        <div className="mb-6 flex gap-2">
          {[
            { id: 'activities', label: 'Activities', icon: <HelpCircle className="h-4 w-4" /> },
            { id: 'chat', label: 'Chat', icon: <MessageCircle className="h-4 w-4" /> },
            { id: 'payments', label: 'Payments', icon: <Wallet className="h-4 w-4" /> },
            { id: 'memories', label: 'Memories', icon: <Images className="h-4 w-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'activities' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Activities</CardTitle>
                  <Button size="sm" onClick={() => setShowActivityModal(true)}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <EmptyState
                    title="No activities yet"
                    description="Propose activities for the group to vote on"
                  />
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => {
                      const counts = getVoteCounts(activity);
                      return (
                        <div
                          key={activity.id}
                          className="rounded-lg border border-border p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{activity.title}</h4>
                              {activity.description && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {activity.description}
                                </p>
                              )}
                              <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                                {activity.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {activity.location}
                                  </span>
                                )}
                                {activity.cost && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    {formatCurrency(activity.cost)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge>{activity.category}</Badge>
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleVote(activity.id, 'yes')}
                                className={cn(
                                  'flex items-center gap-1 rounded-md px-3 py-1 text-sm transition-colors',
                                  (activity.votes || []).some(
                                    (v) => v.userId === 'user-1' && v.option === 'yes'
                                  )
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-secondary hover:bg-secondary/80'
                                )}
                              >
                                <ThumbsUp className="h-3 w-3" />
                                {counts.yes}
                              </button>
                              <button
                                onClick={() => handleVote(activity.id, 'maybe')}
                                className={cn(
                                  'flex items-center gap-1 rounded-md px-3 py-1 text-sm transition-colors',
                                  (activity.votes || []).some(
                                    (v) => v.userId === 'user-1' && v.option === 'maybe'
                                  )
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-secondary hover:bg-secondary/80'
                                )}
                              >
                                <HelpCircle className="h-3 w-3" />
                                {counts.maybe}
                              </button>
                              <button
                                onClick={() => handleVote(activity.id, 'no')}
                                className={cn(
                                  'flex items-center gap-1 rounded-md px-3 py-1 text-sm transition-colors',
                                  (activity.votes || []).some(
                                    (v) => v.userId === 'user-1' && v.option === 'no'
                                  )
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-secondary hover:bg-secondary/80'
                                )}
                              >
                                <ThumbsDown className="h-3 w-3" />
                                {counts.no}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentTrip.description && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                    <p className="mt-1">{currentTrip.description}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <p className="mt-1 capitalize">{currentTrip.status.toLowerCase()}</p>
                </div>
                {currentTrip.startDate && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Dates</h4>
                    <p className="mt-1">
                      {formatDateRange(currentTrip.startDate, currentTrip.endDate)}
                    </p>
                  </div>
                )}
                {currentTrip.destination && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Destination</h4>
                    <p className="mt-1">{currentTrip.destination}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        )}

        {activeTab === 'chat' && (
          <Card>
            <CardHeader>
              <CardTitle>Group Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-96 flex-col">
                <div className="flex-1 space-y-4 overflow-y-auto rounded-lg border border-border p-4">
                  {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={cn('flex', msg.userId === 'user-1' ? 'justify-end' : 'justify-start')}>
                        <div className="flex items-end gap-2">
                          {msg.userId !== 'user-1' && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                              {getUserName(msg.userId).charAt(0)}
                            </div>
                          )}
                          <div className={cn('max-w-[70%] rounded-lg px-4 py-2', msg.userId === 'user-1' ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>
                            {msg.userId !== 'user-1' && <p className="mb-1 text-xs font-medium">{getUserName(msg.userId)}</p>}
                            <p className="text-sm">{msg.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="relative mt-4">
                  {showMentions && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 max-h-48 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-lg">
                      <button type="button" onClick={() => insertMention('everyone')} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"><Users className="h-4 w-4" /></div>
                        <span className="font-medium">@everyone</span>
                        <span className="text-xs text-muted-foreground">Notify all</span>
                      </button>
                      {tripMembers.filter(m => !mentionSearch || m.user.name.toLowerCase().includes(mentionSearch)).map((member) => (
                        <button key={member.userId} type="button" onClick={() => insertMention(member.user.name.split(' ')[0])} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">{member.user.name.charAt(0)}</div>
                          <span>{member.user.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input id="chat-input" placeholder="Type a message... (@ to mention)" value={newMessage} onChange={handleMessageInputChange} onBlur={() => setTimeout(() => setShowMentions(false), 200)} className="flex-1" />
                    <Button type="submit"><Send className="h-4 w-4" /></Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'payments' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" /> Budget Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-secondary p-4">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-2xl font-bold">{formatCurrency(activities.reduce((sum, a) => sum + (a.cost || 0), 0))}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-green-50 p-4 dark:bg-green-950">
                  <span className="text-muted-foreground">Collected</span>
                  <span className="text-2xl font-bold text-green-600">{formatCurrency(settlements.filter(s => s.status === 'received' || s.status === 'sent').reduce((sum, s) => sum + s.amount, 0))}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Balances</CardTitle>
              </CardHeader>
              <CardContent>
                {balances.length === 0 ? <p className="text-muted-foreground">No balances yet</p> : (
                  <div className="space-y-3">
                    {balances.map((b) => (
                      <div key={b.userId} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">{getUserName(b.userId).charAt(0)}</div>
                          <span className="font-medium">{getUserName(b.userId)}</span>
                        </div>
                        <span className={cn('font-medium', b.balance > 0 ? 'text-green-600' : b.balance < 0 ? 'text-red-600' : '')}>{b.balance > 0 ? '+' : ''}{formatCurrency(b.balance)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'memories' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Trip Memories</CardTitle>
                <Button size="sm" onClick={() => setShowAddMemoryModal(true)}><Plus className="mr-1 h-4 w-4" /> Add</Button>
              </div>
            </CardHeader>
            <CardContent>
              {memories.length === 0 ? (
                <EmptyState title="No memories yet" description="Add photos and videos to remember this trip" />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {memories.map((media) => (
                    <div key={media.id} className="aspect-square rounded-lg bg-muted overflow-hidden">
                      <img src={media.url} alt={media.caption || ''} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Modal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        title="Add Activity"
        description="Propose an activity for the trip"
      >
        <form onSubmit={handleCreateActivity} className="space-y-4">
          <Input
            label="Title"
            placeholder="Surfing lessons"
            value={newActivity.title}
            onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
            required
          />
          <Textarea
            label="Description (optional)"
            placeholder="2 hour lesson at Waikiki Beach"
            value={newActivity.description || ''}
            onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Location"
              placeholder="Waikiki Beach"
              value={newActivity.location || ''}
              onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
            />
            <Input
              label="Cost"
              type="number"
              placeholder="50"
              value={newActivity.cost || ''}
              onChange={(e) => setNewActivity({ ...newActivity, cost: Number(e.target.value) })}
            />
          </div>
          <Select
            label="Category"
            value={newActivity.category}
            onChange={(e) => setNewActivity({ ...newActivity, category: e.target.value as ActivityCategory })}
            options={categoryOptions}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowActivityModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Activity</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Friends"
        description="Share this trip with friends"
      >
        <div className="space-y-4">
          <Input label="Email" type="email" placeholder="friend@example.com" />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button>Send Invite</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddMemoryModal}
        onClose={() => setShowAddMemoryModal(false)}
        title="Add Memory"
        description="Add a photo or video to your trip memories"
      >
        <div className="space-y-4">
          <Input label="Image/Video URL" placeholder="https://example.com/photo.jpg" />
          <Textarea label="Caption (optional)" placeholder="What happened here?" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowAddMemoryModal(false)}>Cancel</Button>
            <Button>Add Memory</Button>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
}
