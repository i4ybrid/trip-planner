'use client';

import React, { useState } from 'react';
import { TripMember } from '@/types';
import { Avatar, Badge } from '@/components';
import { HoverDropdown } from '@/components/hover-dropdown';
import { MoreHorizontal, Shield, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';

interface TripMemberCardProps {
  member: TripMember;
  tripId: string;
  isOwner: boolean;
  onUpdate: () => void;
  className?: string;
}

export function TripMemberCard({ member, tripId, isOwner, onUpdate, className }: TripMemberCardProps) {
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  const handlePromoteToEditor = async () => {
    await api.updateTripMember(tripId, member.userId, { role: 'EDITOR' });
    onUpdate();
  };

  const handleRemoveMember = async () => {
    if (!showConfirmRemove) {
      setShowConfirmRemove(true);
      return;
    }
    await api.removeTripMember(tripId, member.userId);
    onUpdate();
  };

  const roleLabel = member.role === 'OWNER' ? 'Trip Master' : member.role === 'EDITOR' ? 'Editor' : 'Viewer';
  const roleBadgeVariant = member.role === 'OWNER' ? 'default' : member.role === 'EDITOR' ? 'secondary' : 'outline';

  return (
    <div className={cn('flex items-center justify-between rounded-lg border border-border p-3 pr-2', className)}>
      <div className="flex items-center gap-3">
        <Avatar
          src={member.user?.avatarUrl || undefined}
          name={member.user?.name || 'User'}
          size="md"
        />
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{member.user?.name || 'User'}</p>
            {member.status === 'INVITED' && (
              <Badge status="INVITED" className="text-xs">Pending</Badge>
            )}
          </div>
          <Badge variant={roleBadgeVariant} className="w-fit text-xs">{roleLabel}</Badge>
        </div>
      </div>
      
      {isOwner && member.role !== 'OWNER' && (
        <HoverDropdown
          mode="click"
          align="right"
          trigger={
            <button className="rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          }
          items={[
            {
              label: member.role !== 'EDITOR' ? 'Make Editor' : 'Remove Editor',
              onClick: handlePromoteToEditor,
              icon: <Shield className="h-4 w-4" />,
            },
            {
              label: showConfirmRemove ? 'Confirm Remove' : 'Remove from Trip',
              onClick: handleRemoveMember,
              icon: <Trash2 className="h-4 w-4" />,
              className: showConfirmRemove ? 'bg-red-50 text-red-600' : 'text-red-600 hover:text-red-700',
            },
          ]}
        />
      )}
    </div>
  );
}
