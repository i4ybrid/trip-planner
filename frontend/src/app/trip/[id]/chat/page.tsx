'use client';

import { PageLayout } from '@/components/page-layout';
import { useRouter, useParams } from 'next/navigation';
import { Send, Paperclip, Smile } from 'lucide-react';
import { Avatar, Button, Input } from '@/components';

// Mock messages for trip-1 (Hawaii) - real API would fetch these
const MOCK_MESSAGES_Hawaii = [
  { id: '1', sender: 'Test User', text: 'Hey everyone! Excited about this trip! 🏝️', time: '10:32 AM', isSelf: true },
  { id: '2', sender: 'Sarah Chen', text: 'Me too! The itinerary looks amazing!', time: '10:35 AM', isSelf: false },
  { id: '3', sender: 'Mike Johnson', text: 'Anyone want to do the luau on Friday night?', time: '10:38 AM', isSelf: false },
  { id: '4', sender: 'Emma Wilson', text: 'Count me in!', time: '10:40 AM', isSelf: false },
];

// trip-1 (Hawaii) has 4 members and messages
const TRIP_1_MEMBERS = [
  { id: 'user-1', name: 'Test User', status: 'online' },
  { id: 'user-2', name: 'Sarah Chen', status: 'online' },
  { id: 'user-3', name: 'Mike Johnson', status: 'online' },
  { id: 'user-4', name: 'Emma Wilson', status: 'offline' },
];

export default function ChatPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const tripId = params.id;

  // Only trip-1 (Hawaii) has messages; other trips show empty state
  const messages = tripId === 'trip-1' ? MOCK_MESSAGES_Hawaii : [];
  const members = tripId === 'trip-1' ? TRIP_1_MEMBERS : [];

  return (
    <PageLayout title="Group Chat" showBack onBack={() => router.push('/dashboard')} className="pb-24 pt-5 sm:pb-8">
      <div className="flex flex-col" style={{ height: 'calc(100dvh - 120px)', maxHeight: 'calc(100dvh - 120px)' }}>
        {/* Member count indicator */}
        <div className="mb-2 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
          {members.length} members in this chat
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 py-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[var(--text-sm)] text-[var(--color-text-muted)]">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.isSelf ? 'justify-end' : 'justify-start'}`}>
              {!msg.isSelf && <Avatar name={msg.sender} size="sm" className="flex-shrink-0 mt-1" />}
              <div className={`max-w-[75%] flex flex-col gap-1 ${msg.isSelf ? 'items-end' : 'items-start'}`}>
                {!msg.isSelf && (
                  <span className="text-[var(--text-xs)] text-[var(--color-text-muted)] px-1">{msg.sender}</span>
                )}
                <div
                  className={`px-4 py-3 rounded-2xl text-[var(--text-sm)] leading-relaxed
                    ${msg.isSelf
                      ? 'bg-[var(--color-accent)] text-white rounded-br-md'
                      : 'bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] rounded-bl-md'
                    }`}
                >
                  {msg.text}
                </div>
                <span className="text-[var(--text-xs)] text-[var(--color-text-muted)] px-1">{msg.time}</span>
              </div>
            </div>
          ))
          )}
        </div>

        {/* Input bar */}
        <div className="flex items-end gap-2 pt-3 border-t border-[var(--color-border)]">
          <Button variant="ghost" size="icon" aria-label="Attach file">
            <Paperclip size={16} />
          </Button>
          <div className="flex-1">
            <Input
              id="chat-input"
              placeholder="Type a message..."
              className="rounded-full bg-[var(--color-surface-raised)] border-0"
            />
          </div>
          <Button variant="ghost" size="icon" aria-label="Emoji">
            <Smile size={16} />
          </Button>
          <Button variant="primary" size="md" type="submit" aria-label="Send message">
            <Send size={16} />
          </Button>
        </div>

        {/* Members section */}
        <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
          <h3 className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)] mb-2">Members</h3>
          <div className="flex flex-wrap gap-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-2">
                <Avatar name={member.name} size="sm" />
                <span className="text-[var(--text-xs)] text-[var(--color-text-secondary)]">{member.name}</span>
                <span
                  className={`w-2 h-2 rounded-full ${member.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
