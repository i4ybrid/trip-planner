'use client';

import { useState, useRef, useEffect } from 'react';
import { PageLayout } from '@/components/page-layout';
import { MessageCircle, Search, Send, MoreVertical, Phone, Video } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar: string | null;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string;
}

const STUBBED_CONVERSATIONS: Conversation[] = [
  { id: '1', name: 'Summer Road Trip 2024', lastMessage: 'Sarah: See you all tomorrow!', timestamp: '2 min ago', unread: 2, avatar: null },
  { id: '2', name: 'Mike Johnson', lastMessage: 'Thanks for the recommendation!', timestamp: '1 hour ago', unread: 0, avatar: null },
  { id: '3', name: 'Tokyo Adventure', lastMessage: 'Emily: The restaurant was amazing', timestamp: 'Yesterday', unread: 0, avatar: null },
  { id: '4', name: 'Emily Davis', lastMessage: 'Sounds good!', timestamp: 'Yesterday', unread: 0, avatar: null },
];

const STUBBED_MESSAGES: Message[] = [
  { id: '1', conversationId: '1', senderId: 'user-1', content: 'Hey everyone! Just wanted to confirm our plans for tomorrow.', timestamp: '10:30 AM' },
  { id: '2', conversationId: '1', senderId: 'user-2', content: "I'm so excited! Can't wait!", timestamp: '10:32 AM' },
  { id: '3', conversationId: '1', senderId: 'user-3', content: 'Same here! Should we meet at the hotel first?', timestamp: '10:35 AM' },
  { id: '4', conversationId: '1', senderId: 'user-1', content: "Yes, let's meet at 9 AM in the lobby. Then we can head to the beach together.", timestamp: '10:38 AM' },
  { id: '5', conversationId: '1', senderId: 'user-2', content: "Perfect! I'll bring some snacks for the drive.", timestamp: '10:40 AM' },
  { id: '6', conversationId: '1', senderId: 'user-3', content: 'See you all tomorrow!', timestamp: '10:45 AM' },
  { id: '7', conversationId: '2', senderId: 'user-2', content: 'Hey! Thanks for the restaurant recommendation.', timestamp: '2:00 PM' },
  { id: '8', conversationId: '2', senderId: 'user-1', content: 'No problem! Let me know how it goes.', timestamp: '2:15 PM' },
  { id: '9', conversationId: '2', senderId: 'user-2', content: 'Thanks for the recommendation!', timestamp: '3:00 PM' },
  { id: '10', conversationId: '3', senderId: 'user-3', content: 'The restaurant was amazing!', timestamp: 'Yesterday' },
  { id: '11', conversationId: '3', senderId: 'user-1', content: 'Glad you liked it!', timestamp: 'Yesterday' },
  { id: '12', conversationId: '4', senderId: 'user-4', content: 'Are we still on for Saturday?', timestamp: 'Yesterday' },
  { id: '13', conversationId: '4', senderId: 'user-1', content: 'Sounds good!', timestamp: 'Yesterday' },
];

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>('1');
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (USE_MOCK) {
      setConversations(STUBBED_CONVERSATIONS);
      setAllMessages(STUBBED_MESSAGES);
    } else {
      setConversations([]);
      setAllMessages([]);
    }
  }, []);

  const messages = allMessages.filter(m => m.conversationId === selectedConversation);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedConversation]);

  const selectedConvo = conversations.find(c => c.id === selectedConversation);

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
                {conversations.map((convo) => (
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
                        <p className="font-medium truncate">{convo.name}</p>
                        <span className="text-xs text-muted-foreground">{convo.timestamp}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                    </div>
                    {convo.unread > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        {convo.unread}
                      </span>
                    )}
                  </button>
                ))}
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
                        <p className="font-medium">{selectedConvo.name}</p>
                        <p className="text-sm text-muted-foreground">3 participants</p>
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

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === 'user-1' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.senderId === 'user-1'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary'
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.senderId === 'user-1'
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground'
                          }`}>
                            {message.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
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
                      <Button size="icon">
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
