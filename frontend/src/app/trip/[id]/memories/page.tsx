'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Modal, EmptyState } from '@/components';
import { mockApi } from '@/services/mock-api';
import { Plus, Image, Video, X } from 'lucide-react';

export default function TripMemories() {
  const params = useParams();
  const tripId = params.id as string;
  
  const [memories, setMemories] = useState<{ id: string; url: string; caption?: string; type: 'image' | 'video'; uploadedAt: string; uploadedBy: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<typeof memories[0] | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newType, setNewType] = useState<'image' | 'video'>('image');

  useEffect(() => {
    const loadMemories = async () => {
      const result = await mockApi.getMedia(tripId);
      if (result.data) setMemories(result.data);
    };
    loadMemories();
  }, [tripId]);

  const addMemory = async () => {
    if (!newUrl) return;
    
    const result = await mockApi.addMediaToAlbum(tripId, 'user-1', newType, newUrl, newCaption);
    if (result.data) {
      setMemories([...memories, result.data]);
      setShowModal(false);
      setNewUrl('');
      setNewCaption('');
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
        <h2 className="text-xl font-semibold">Memories</h2>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Memory
        </Button>
      </div>

      {memories.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              title="No memories yet"
              description="Add photos and videos to remember this trip"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {memories.map((media) => (
            <button
              key={media.id}
              onClick={() => setSelectedMedia(media)}
              className="group relative aspect-square rounded-lg overflow-hidden bg-muted"
            >
              {media.type === 'image' ? (
                <img src={media.url} alt={media.caption || ''} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              ) : (
                <div className="flex w-full h-full items-center justify-center bg-muted">
                  <Video className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-2 left-2 right-2">
                  {media.caption && (
                    <p className="text-white text-sm truncate">{media.caption}</p>
                  )}
                  <p className="text-white/70 text-xs">{getUserName(media.uploadedBy)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Memory"
        description="Add a photo or video to your trip memories"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Type</label>
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                variant={newType === 'image' ? 'default' : 'outline'}
                onClick={() => setNewType('image')}
                className="flex-1"
              >
                <Image className="mr-2 h-4 w-4" />
                Photo
              </Button>
              <Button
                type="button"
                variant={newType === 'video' ? 'default' : 'outline'}
                onClick={() => setNewType('video')}
                className="flex-1"
              >
                <Video className="mr-2 h-4 w-4" />
                Video
              </Button>
            </div>
          </div>
          <Input
            label="Image/Video URL"
            placeholder="https://example.com/photo.jpg"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            required
          />
          <Textarea
            label="Caption (optional)"
            placeholder="What happened here?"
            value={newCaption}
            onChange={(e) => setNewCaption(e.target.value)}
            rows={2}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={addMemory}>Add Memory</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
        title={selectedMedia?.caption || 'Memory'}
        className="max-w-2xl"
      >
        {selectedMedia && (
          <div className="space-y-4">
            {selectedMedia.type === 'image' ? (
              <img src={selectedMedia.url} alt={selectedMedia.caption || ''} className="w-full rounded-lg" />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-lg bg-muted">
                <Video className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
            {selectedMedia.caption && (
              <p className="text-center text-muted-foreground">{selectedMedia.caption}</p>
            )}
            <p className="text-center text-sm text-muted-foreground">
              Added by {getUserName(selectedMedia.uploadedBy)}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
