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

export function TripSettingsModal({ isOpen, onClose, trip, onTripUpdated }: TripSettingsModalProps) {
  const { user } = useAuth();
  const [tripData, setTripData] = useState({
    name: trip.name,
    description: trip.description || '',
    destination: trip.destination || '',
    startDate: trip.startDate?.split('T')[0] || '',
    endDate: trip.endDate?.split('T')[0] || '',
    style: trip.style as TripStyle,
  });
  const [members, setMembers] = useState<TripMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    try {
      await api.updateTrip(trip.id, {
        name: tripData.name,
        description: tripData.description || undefined,
        destination: tripData.destination || undefined,
        startDate: tripData.startDate || undefined,
        endDate: tripData.endDate || undefined,
        style: tripData.style,
      });
      onTripUpdated?.();
      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to save settings');
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
      alert(error.message || 'Failed to remove member');
    }
  };

  const handleApproveMember = async (userId: string) => {
    try {
      await api.updateTripMember(trip.id, userId, { status: 'CONFIRMED' });
      loadMembers();
    } catch (error: any) {
      alert(error.message || 'Failed to approve member');
    }
  };

  const handleDeclineMember = async (userId: string) => {
    try {
      await api.updateTripMember(trip.id, userId, { status: 'DECLINED' });
      loadMembers();
    } catch (error: any) {
      alert(error.message || 'Failed to decline member');
    }
  };

  const handlePromoteToOrganizer = async (userId: string, currentRole: MemberRole) => {
    const newRole = currentRole === 'ORGANIZER' ? 'MEMBER' : 'ORGANIZER';
    try {
      await api.updateTripMember(trip.id, userId, { role: newRole });
      loadMembers();
    } catch (error: any) {
      alert(error.message || 'Failed to update member role');
    }
  };

  const handleTransferMaster = async (userId: string) => {
    if (!confirm('Are you sure you want to transfer trip master role? You will lose master access.')) return;
    try {
      await api.updateTripMember(trip.id, userId, { role: 'MASTER' });
      await api.updateTripMember(trip.id, user!.id, { role: 'MEMBER' });
      loadMembers();
      onTripUpdated?.();
    } catch (error: any) {
      alert(error.message || 'Failed to transfer master role');
    }
  };

  const currentUserMember = members.find(m => m.userId === user?.id);
  const isMaster = currentUserMember?.role === 'MASTER';
  const isOrganizer = currentUserMember?.role === 'ORGANIZER' || isMaster;

  const confirmedMembers = members.filter(m => m.status === 'CONFIRMED');
  const pendingMembers = members.filter(m => m.status === 'INVITED' || m.status === 'MAYBE');

  const getRoleBadgeColor = (role: MemberRole) => {
    switch (role) {
      case 'MASTER': return 'bg-yellow-500 text-white';
      case 'ORGANIZER': return 'bg-blue-500 text-white';
      case 'MEMBER': return 'bg-green-500 text-white';
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
      <div className="space-y-6">
        {/* Trip Info Section */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Settings className="h-5 w-5" />
            Trip Information
          </h3>
          
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Trip Name</label>
              <Input
                value={tripData.name}
                onChange={(e) => setTripData({ ...tripData, name: e.target.value })}
                disabled={!isMaster}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                value={tripData.description}
                onChange={(e) => setTripData({ ...tripData, description: e.target.value })}
                disabled={!isMaster}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Destination</label>
                <Input
                  value={tripData.destination}
                  onChange={(e) => setTripData({ ...tripData, destination: e.target.value })}
                  disabled={!isMaster}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Trip Style</label>
                <Select
                  value={tripData.style}
                  onChange={(e) => setTripData({ ...tripData, style: e.target.value as TripStyle })}
                  disabled={!isMaster}
                  options={[
                    { value: 'OPEN', label: 'Open - Anyone can invite' },
                    { value: 'MANAGED', label: 'Managed - Only organizers can invite' },
                  ]}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <Input
                  type="date"
                  value={tripData.startDate}
                  onChange={(e) => setTripData({ ...tripData, startDate: e.target.value })}
                  disabled={!isMaster}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <Input
                  type="date"
                  value={tripData.endDate}
                  onChange={(e) => setTripData({ ...tripData, endDate: e.target.value })}
                  disabled={!isMaster}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Members Section */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Users className="h-5 w-5" />
            Members ({confirmedMembers.length})
          </h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {confirmedMembers.map((member) => (
                <div key={member.userId} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={member.user?.avatarUrl || undefined}
                      name={member.user?.name || 'User'}
                      size="sm"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.user?.name || 'User'}</p>
                        {member.userId === user?.id && (
                          <span className="text-xs text-muted-foreground">(You)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {member.role === 'MASTER' && <Crown className="h-3 w-3 mr-1" />}
                          {member.role === 'ORGANIZER' && <Shield className="h-3 w-3 mr-1" />}
                          {member.role}
                        </Badge>
                        <Badge className={getStatusBadgeColor(member.status)}>
                          {member.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {isMaster && member.role !== 'MASTER' && (
                    <HoverDropdown
                      mode="click"
                      align="right"
                      trigger={
                        <button className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      }
                      items={[
                        {
                          label: member.role !== 'ORGANIZER' ? 'Make Organizer' : 'Remove Organizer',
                          onClick: () => handlePromoteToOrganizer(member.userId, member.role),
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
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Pending Approval ({pendingMembers.length})
            </h3>
            
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {pendingMembers.map((member) => (
                <div key={member.userId} className="flex items-center justify-between p-3 rounded-lg border border-yellow-200 bg-yellow-50">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={member.user?.avatarUrl || undefined}
                      name={member.user?.name || 'User'}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium">{member.user?.name || 'User'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusBadgeColor(member.status)}>
                          {member.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {isOrganizer && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApproveMember(member.userId)}
                        className="text-green-600 hover:text-green-700"
                        title="Approve"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeclineMember(member.userId)}
                        className="text-red-600 hover:text-red-700"
                        title="Decline"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {isMaster && (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}