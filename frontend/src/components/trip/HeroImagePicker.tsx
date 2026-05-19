'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { api } from '@/services/api';
import { HeroImage } from '@/types';
import { Search, X } from 'lucide-react';

interface HeroImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  currentHeroImageId?: string | null;
  tripId: string;
  onSelect: (heroImage: HeroImage) => void;
}

export function HeroImagePicker({ isOpen, onClose, currentHeroImageId, tripId, onSelect }: HeroImagePickerProps) {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<HeroImage[]>([]);
  const [selected, setSelected] = useState<string | null>(currentHeroImageId || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !images.length) {
      // Load all images initially
      api.getHeroImages().then(res => {
        if (res.data) setImages(res.data);
      });
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!query.trim()) {
      api.getHeroImages().then(res => {
        if (res.data) setImages(res.data);
      });
      return;
    }
    setIsLoading(true);
    const res = await api.searchHeroImages(query);
    if (res.data) setImages(res.data);
    setIsLoading(false);
  };

  const handleConfirm = () => {
    const image = images.find(img => img.id === selected);
    if (image) {
      onSelect(image);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose Cover Image" className="max-w-4xl">
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search images (e.g., beach, mountain, europe)"
              className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm"
            />
          </div>
          <button onClick={handleSearch} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium">
            Search
          </button>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

        <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
          {images.map(img => (
            <button
              key={img.id}
              onClick={() => setSelected(img.id)}
              className={`relative overflow-hidden rounded-lg border-2 transition ${
                selected === img.id ? 'border-primary ring-2 ring-primary/50' : 'border-border/50 hover:border-primary/50'
              }`}
            >
              <div className="aspect-video bg-secondary">
                <img 
                  src={`/images/heroes/${img.filename}`} 
                  alt={img.title}
                  className="h-full w-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <p className="truncate bg-background/80 px-2 py-1 text-xs">{img.title}</p>
              {selected === img.id && (
                <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <span className="text-xs">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {images.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground">No images found. Try a different search.</p>
        )}

        <div className="flex justify-end gap-3 border-t pt-4">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm">
            Cancel
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={!selected}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Set as Cover
          </button>
        </div>
      </div>
    </Modal>
  );
}