'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, Input, Button, Textarea, Avatar } from '@/components';
import { api } from '@/services/api';
import { Send, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message, TripMember, User } from '@/types';

export default function TripChat() {
  const params = useParams();
  const tripId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [messagesResult, membersResult] = await Promise.all([
          api.getTripMessages(tripId, 30),
          api.getTripMembers(tripId),
        ]);
        if (messagesResult.data) {
          setMessages([...messagesResult.data].reverse());
          setHasMoreMessages(messagesResult.data.length === 30);
          // Scroll to bottom after messages are loaded
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
        }
        if (membersResult.data) setMembers(membersResult.data);
      } catch (error) {
        console.error('Failed to load chat data:', error);
      }
    };
    loadData();
  }, [tripId]);

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages || messages.length === 0) return;

    setIsLoadingMore(true);
    try {
      const oldestMessage = messages[0];
      const beforeDate = oldestMessage.createdAt;
      
      const result = await api.getTripMessages(tripId, 30, beforeDate);
      if (result.data && result.data.length > 0) {
        // Preserve current scroll position
        const container = messagesContainerRef.current;
        const previousScrollHeight = container?.scrollHeight || 0;
        
        // Add older messages to the beginning
        setMessages(prev => [...result.data.reverse(), ...prev]);
        setHasMoreMessages(result.data.length === 30);
        
        // Restore scroll position
        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - previousScrollHeight;
          }
        }, 0);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleMessageInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift sends message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
    // Shift+Enter creates new line (default behavior)
  };

  const insertMention = (name: string) => {
    const input = document.getElementById('chat-input') as HTMLTextAreaElement | null;
    const cursorPos = input?.selectionStart || newMessage.length;
    const textBeforeCursor = newMessage.slice(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');

    if (lastAtPos !== -1) {
      const textAfterCursor = newMessage.slice(cursorPos);
      const textBeforeAt = newMessage.slice(0, lastAtPos);
      const newText = `${textBeforeAt}@${name} ${textAfterCursor}`;
      setNewMessage(newText);
    }
    setShowMentions(false);
    input?.focus();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const result = await api.sendTripMessage(tripId, { content: newMessage });
    if (result.data) {
      setMessages([...messages, result.data]);
      setNewMessage('');
      setShowMentions(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const getUserName = (userId: string) => {
    const member = members.find(m => m.userId === userId);
    if (member?.user?.name) return member.user.name;
    if (userId === 'user-1') return 'You';
    return 'Unknown User';
  };

  const getUserAvatar = (userId: string) => {
    const member = members.find(m => m.userId === userId);
    return member?.user?.avatarUrl || undefined;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Group Chat</h2>
        <span className="text-sm text-muted-foreground">{members.length} members</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <div className="h-[500px] flex flex-col">
                <div 
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                >
                  {/* Load More Button */}
                  {hasMoreMessages && (
                    <div className="flex justify-center py-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadMoreMessages}
                        disabled={isLoadingMore}
                      >
                        {isLoadingMore ? 'Loading...' : 'Load earlier messages'}
                      </Button>
                    </div>
                  )}
                  {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn('flex', msg.senderId === 'user-1' ? 'justify-end' : 'justify-start')}
                      >
                        <div className={cn('flex gap-2 max-w-[70%]', msg.senderId !== 'user-1' ? 'items-end' : 'items-center flex-row-reverse')}>
                          {msg.senderId !== 'user-1' && (
                            <Avatar
                              src={getUserAvatar(msg.senderId)}
                              name={getUserName(msg.senderId)}
                              size="sm"
                            />
                          )}
                          <div
                            className={cn(
                              'rounded-lg px-4 py-2',
                              msg.senderId === 'user-1'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary'
                            )}
                          >
                            {msg.senderId !== 'user-1' && (
                              <p className="mb-1 text-xs font-medium">{getUserName(msg.senderId)}</p>
                            )}
                            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
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
                        {members
                          .filter(m => !mentionSearch || (m.user?.name || '').toLowerCase().includes(mentionSearch))
                          .map((member) => {
                            const name = getUserName(member.userId);
                            return (
                              <button
                                key={member.userId}
                                type="button"
                                onClick={() => insertMention(name.split(' ')[0])}
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                              >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                  {getMemberInitial(member.userId)}
                                </div>
                                <span>{name}</span>
                              </button>
                            );
                          })}
                      </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Textarea
                        id="chat-input"
                        placeholder="Type a message... (@ to mention)"
                        value={newMessage}
                        onChange={handleMessageInputChange}
                        onKeyDown={handleKeyDown}
                        onBlur={() => setTimeout(() => setShowMentions(false), 200)}
                        className="flex-1 min-h-[44px] max-h-32 resize-y"
                        rows={1}
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
              <CardTitle className="text-base">Members ({members.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {members.map((member) => {
                const name = getUserName(member.userId);
                return (
                  <div key={member.userId} className="flex items-center gap-3 rounded-lg p-2 hover:bg-secondary/50">
                    <div className="relative">
                      <Avatar
                        src={member.user?.avatarUrl || undefined}
                        name={name}
                        size="sm"
                        className="h-9 w-9"
                      />
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
