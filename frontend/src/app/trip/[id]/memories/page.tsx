'use client';

import { useEffect, useState, useRef, DragEvent } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Modal, EmptyState, Label } from '@/components';
import { api } from '@/services/api';
import { Plus, Image, Video, Upload, X, Download, Trash2, MoreVertical, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MediaItem } from '@/types';
import { HoverDropdown } from '@/components/hover-dropdown';

export default function TripMemories() {
  const params = useParams();
  const tripId = params.id as string;
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  const [memories, setMemories] = useState<MediaItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [editMedia, setEditMedia] = useState<MediaItem | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newType, setNewType] = useState<'image' | 'video'>('image');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

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

  const addMemory = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const result = await api.uploadMedia(tripId, selectedFile);
      if (result.data) {
        setMemories([...memories, { ...result.data, caption: newCaption } as MediaItem]);
        setShowModal(false);
        setNewUrl('');
        setNewCaption('');
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Failed to upload media:', error);
      alert('Failed to upload memory. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

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
      // Update local state optimistically
      setMemories(memories.map(m => m.id === mediaId ? { ...m, caption } : m));
      
      // Note: Backend update endpoint would go here if available
      // For now, we update locally and the backend can be extended later
      console.log('Caption updated locally:', caption);
    } catch (error) {
      console.error('Failed to update caption:', error);
      alert('Failed to update caption. Please try again.');
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (isImage || isVideo) {
        const result = await api.uploadMedia(tripId, file);
        if (result.data) {
          setMemories([...memories, result.data]);
        }
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const result = await api.uploadMedia(tripId, file);
      if (result.data) {
        setMemories([...memories, result.data]);
      }
    }
    e.target.value = '';
  };

  const handleFileFromModal = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (isImage || isVideo) {
      const url = URL.createObjectURL(file);
      const type = isImage ? 'image' : 'video';
      setNewUrl(url);
      setNewType(type);
      setSelectedFile(file);  // Store the actual file for upload
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Memories</h2>
        <Button onClick={() => setShowModal(true)} disabled={isUploading}>
          <Plus className="mr-2 h-4 w-4" />
          Add Memory
        </Button>
      </div>

      <div
        ref={dropZoneRef}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            const file = files[0];
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            if (isImage || isVideo) {
              api.uploadMedia(tripId, file).then(result => {
                if (result.data) setMemories([...memories, result.data]);
              });
            }
          }
        }}
        className={cn(
          "relative rounded-lg border-2 border-dashed p-8 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border"
        )}
      >
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-lg">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-primary" />
              <p className="mt-2 text-lg font-medium text-primary">Drop to add memory</p>
            </div>
          </div>
        )}

      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <span className="ml-3 text-muted-foreground">Loading memories...</span>
            </div>
          </CardContent>
        </Card>
      ) : memories.length === 0 ? (
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
            <div key={media.id} className="space-y-1">
              <div className="group relative aspect-square w-full rounded-lg overflow-hidden bg-muted">
                <button
                  onClick={() => setSelectedMedia(media)}
                  className="w-full h-full"
                >
                  {media.type === 'image' ? (
                    <img src={media.url} alt={media.caption || ''} className="w-full h-full object-cover transition-transform group-hover:scale-105" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E'; }} />
                  ) : (
                    <video src={media.url} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  )}
                </button>
                
                {/* Dropdown menu button */}
                <div 
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <HoverDropdown
                    mode="click"
                    align="right"
                    trigger={
                      <button className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    }
                    items={[
                      {
                        label: 'Edit caption',
                        icon: <Edit2 className="h-4 w-4" />,
                        onClick: () => {
                          setEditMedia(media);
                          setEditCaption(media.caption || '');
                        }
                      },
                      {
                        label: 'Delete',
                        icon: <Trash2 className="h-4 w-4 text-destructive" />,
                        onClick: () => deleteMemory(media.id),
                        className: 'text-destructive'
                      }
                    ]}
                  />
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="absolute bottom-2 left-2 right-2">
                    {media.caption && (
                      <p className="text-white text-sm truncate">{media.caption}</p>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {getUserName(media.uploaderId)} • {formatDate(media.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Memory"
        description="Add a photo or video to your trip memories"
      >
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const files = e.dataTransfer.files;
              if (files.length > 0) {
                handleFileFromModal(files[0]);
              }
            }}
            className={cn(
              "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            )}
          >
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileFromModal(e.target.files[0]);
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="memory-upload"
            />
            <Upload className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-center">
              <span className="font-medium">Drag and drop</span> or click to upload
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Supports photos and videos
            </p>
          </div>
          
          {newUrl && (
            <>
              <div className="rounded-lg border border-border p-4">
                {newType === 'image' ? (
                  <img src={newUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                ) : (
                  <video src={newUrl} className="max-h-48 mx-auto rounded-lg" controls />
                )}
              </div>
              <Textarea
                label="Caption (optional)"
                placeholder="What happened here?"
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                rows={2}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setShowModal(false); setNewUrl(''); setNewCaption(''); }} disabled={isUploading}>Cancel</Button>
                <Button onClick={addMemory} disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Add Memory'}
                </Button>
              </div>
            </>
          )}
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
              <div className="relative">
                <img src={selectedMedia.url} alt={selectedMedia.caption || ''} className="w-full rounded-lg" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E'; }} />
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
