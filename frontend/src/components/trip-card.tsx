import React from 'react';
import { Trip } from '@/types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarGroup } from './ui/avatar';
import { formatDateRange, cn } from '@/lib/utils';
import { ArrowUpRight, Calendar, MapPin, Users } from 'lucide-react';

interface MemberInfo {
  name: string;
  avatarUrl?: string;
}

interface TripCardProps {
  trip: Trip;
  members?: string[] | MemberInfo[];
  memberCount?: number;
  onClick?: () => void;
  className?: string;
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  members = [],
  memberCount,
  onClick,
  className,
}) => {
  const destinationImages = [
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=900&q=80',
  ];
  const imageIndex = trip.id
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0) % destinationImages.length;
  const coverImage = trip.coverImage || destinationImages[imageIndex];

  return (
    <Card
      className={cn(
        'group cursor-pointer overflow-hidden border-white/60 destination-sheen transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-accent/15',
        className
      )}
      onClick={onClick}
    >
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary to-accent">
        <img
          src={coverImage}
          alt={trip.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow-lg transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
          <ArrowUpRight className="h-4 w-4" />
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="font-display text-2xl font-bold leading-tight text-white line-clamp-1">{trip.name}</h3>
          {trip.destination && (
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-white/86">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{trip.destination}</span>
            </p>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <Badge status={trip.status} />
          <div className="flex items-center gap-3 text-right text-sm text-muted-foreground">
            {trip.startDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary" />
                {formatDateRange(trip.startDate, trip.endDate)}
              </span>
            )}
          </div>
        </div>
        {memberCount !== undefined ? (
          <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-4">
            <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4 text-accent" />
              {memberCount} member{memberCount !== 1 ? 's' : ''}
            </span>
            <span className="text-sm font-semibold text-primary">Open plan</span>
          </div>
        ) : members.length > 0 && (
          <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-4">
            <AvatarGroup max={4} size="sm">
              {members.map((member, i) => {
                const name = typeof member === 'string' ? member : member.name;
                const avatarUrl = typeof member === 'string' ? undefined : member.avatarUrl;
                return (
                  <Avatar key={i} src={avatarUrl} name={name} size="sm" />
                );
              })}
            </AvatarGroup>
            <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4 text-accent" />
              {members.length}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};
