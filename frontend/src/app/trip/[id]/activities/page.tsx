'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useActivityStore } from '@/store';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, Textarea, Select, Modal, EmptyState } from '@/components';
import { formatCurrency, cn } from '@/lib/utils';
import { MapPin, Check, X, HelpCircle, Plus, Loader, Lock, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/services/api';
import { TripMember } from '@/types';
import { CreateActivityInput, ActivityCategory } from '@/types';

const categoryOptions = [
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'excursion', label: 'Excursion' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'transport', label: 'Transport' },
  { value: 'activity', label: 'Activity' },
  { value: 'other', label: 'Other' },
];

export default function TripActivities() {
  const params = useParams();
  const tripId = params.id as string;
  
  const { user } = useAuth();
  const { activities, fetchActivities, createActivity, updateActivity, castVote, confirmActivity, rejectActivity, deleteActivity } = useActivityStore();
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newActivity, setNewActivity] = useState<CreateActivityInput>({ title: '', category: 'activity' });
  const [editingActivity, setEditingActivity] = useState<(typeof activities)[0] | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newActivityErrors, setNewActivityErrors] = useState<{ startTime?: string; endTime?: string }>({});
  const [editActivityErrors, setEditActivityErrors] = useState<{ startTime?: string; endTime?: string }>({});

  const currentUserMember = members.find(m => m.userId === user?.id);
  const canEdit = currentUserMember?.role === 'MASTER' || currentUserMember?.role === 'ORGANIZER';

  useEffect(() => {
    const loadMembers = async () => {
      const result = await api.getTripMembers(tripId);
      if (!result.error && result.data) {
        setMembers(result.data);
      }
    };
    if (tripId) {
      loadMembers();
    }
  }, [tripId]);

  useEffect(() => {
    if (tripId) {
      fetchActivities(tripId);
    }
  }, [tripId, fetchActivities]);

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateTimes(newActivity.startTime, newActivity.endTime, newActivity.category);
    if (Object.keys(errors).length > 0) {
      setNewActivityErrors(errors);
      return;
    }
    setNewActivityErrors({});
    setIsSubmitting(true);
    try {
      await createActivity(tripId, newActivity);
      setShowModal(false);
      setNewActivity({ title: '', category: 'activity' });
      setNewActivityErrors({});
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity) return;
    const errors = validateTimes(editingActivity.startTime, editingActivity.endTime, editingActivity.category);
    if (Object.keys(errors).length > 0) {
      setEditActivityErrors(errors);
      return;
    }
    setEditActivityErrors({});
    setIsSubmitting(true);
    try {
      await updateActivity(editingActivity.id, editingActivity);
      setShowEditModal(false);
      setEditingActivity(null);
      setEditActivityErrors({});
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (activityId: string, option: 'yes' | 'no' | 'maybe') => {
    await castVote(activityId, option.toUpperCase() as 'YES' | 'NO' | 'MAYBE');
  };

  const handleConfirm = async (activityId: string) => {
    const confirmed = await confirmActivity(tripId, activityId);
    if (confirmed && confirmed.cost && Number(confirmed.cost) > 0) {
      alert(`Expense created for ${confirmed.title}`);
    }
    await fetchActivities(tripId);
  };

  const handleReject = async (activityId: string) => {
    await rejectActivity(tripId, activityId);
    await fetchActivities(tripId);
  };

  const handleDelete = async (activityId: string) => {
    if (!window.confirm('Delete this activity? This cannot be undone.')) return;
    await deleteActivity(activityId);
  };

  const getVoteCounts = (activity: typeof activities[0]) => {
    const votes = activity.votes || [];
    return {
      yes: votes.filter((v) => v.option === 'YES').length,
      no: votes.filter((v) => v.option === 'NO').length,
      maybe: votes.filter((v) => v.option === 'MAYBE').length,
    };
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

  // Convert ISO string to datetime-local input value (YYYY-MM-DDTHH:mm in local time)
  const toDatetimeLocal = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Validate time fields for a given activity data
  const validateTimes = (startTime?: string, endTime?: string, category?: string): { startTime?: string; endTime?: string } => {
    const errors: { startTime?: string; endTime?: string } = {};
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (end < start) {
        errors.endTime = 'End time must be on or after start time';
      }
    }
    if (category === 'accommodation' && !endTime) {
      errors.endTime = 'End time is required for accommodation activities';
    }
    return errors;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Activities</h2>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Activity
        </Button>
      </div>

      {activities.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              title="No activities yet"
              description="Propose activities for the group to vote on"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {activities.map((activity) => {
            const counts = getVoteCounts(activity);
            return (
              <Card key={activity.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className={cn("text-lg", activity.status === 'REJECTED' && "line-through opacity-50")}>
                        {activity.title}
                      </CardTitle>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge>{activity.category}</Badge>
                        {activity.costType && activity.costType !== 'PER_PERSON' && (
                          <Badge variant="outline" className="text-xs">
                            {activity.costType === 'FIXED' ? 'Fixed' : 'Per Person'}
                          </Badge>
                        )}
                        {activity.status === 'PROPOSED' && (
                          <Badge variant="secondary">Proposed</Badge>
                        )}
                        {activity.status === 'CONFIRMED' && (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Confirmed</Badge>
                        )}
                        {activity.status === 'REJECTED' && (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Rejected</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {canEdit && activity.status === 'PROPOSED' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConfirm(activity.id)}
                            className="h-8 px-2 text-green-500 hover:text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/30"
                            title="Confirm activity"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(activity.id)}
                            className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30"
                            title="Reject activity"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingActivity(activity);
                            setShowEditModal(true);
                          }}
                          className="h-8 px-2"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(activity.id)}
                          className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                          title="Delete activity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activity.description && (
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {activity.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {activity.location}
                      </span>
                    )}
                    {activity.cost && (
                      <span className="text-sm">
                        {formatCurrency(activity.cost)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVote(activity.id, 'yes')}
                        className={cn(
                          'flex items-center gap-1 rounded-md px-3 py-1.5 text-sm transition-colors',
                          (activity.votes || []).some((v) => v.option === 'YES')
                            ? 'bg-green-100 text-green-500 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-secondary hover:bg-secondary/80'
                        )}
                      >
                        <Check className="h-3 w-3" />
                        {counts.yes}
                      </button>
                      <button
                        onClick={() => handleVote(activity.id, 'maybe')}
                        className={cn(
                          'flex items-center gap-1 rounded-md px-3 py-1.5 text-sm transition-colors',
                          (activity.votes || []).some((v) => v.option === 'MAYBE')
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-secondary hover:bg-secondary/80'
                        )}
                      >
                        <HelpCircle className="h-3 w-3" />
                        {counts.maybe}
                      </button>
                      <button
                        onClick={() => handleVote(activity.id, 'no')}
                        className={cn(
                          'flex items-center gap-1 rounded-md px-3 py-1.5 text-sm transition-colors',
                          (activity.votes || []).some((v) => v.option === 'NO')
                            ? 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-secondary hover:bg-secondary/80'
                        )}
                      >
                        <X className="h-3 w-3" />
                        {counts.no}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setNewActivityErrors({});
        }}
        title="Add Activity"
        description="Propose an activity for the trip"
      >
        <form onSubmit={handleCreateActivity} className="space-y-4">
          <Input
            label="Title"
            placeholder="Surfing lessons"
            value={newActivity.title}
            onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
            required
          />
          <Textarea
            label="Description (optional)"
            placeholder="What's this activity about?"
            value={newActivity.description || ''}
            onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
          />
          <Select
            label="Category"
            value={newActivity.category}
            onChange={(e) => {
              const newCategory = e.target.value as ActivityCategory;
              // Default to FIXED cost type for accommodation, PER_PERSON for everything else
              const defaultCostType = newCategory === 'accommodation' ? 'FIXED' : 'PER_PERSON';
              setNewActivity({ ...newActivity, category: newCategory, costType: defaultCostType });
              // If switching to accommodation, require endTime
              if (newCategory === 'accommodation' && !newActivity.endTime) {
                setNewActivityErrors(prev => ({ ...prev, endTime: 'End time is required for accommodation activities' }));
              }
            }}
            options={categoryOptions}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Location (optional)"
              placeholder="Location"
              value={newActivity.location || ''}
              onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
            />
            <div>
              <label className="text-sm font-medium mb-1.5 block">Cost (optional)</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    placeholder="50"
                    value={newActivity.cost || ''}
                    onChange={(e) => setNewActivity({ ...newActivity, cost: Number(e.target.value) })}
                    onBlur={(e) => { const v = parseFloat(e.target.value); if (isNaN(v)) e.target.value = ''; }}
                    className="pr-8 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <span className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground",
                    (newActivity.costType || 'PER_PERSON') !== 'PER_PERSON' && "opacity-50"
                  )}>/pp</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNewActivity({ ...newActivity, costType: (newActivity.costType || 'PER_PERSON') === 'PER_PERSON' ? 'FIXED' : 'PER_PERSON' })}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md border transition-colors shrink-0",
                    (newActivity.costType || 'PER_PERSON') === 'PER_PERSON'
                      ? "bg-primary text-white border-primary"
                      : "bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700 opacity-50"
                  )}
                >
                  /pp
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Start Time</label>
              <input
                type="datetime-local"
                value={toDatetimeLocal(newActivity.startTime)}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewActivity(prev => {
                    const newStartTime = val ? new Date(val).toISOString() : undefined;
                    // Auto-populate endTime if empty and startTime is being set
                    return {
                      ...prev,
                      startTime: newStartTime,
                      endTime: !prev.endTime && val ? newStartTime : prev.endTime,
                    };
                  });
                  if (newActivityErrors.endTime) {
                    setNewActivityErrors(prev => ({ ...prev, endTime: undefined }));
                  }
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                End Time {newActivity.category !== 'accommodation' && '(optional)'}
              </label>
              <input
                type="datetime-local"
                value={toDatetimeLocal(newActivity.endTime)}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewActivity(prev => ({
                    ...prev,
                    endTime: val ? new Date(val).toISOString() : undefined,
                  }));
                  // Clear endTime error when endTime changes
                  if (newActivityErrors.endTime) {
                    setNewActivityErrors(prev => ({ ...prev, endTime: undefined }));
                  }
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              {newActivityErrors.endTime && (
                <p className="mt-1 text-sm text-red-500">{newActivityErrors.endTime}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Activity'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingActivity(null);
          setEditActivityErrors({});
        }}
        title="Edit Activity"
        description="Update activity details"
      >
        {editingActivity && (
          <form onSubmit={handleUpdateActivity} className="space-y-4">
            <Input
              label="Title"
              placeholder="Surfing lessons"
              value={editingActivity.title}
              onChange={(e) => setEditingActivity({ ...editingActivity, title: e.target.value })}
              required
            />
            <Textarea
              label="Description (optional)"
              placeholder="What's this activity about?"
              value={editingActivity.description || ''}
              onChange={(e) => setEditingActivity({ ...editingActivity, description: e.target.value })}
            />
            <Select
              label="Category"
              value={editingActivity.category}
              onChange={(e) => {
                const newCategory = e.target.value as ActivityCategory;
                setEditingActivity({ ...editingActivity, category: newCategory });
                if (newCategory === 'accommodation' && !editingActivity.endTime) {
                  setEditActivityErrors(prev => ({ ...prev, endTime: 'End time is required for accommodation activities' }));
                }
              }}
              options={categoryOptions}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Location (optional)"
                placeholder="Location"
                value={editingActivity.location || ''}
                onChange={(e) => setEditingActivity({ ...editingActivity, location: e.target.value })}
              />
              <div>
                <label className="text-sm font-medium mb-1.5 block">Cost (locked)</label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>
                    {editingActivity.cost ? formatCurrency(editingActivity.cost) : 'No cost'} ({editingActivity.costType === 'FIXED' ? 'Fixed' : 'Per Person'})
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Start Time</label>
                <input
                  type="datetime-local"
                  value={toDatetimeLocal(editingActivity.startTime)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditingActivity(prev => {
                      if (!prev) return prev;
                      const newStartTime = val ? new Date(val).toISOString() : undefined;
                      return {
                        ...prev,
                        startTime: newStartTime,
                        endTime: !prev.endTime && val ? newStartTime : prev.endTime,
                      };
                    });
                    if (editActivityErrors.endTime) {
                      setEditActivityErrors(prev => ({ ...prev, endTime: undefined }));
                    }
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  End Time {editingActivity.category !== 'accommodation' && '(optional)'}
                </label>
                <input
                  type="datetime-local"
                  value={toDatetimeLocal(editingActivity.endTime)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditingActivity(prev => {
                      if (!prev) return prev;
                      const newEndTime = val ? new Date(val).toISOString() : undefined;
                      // Auto-correct: if endTime is before startTime, set to startTime
                      const correctedEndTime = newEndTime && prev.startTime && new Date(newEndTime) < new Date(prev.startTime)
                        ? prev.startTime
                        : newEndTime;
                      return {
                        ...prev,
                        endTime: correctedEndTime,
                      };
                    });
                    if (editActivityErrors.endTime) {
                      setEditActivityErrors(prev => ({ ...prev, endTime: undefined }));
                    }
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                {editActivityErrors.endTime && (
                  <p className="mt-1 text-sm text-red-500">{editActivityErrors.endTime}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => {
                setShowEditModal(false);
                setEditingActivity(null);
                setEditActivityErrors({});
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
