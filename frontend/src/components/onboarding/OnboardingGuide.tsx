'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plane, Send, X } from 'lucide-react';
import { OnboardingCard } from './OnboardingCard';

const STORAGE_KEY = 'tripplanner_onboarding_dismissed';

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  path: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Add Friends',
    description: 'Connect with friends to plan trips together',
    actionLabel: 'Add Friends',
    path: '/friends',
  },
  {
    icon: <Plane className="h-6 w-6" />,
    title: 'Create a Trip',
    description: 'Start planning your next adventure',
    actionLabel: 'Create Trip',
    path: '/trip/new',
  },
  {
    icon: <Send className="h-6 w-6" />,
    title: 'Invite Friends',
    description: 'Invite friends to join your trip planning',
    actionLabel: 'Invite',
    path: '/trip/new',
  },
];

export function OnboardingGuide() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsDismissed(true);
  };

  const handleAction = (path: string) => {
    router.push(path);
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className="relative mb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Welcome to TripPlanner! 🎉</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Get started by following these steps
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Dismiss onboarding"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {onboardingSteps.map((step, index) => (
          <OnboardingCard
            key={step.title}
            icon={step.icon}
            title={step.title}
            description={step.description}
            actionLabel={step.actionLabel}
            onAction={() => handleAction(step.path)}
            animationDelay={`${index * 100}ms`}
          />
        ))}
      </div>
    </div>
  );
}
