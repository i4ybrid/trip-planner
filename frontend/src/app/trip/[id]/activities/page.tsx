'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useActivityStore } from '@/store';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, Textarea, Select, Modal, EmptyState } from '@/components';
import { formatCurrency, cn } from '@/lib/utils';
import { mockApi } from '@/services/mock-api';
import { MapPin, DollarSign, ThumbsUp, ThumbsDown, HelpCircle, Plus } from 'lucide-react';
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
  
  const { activities, fetchActivities, createActivity, castVote } = useActivityStore();
  const [showModal, setShowModal] = useState(false);
  const [newActivity, setNewActivity] = useState<CreateActivityInput>({ title: '', category: 'activity' });

  useEffect(() => {
    if (tripId) {
      fetchActivities(tripId);
    }
  }, [tripId, fetchActivities]);

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    await createActivity(tripId, newActivity);
    setShowModal(false);
    setNewActivity({ title: '', category: 'activity' });
  };

  const handleVote = async (activityId: string, option: 'yes' | 'no' | 'maybe') => {
    await castVote(activityId, option);
  };

  const getVoteCounts = (activity: typeof activities[0]) => {
    const votes = activity.votes || [];
    return {
      yes: votes.filter((v) => v.option === 'yes').length,
      no: votes.filter((v) => v.option === 'no').length,
      maybe: votes.filter((v) => v.option === 'maybe').length,
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
                      <CardTitle className="text-lg">{activity.title}</CardTitle>
                      <Badge className="mt-1">{activity.category}</Badge>
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
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
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
                          (activity.votes || []).some((v) => v.userId === 'user-1' && v.option === 'yes')
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-secondary hover:bg-secondary/80'
                        )}
                      >
                        <ThumbsUp className="h-3 w-3" />
                        {counts.yes}
                      </button>
                      <button
                        onClick={() => handleVote(activity.id, 'maybe')}
                        className={cn(
                          'flex items-center gap-1 rounded-md px-3 py-1.5 text-sm transition-colors',
                          (activity.votes || []).some((v) => v.userId === 'user-1' && v.option === 'maybe')
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
                          (activity.votes || []).some((v) => v.userId === 'user-1' && v.option === 'no')
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-secondary hover:bg-secondary/80'
                        )}
                      >
                        <ThumbsDown className="h-3 w-3" />
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
        onClose={() => setShowModal(false)}
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
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Location (optional)"
              placeholder="Location"
              value={newActivity.location || ''}
              onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
            />
            <Input
              label="Cost (optional)"
              type="number"
              placeholder="50"
              value={newActivity.cost || ''}
              onChange={(e) => setNewActivity({ ...newActivity, cost: Number(e.target.value) })}
            />
          </div>
          <Select
            label="Category"
            value={newActivity.category}
            onChange={(e) => setNewActivity({ ...newActivity, category: e.target.value as ActivityCategory })}
            options={categoryOptions}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Activity</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
