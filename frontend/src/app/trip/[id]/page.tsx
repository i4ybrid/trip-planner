'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTripStore, useActivityStore } from '@/store';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Badge, Input, Textarea, Select, Modal, Avatar, EmptyState, LoadingOverlay } from '@/components';
import { formatDateRange, formatCurrency, cn } from '@/lib/utils';
import { MapPin, Calendar, Users, DollarSign, ThumbsUp, ThumbsDown, HelpCircle, Plus, Settings, Share2, ArrowLeft } from 'lucide-react';
import { CreateActivityInput, ActivityCategory } from '@/types';

const categoryOptions = [
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'excursion', label: 'Excursion' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'transport', label: 'Transport' },
  { value: 'activity', label: 'Activity' },
  { value: 'other', label: 'Other' },
];

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const { currentTrip, isLoading, error, fetchTrip, updateTrip, changeStatus } = useTripStore();
  const { activities, fetchActivities, createActivity, castVote } = useActivityStore();

  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newActivity, setNewActivity] = useState<CreateActivityInput>({
    title: '',
    category: 'activity',
  });

  useEffect(() => {
    if (tripId) {
      fetchTrip(tripId);
      fetchActivities(tripId);
    }
  }, [tripId, fetchTrip, fetchActivities]);

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    await createActivity(tripId, newActivity);
    setShowActivityModal(false);
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

  if (isLoading && !currentTrip) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !currentTrip) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error || 'Trip not found'}</p>
        <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="relative h-48 bg-gradient-to-br from-primary to-primary/60">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-6xl items-end justify-between p-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-5 w-5 text-white" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">{currentTrip.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-4 text-white/80">
                {currentTrip.destination && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {currentTrip.destination}
                  </span>
                )}
                {currentTrip.startDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDateRange(currentTrip.startDate, currentTrip.endDate)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowInviteModal(true)}>
              <Share2 className="mr-2 h-4 w-4" />
              Invite
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-6 flex items-center gap-4">
          <Badge status={currentTrip.status} className="text-sm" />
          <Select
            value={currentTrip.status}
            onChange={(e) => changeStatus(tripId, e.target.value as any)}
            options={[
              { value: 'IDEA', label: 'Idea (Feelers)' },
              { value: 'PLANNING', label: 'Planning' },
              { value: 'CONFIRMED', label: 'Confirmed' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Activities</CardTitle>
                  <Button size="sm" onClick={() => setShowActivityModal(true)}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <EmptyState
                    title="No activities yet"
                    description="Propose activities for the group to vote on"
                  />
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => {
                      const counts = getVoteCounts(activity);
                      return (
                        <div
                          key={activity.id}
                          className="rounded-lg border border-border p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{activity.title}</h4>
                              {activity.description && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {activity.description}
                                </p>
                              )}
                              <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
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
                            </div>
                            <Badge>{activity.category}</Badge>
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleVote(activity.id, 'yes')}
                                className={cn(
                                  'flex items-center gap-1 rounded-md px-3 py-1 text-sm transition-colors',
                                  (activity.votes || []).some(
                                    (v) => v.userId === 'user-1' && v.option === 'yes'
                                  )
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-secondary hover:bg-secondary/80'
                                )}
                              >
                                <ThumbsUp className="h-3 w-3" />
                                {counts.yes}
                              </button>
                              <button
                                onClick={() => handleVote(activity.id, 'maybe')}
                                className={cn(
                                  'flex items-center gap-1 rounded-md px-3 py-1 text-sm transition-colors',
                                  (activity.votes || []).some(
                                    (v) => v.userId === 'user-1' && v.option === 'maybe'
                                  )
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-secondary hover:bg-secondary/80'
                                )}
                              >
                                <HelpCircle className="h-3 w-3" />
                                {counts.maybe}
                              </button>
                              <button
                                onClick={() => handleVote(activity.id, 'no')}
                                className={cn(
                                  'flex items-center gap-1 rounded-md px-3 py-1 text-sm transition-colors',
                                  (activity.votes || []).some(
                                    (v) => v.userId === 'user-1' && v.option === 'no'
                                  )
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-secondary hover:bg-secondary/80'
                                )}
                              >
                                <ThumbsDown className="h-3 w-3" />
                                {counts.no}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentTrip.description && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                    <p className="mt-1">{currentTrip.description}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <p className="mt-1 capitalize">{currentTrip.status.toLowerCase()}</p>
                </div>
                {currentTrip.startDate && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Dates</h4>
                    <p className="mt-1">
                      {formatDateRange(currentTrip.startDate, currentTrip.endDate)}
                    </p>
                  </div>
                )}
                {currentTrip.destination && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Destination</h4>
                    <p className="mt-1">{currentTrip.destination}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
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
            placeholder="2 hour lesson at Waikiki Beach"
            value={newActivity.description || ''}
            onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Location"
              placeholder="Waikiki Beach"
              value={newActivity.location || ''}
              onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
            />
            <Input
              label="Cost"
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
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowActivityModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Activity</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Friends"
        description="Share this trip with friends"
      >
        <div className="space-y-4">
          <Input label="Email" type="email" placeholder="friend@example.com" />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button>Send Invite</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
