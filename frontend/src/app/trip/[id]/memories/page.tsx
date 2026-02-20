'use client';

import { useEffect, useState, useRef, DragEvent } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Modal, EmptyState, Label } from '@/components';
import { mockApi } from '@/services/mock-api';
import { Plus, Image, Video, Upload, X, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TripMemories() {
  const params = useParams();
  const tripId = params.id as string;
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  const [memories, setMemories] = useState<{ id: string; url: string; caption?: string; type: 'image' | 'video'; uploadedAt: string; uploadedBy: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<typeof memories[0] | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newType, setNewType] = useState<'image' | 'video'>('image');
  const [isDragging, setIsDragging] = useState(false);

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
        const url = URL.createObjectURL(file);
        const type = isImage ? 'image' : 'video';
        
        const result = await mockApi.addMediaToAlbum(tripId, 'user-1', type, url, '');
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
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (isImage || isVideo) {
        const url = URL.createObjectURL(file);
        const type = isImage ? 'image' : 'video';
        
        const result = await mockApi.addMediaToAlbum(tripId, 'user-1', type, url, '');
        if (result.data) {
          setMemories([...memories, result.data]);
        }
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
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Memory
        </Button>
      </div>

      <div
        ref={dropZoneRef}
        onClick={() => setShowModal(true)}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          setShowModal(true);
        }}
        className={cn(
          "relative rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
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
            <div key={media.id} className="space-y-1">
              <button
                onClick={() => setSelectedMedia(media)}
                className="group relative aspect-square w-full rounded-lg overflow-hidden bg-muted"
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
                  </div>
                </div>
              </button>
              <p className="text-xs text-muted-foreground">
                {getUserName(media.uploadedBy)} • {formatDate(media.uploadedAt)}
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
                <Button variant="outline" onClick={() => { setShowModal(false); setNewUrl(''); setNewCaption(''); }}>Cancel</Button>
                <Button onClick={addMemory}>Add Memory</Button>
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
                <img src={selectedMedia.url} alt={selectedMedia.caption || ''} className="w-full rounded-lg" />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => downloadImage(selectedMedia.url, selectedMedia.caption)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
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
