'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button, Input, Badge, Avatar, Select } from '@/components';
import { api } from '@/services/api';
import { Trip, TripMember, TripStyle, MemberRole, MemberStatus } from '@/types';
import { Settings, Users, Shield, Crown, UserMinus, Check, X, Loader2, AlertTriangle, MoreHorizontal } from 'lucide-react';
import { HoverDropdown } from '@/components/hover-dropdown';
import { useAuth } from '@/hooks/use-auth';
import { logger } from '@/lib/logger';

interface TripSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onTripUpdated?: () => void;
}

function normalizeDateForSubmit(dateStr: string, isEndDate: boolean): string | undefined {
  if (!dateStr) return undefined;
  if (!dateStr.includes('T')) {
    // Date-only, no time component — apply default time
    return `${dateStr}T${isEndDate ? '23:59' : '00:00'}`;
  }
  return dateStr;
}

export function TripSettingsModal({ isOpen, onClose, trip, onTripUpdated }: TripSettingsModalProps) {
  const { user } = useAuth();
  const [tripData, setTripData] = useState({
    name: trip.name,
    description: trip.description || '',
    destination: trip.destination || '',
    startDate: trip.startDate || '',
    endDate: trip.endDate || '',
    style: trip.style as TripStyle,
  });
  const [members, setMembers] = useState<TripMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDangerZone, setShowDangerZone] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen, trip.id]);

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const result = await api.getTripMembers(trip.id);
      if (result.data) {
        setMembers(result.data);
      }
    } catch (error) {
      logger.error('Failed to load members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const normalizedStart = normalizeDateForSubmit(tripData.startDate, false);
      const normalizedEnd = normalizeDateForSubmit(tripData.endDate, true);

      await api.updateTrip(trip.id, {
        name: tripData.name,
        description: tripData.description || undefined,
        destination: tripData.destination || undefined,
        startDate: normalizedStart,
        endDate: normalizedEnd,
        style: tripData.style,
      });
      onTripUpdated?.();
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.removeTripMember(trip.id, userId);
      loadMembers();
    } catch (error: any) {
      setError(error.message || 'Failed to remove member');
    }
  };

  const handleApproveMember = async (userId: string) => {
    try {
      await api.updateTripMember(trip.id, userId, { status: 'CONFIRMED' });
      loadMembers();
    } catch (error: any) {
      setError(error.message || 'Failed to approve member');
    }
  };

  const handleDeclineMember = async (userId: string) => {
    try {
      await api.updateTripMember(trip.id, userId, { status: 'DECLINED' });
      loadMembers();
    } catch (error: any) {
      setError(error.message || 'Failed to decline member');
    }
  };

  const handlePromoteToEditor = async (userId: string, currentRole: MemberRole) => {
    const newRole = currentRole === 'EDITOR' ? 'VIEWER' : 'EDITOR';
    try {
      await api.updateTripMember(trip.id, userId, { role: newRole });
      loadMembers();
    } catch (error: any) {
      setError(error.message || 'Failed to update member role');
    }
  };

  const handleTransferMaster = async (userId: string) => {
    if (!confirm('Are you sure you want to transfer trip master role? You will lose master access.')) return;
    try {
      await api.updateTripMember(trip.id, userId, { role: 'OWNER' });
      await api.updateTripMember(trip.id, user!.id, { role: 'EDITOR' });
      loadMembers();
      onTripUpdated?.();
    } catch (error: any) {
      setError(error.message || 'Failed to transfer master role');
    }
  };

  const currentUserMember = members.find(m => m.userId === user?.id);
  const isOwner = currentUserMember?.role === 'OWNER';
  const isOrganizer = currentUserMember?.role === 'EDITOR' || isOwner;

  const confirmedMembers = members.filter(m => m.status === 'CONFIRMED');
  const pendingMembers = members.filter(m => m.status === 'INVITED' || m.status === 'MAYBE');

  const getRoleBadgeColor = (role: MemberRole) => {
    switch (role) {
      case 'OWNER': return 'bg-yellow-500 text-white';
      case 'EDITOR': return 'bg-blue-500 text-white';
      case 'EDITOR': return 'bg-green-500 text-white';
      case 'VIEWER': return 'bg-gray-500 text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusBadgeColor = (status: MemberStatus) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'INVITED': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'MAYBE': return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'DECLINED': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'REMOVED': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trip Settings" size="lg" className="max-w-2xl">
      <div className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-200">
            {error}
          </div>
        )}
        {/* Trip Info Section */}
        <div className="rounded-lg border border-white/20 bg-white/14 p-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
            <Settings className="h-5 w-5 text-white/80" />
            Trip Information
          </h3>

          <div className="space-y-4">
            <Input
              label="Trip Name"
              value={tripData.name}
              onChange={(e) => setTripData({ ...tripData, name: e.target.value })}
              disabled={!isOwner}
              variant="glass"
            />

            <textarea
              className="w-full rounded-lg border border-white/25 bg-white/14 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              rows={3}
              placeholder="Description"
              value={tripData.description}
              onChange={(e) => setTripData({ ...tripData, description: e.target.value })}
              disabled={!isOwner}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Destination"
                value={tripData.destination}
                onChange={(e) => setTripData({ ...tripData, destination: e.target.value })}
                disabled={!isOwner}
                variant="glass"
              />

              <Select
                label="Trip Style"
                value={tripData.style}
                onChange={(e) => setTripData({ ...tripData, style: e.target.value as TripStyle })}
                disabled={!isOwner}
                options={[
                  { value: 'OPEN', label: 'Open - Anyone can invite' },
                  { value: 'MANAGED', label: 'Managed - Only organizers can invite' },
                ]}
                variant="glass"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="datetime-local"
                value={tripData.startDate}
                onChange={(e) => setTripData({ ...tripData, startDate: e.target.value })}
                disabled={!isOwner}
                variant="glass"
              />

              <Input
                label="End Date"
                type="datetime-local"
                value={tripData.endDate}
                onFocus={() => {
                  if (!tripData.endDate && tripData.startDate) {
                    const dateOnly = tripData.startDate.split('T')[0];
                    setTripData({ ...tripData, endDate: dateOnly });
                  }
                }}
                onChange={(e) => setTripData({ ...tripData, endDate: e.target.value })}
                disabled={!isOwner}
                variant="glass"
              />
            </div>
          </div>
        </div>

        {/* Members Section */}
        <div className="rounded-lg border border-white/20 bg-white/14 p-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
            <Users className="h-5 w-5 text-white/80" />
            Members ({confirmedMembers.length})
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-white/50" />
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {confirmedMembers.map((member) => (
                <div key={member.userId} className="flex items-center justify-between p-3 rounded-lg border border-white/20 bg-white/14">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={member.user?.avatarUrl || undefined}
                      name={member.user?.name || 'User'}
                      size="sm"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{member.user?.name || 'User'}</p>
                        {member.userId === user?.id && (
                          <span className="text-xs text-white/50">(You)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {member.role === 'OWNER' && <Crown className="h-3 w-3 mr-1" />}
                          {member.role === 'EDITOR' && <Shield className="h-3 w-3 mr-1" />}
                          {member.role}
                        </Badge>
                        <Badge className={getStatusBadgeColor(member.status)}>
                          {member.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {isOwner && member.role !== 'OWNER' && (
                    <HoverDropdown
                      mode="click"
                      align="right"
                      trigger={
                        <button className="p-1.5 rounded-md hover:bg-white/20 transition-colors">
                          <MoreHorizontal className="h-4 w-4 text-white/70" />
                        </button>
                      }
                      items={[
                        {
                          label: member.role !== 'EDITOR' ? 'Make Editor' : 'Remove Editor',
                          onClick: () => handlePromoteToEditor(member.userId, member.role),
                          icon: <Shield className="h-4 w-4" />,
                        },
                        {
                          label: 'Transfer Master Role',
                          onClick: () => handleTransferMaster(member.userId),
                          icon: <Crown className="h-4 w-4 text-yellow-600" />,
                        },
                        {
                          label: 'Remove from Trip',
                          onClick: () => handleRemoveMember(member.userId),
                          icon: <UserMinus className="h-4 w-4 text-red-600" />,
                          className: 'text-red-600 hover:text-red-700',
                        },
                      ]}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Members Section (for MANAGED trips) */}
        {pendingMembers.length > 0 && (
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Pending Approval ({pendingMembers.length})
            </h3>

            <div className="space-y-3 max-h-48 overflow-y-auto">
              {pendingMembers.map((member) => (
                <div key={member.userId} className="flex items-center justify-between p-3 rounded-lg border border-white/20 bg-white/14">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={member.user?.avatarUrl || undefined}
                      name={member.user?.name || 'User'}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium text-white">{member.user?.name || 'User'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusBadgeColor(member.status)}>
                          {member.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleApproveMember(member.userId)}
                      className="text-green-400 hover:text-green-300 hover:bg-green-400/20"
                      title="Approve"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeclineMember(member.userId)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/20"
                      title="Decline"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/20">
          <Button variant="glass" onClick={onClose} className="rounded-lg">
            Cancel
          </Button>
          {isOwner && (
            <Button variant="glass" onClick={handleSave} disabled={isSaving} className="rounded-lg">
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}