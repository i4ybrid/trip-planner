import React from 'react';
import { Trip } from '@/types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarGroup } from './ui/avatar';
import { formatDateRange, cn } from '@/lib/utils';
import { MapPin, Calendar, Users } from 'lucide-react';

interface TripCardProps {
  trip: Trip;
  members?: string[];
  onClick?: () => void;
  className?: string;
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  members = [],
  onClick,
  className,
}) => {
  return (
    <Card
      className={cn(
        'cursor-pointer overflow-hidden transition-all hover:shadow-lg card-hover',
        className
      )}
      onClick={onClick}
    >
      <div className="relative h-32 bg-gradient-to-br from-primary to-primary/60">
        {trip.coverImage && (
          <img
            src={trip.coverImage}
            alt={trip.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-xl font-bold text-white line-clamp-1">{trip.name}</h3>
          {trip.destination && (
            <p className="flex items-center gap-1 text-sm text-white/80">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{trip.destination}</span>
            </p>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <Badge status={trip.status} />
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {trip.startDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDateRange(trip.startDate, trip.endDate)}
              </span>
            )}
          </div>
        </div>
        {members.length > 0 && (
          <div className="mt-3 flex items-center justify-between">
            <AvatarGroup max={4} size="sm">
              {members.map((name, i) => (
                <Avatar key={i} name={name} size="sm" />
              ))}
            </AvatarGroup>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-3 w-3" />
              {members.length}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};
