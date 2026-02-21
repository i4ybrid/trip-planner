'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, Input, Button } from '@/components';
import { api } from '@/services';
import { Send, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

export default function TripChat() {
  const params = useParams();
  const tripId = params.id as string;
  
  const [messages, setMessages] = useState<{ id: string; userId: string; content: string; createdAt: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [tripMembers, setTripMembers] = useState<{ userId: string; role: string; user: { name: string } }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMessages = async () => {
      const result = await api.getMessages(tripId);
      if (result.data) setMessages(result.data);
    };
    loadMessages();

    if (USE_MOCK) {
      import('@/services').then(({ mockTrip }) => {
        setTripMembers(mockTrip.getTripMembersWithUsers(tripId));
      });
    } else {
      api.getTripMembers(tripId).then((response) => {
        if (response.data) {
          setTripMembers(response.data.map((m: any) => ({
            userId: m.userId,
            role: m.role,
            user: m.user || { name: 'Unknown' },
          })));
        }
      });
    }
  }, [tripId]);

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
    const inputEl = document.getElementById('chat-input') as HTMLInputElement | null;
    const cursorPos = inputEl?.selectionStart ?? newMessage.length;
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
    
    const result = await api.sendMessage(tripId, { content: newMessage });
    if (result.data) {
      setMessages([...messages, result.data]);
      setNewMessage('');
      setShowMentions(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const getUserName = (userId: string) => {
    const names: Record<string, string> = {
      'user-1': 'You',
      'user-2': 'Sarah Chen',
      'user-3': 'Mike Johnson',
      'user-4': 'Emma Wilson',
    };
    return names[userId] || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Group Chat</h2>
        <span className="text-sm text-muted-foreground">{tripMembers.length} members</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <div className="h-[500px] flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn('flex', msg.userId === 'user-1' ? 'justify-end' : 'justify-start')}
                      >
                        <div className="flex items-end gap-2">
                          {msg.userId !== 'user-1' && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                              {getUserName(msg.userId).charAt(0)}
                            </div>
                          )}
                          <div
                            className={cn(
                              'max-w-[70%] rounded-lg px-4 py-2',
                              msg.userId === 'user-1'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary'
                            )}
                          >
                            {msg.userId !== 'user-1' && (
                              <p className="mb-1 text-xs font-medium">{getUserName(msg.userId)}</p>
                            )}
                            <p className="text-sm">{msg.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-border p-4">
                  <div className="relative">
                    {showMentions && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 max-h-48 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-lg">
                        <button
                          type="button"
                          onClick={() => insertMention('everyone')}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Users className="h-4 w-4" />
                          </div>
                          <span className="font-medium">@everyone</span>
                          <span className="text-xs text-muted-foreground">Notify all</span>
                        </button>
                        {tripMembers
                          .filter(m => !mentionSearch || m.user.name.toLowerCase().includes(mentionSearch))
                          .map((member) => (
                            <button
                              key={member.userId}
                              type="button"
                              onClick={() => insertMention(member.user.name.split(' ')[0])}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                {member.user.name.charAt(0)}
                              </div>
                              <span>{member.user.name}</span>
                            </button>
                          ))}
                      </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        id="chat-input"
                        placeholder="Type a message... (@ to mention)"
                        value={newMessage}
                        onChange={handleMessageInputChange}
                        onBlur={() => setTimeout(() => setShowMentions(false), 200)}
                        className="flex-1"
                      />
                      <Button type="submit">
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Members ({tripMembers.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tripMembers.map((member) => (
                <div key={member.userId} className="flex items-center gap-3 rounded-lg p-2 hover:bg-secondary/50">
                  <div className="relative">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                      {member.user.name.charAt(0)}
                    </div>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.userId === 'user-1' ? 'You' : member.user.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
