'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, Button, Textarea, Modal, EmptyState } from '@/components';
import { api } from '@/services/api';
import { Download, Trash2 } from 'lucide-react';
import { MediaItem } from '@/types';

export default function TripMemories() {
  const params = useParams();
  const tripId = params.id as string;

  const [memories, setMemories] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [editMedia, setEditMedia] = useState<MediaItem | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMemories = async () => {
      setIsLoading(true);
      const result = await api.getMedia(tripId);
      if (result.data) {
        // Sort by createdAt ascending (oldest first)
        const sorted = [...result.data].sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMemories(sorted);
      }
      setIsLoading(false);
    };
    loadMemories();
  }, [tripId]);

  const deleteMemory = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) return;

    try {
      await api.deleteMedia(mediaId);
      setMemories(memories.filter(m => m.id !== mediaId));
      setSelectedMedia(null);
      setEditMedia(null);
    } catch (error) {
      console.error('Failed to delete media:', error);
      alert('Failed to delete memory. Please try again.');
    }
  };

  const updateCaption = async (mediaId: string, caption: string) => {
    try {
      setMemories(memories.map(m => m.id === mediaId ? { ...m, caption } : m));
      console.log('Caption updated locally:', caption);
    } catch (error) {
      console.error('Failed to update caption:', error);
      alert('Failed to update caption. Please try again.');
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const downloadImage = async (url: string, caption?: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = caption ? `${caption.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg` : 'memory.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Failed to download:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Memories</h2>

      <Card>
        <CardContent className="py-12">
          <EmptyState
            title="Photo & Video Upload"
            description="Coming Soon"
          />
        </CardContent>
      </Card>

      <Modal
        isOpen={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
        title={selectedMedia?.caption || 'Memory'}
        className="max-w-2xl"
      >
        {selectedMedia && (
          <div className="space-y-4">
            {selectedMedia.type === 'image' ? (
              <div className="relative">
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.caption || ''}
                  className="w-full rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => downloadImage(selectedMedia.url, selectedMedia.caption)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => deleteMemory(selectedMedia.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <video src={selectedMedia.url} className="w-full rounded-lg" controls />
                <div className="absolute top-2 right-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => deleteMemory(selectedMedia.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
            {selectedMedia.caption && (
              <p className="text-center text-muted-foreground">{selectedMedia.caption}</p>
            )}
            <p className="text-center text-sm text-muted-foreground">
              Added by {getUserName(selectedMedia.uploaderId)}
            </p>
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setSelectedMedia(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Caption Modal */}
      <Modal
        isOpen={!!editMedia}
        onClose={() => setEditMedia(null)}
        title="Edit Caption"
        description="Update the caption for this memory"
      >
        {editMedia && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-4">
              {editMedia.type === 'image' ? (
                <img src={editMedia.url} alt={editMedia.caption || ''} className="max-h-48 mx-auto rounded-lg object-contain" />
              ) : (
                <video src={editMedia.url} className="max-h-48 mx-auto rounded-lg" controls />
              )}
            </div>
            <Textarea
              label="Caption"
              placeholder="Add a caption..."
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditMedia(null)}>Cancel</Button>
              <Button onClick={() => {
                updateCaption(editMedia.id, editCaption);
                setEditMedia(null);
              }}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
