'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PageLayout } from '@/components/page-layout';
import { MessageCircle, Search, Send, MoreVertical, Phone, Video } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api } from '@/services/api';
import { DmConversation, Message, User } from '@/types';

function getOtherParticipant(conversation: DmConversation, currentUserId: string): User | undefined {
  return conversation.participants?.find(p => p.id !== currentUserId);
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const [conversations, setConversations] = useState<DmConversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Show loading while session is being checked
  if (status === 'loading') {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  useEffect(() => {
    // Wait for session to be loaded
    if (!session) return;

    const loadConversations = async () => {
      setIsLoading(true);
      const [userResult, conversationsResult] = await Promise.all([
        api.getCurrentUser(),
        api.getDmConversations(),
      ]);
      if (userResult.data) {
        setCurrentUserId(userResult.data.id);
      }
      if (conversationsResult.data) {
        setConversations(conversationsResult.data);
        if (conversationsResult.data.length > 0) {
          setSelectedConversation(conversationsResult.data[0].id);
        }
      }
      setIsLoading(false);
    };
    loadConversations();
  }, [session]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversation) {
        setMessages([]);
        setHasMoreMessages(true);
        return;
      }
      const result = await api.getDmMessages(selectedConversation, 30);
      if (result.data) {
        setMessages([...result.data].reverse());
        setHasMoreMessages(result.data.length === 30);
      }
    };
    loadMessages();
  }, [selectedConversation]);

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages || messages.length === 0) return;

    setIsLoadingMore(true);
    try {
      const oldestMessage = messages[0];
      const beforeDate = oldestMessage.createdAt;
      
      const result = await api.getDmMessages(selectedConversation!, 30, beforeDate);
      if (result.data && result.data.length > 0) {
        const container = messagesContainerRef.current;
        const previousScrollHeight = container?.scrollHeight || 0;
        
        setMessages(prev => [...result.data.reverse(), ...prev]);
        setHasMoreMessages(result.data.length === 30);
        
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

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    // Load more when scrolled to top (within 50px)
    if (container.scrollTop < 50 && !isLoadingMore && hasMoreMessages) {
      loadMoreMessages();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedConversation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    const result = await api.sendDmMessage(selectedConversation, { content: newMessage.trim() });
    if (result.data) {
      setMessages(prev => [...prev, result.data!]);
      setNewMessage('');
    }
  };

  const selectedConvo = conversations.find(c => c.id === selectedConversation);
  const otherUser = selectedConvo ? getOtherParticipant(selectedConvo, currentUserId) : undefined;

  return (
    <PageLayout title="Messages" className="p-0">
      <div className="flex h-[calc(100vh-4.5rem)] w-full">
        <aside className="w-80 border-r border-border shrink-0 flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search messages..." className="pl-10" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 p-2">
                {isLoading ? (
                  <div className="flex justify-center py-8 text-muted-foreground">Loading...</div>
                ) : conversations.length === 0 ? (
                  <div className="flex justify-center py-8 text-muted-foreground">No conversations yet</div>
                ) : (
                  conversations.map((convo) => {
                    const other = getOtherParticipant(convo, currentUserId);
                    return (
                      <button
                        key={convo.id}
                        onClick={() => setSelectedConversation(convo.id)}
                        className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                          selectedConversation === convo.id
                            ? 'bg-primary/10'
                            : 'hover:bg-secondary'
                        }`}
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <MessageCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{other?.name || 'Unknown User'}</p>
                            <span className="text-xs text-muted-foreground">{new Date(convo.lastMessageAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">Click to view messages</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
          </aside>

            <div className="flex-1 flex flex-col min-w-0">
              {selectedConvo ? (
                <>
                  <div className="flex items-center justify-between border-b border-border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <MessageCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{otherUser?.name || 'Unknown User'}</p>
                        <p className="text-sm text-muted-foreground">{selectedConvo.participants?.length || 1} participant(s)</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div 
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                    onScroll={handleScroll}
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
                      <div className="flex justify-center py-8 text-muted-foreground">No messages yet</div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              message.senderId === currentUserId
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.senderId === currentUserId
                                ? 'text-primary-foreground/70'
                                : 'text-muted-foreground'
                            }`}>
                              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="border-t border-border p-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                      />
                      <Button size="icon" onClick={handleSendMessage}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
      </div>
    </PageLayout>
  );
}
