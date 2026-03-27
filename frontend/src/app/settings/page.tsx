'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Label, Avatar } from '@/components';
import { LeftSidebar } from '@/components/left-sidebar';
import { AppHeader } from '@/components/app-header';
import { Mail, Lock, Bell, Wallet, Save, Trash2, Plus, Check, MessageSquare, Smartphone, Camera, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { Settings } from '@/types';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'payments';

interface PaymentMethod {
  id: string;
  type: 'venmo' | 'paypal' | 'zelle' | 'cashapp';
  handle: string;
}

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress and resize image using Canvas
  const compressImage = async (file: File, maxWidth = 800, maxHeight = 800, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw image centered on canvas (for square crop if needed)
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create new file with same name but .jpg extension
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                type: 'image/jpeg',
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };

      img.src = url;
    });
  };

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    avatarUrl: '',
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [notifications, setNotifications] = useState<Settings>({
    userId: '',
    friendRequestSource: 'ANYONE',
    emailTripInvites: false,
    emailPaymentRequests: false,
    emailVotingReminders: false,
    emailTripReminders: false,
    emailMessages: false,
    emailFriendRequests: false,
    pushTripInvites: false,
    pushPaymentRequests: false,
    pushVotingReminders: false,
    pushTripReminders: false,
    pushMessages: false,
    inAppAll: false,
  });

  const [notificationChannels, setNotificationChannels] = useState({
    push: false,
    email: false,
    text: false,
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [newPaymentType, setNewPaymentType] = useState<'venmo' | 'paypal' | 'zelle' | 'cashapp' | ''>('');
  const [newPaymentHandle, setNewPaymentHandle] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      const [userResult, settingsResult] = await Promise.all([
        api.getCurrentUser(),
        api.getSettings(),
      ]);
      if (userResult.data) {
        setProfile({
          name: userResult.data.name || '',
          email: userResult.data.email || '',
          phone: userResult.data.phone || '',
          avatarUrl: userResult.data.avatarUrl || '',
        });
        const methods: PaymentMethod[] = [];
        if (userResult.data.venmo) methods.push({ id: 'venmo', type: 'venmo', handle: userResult.data.venmo });
        if (userResult.data.paypal) methods.push({ id: 'paypal', type: 'paypal', handle: userResult.data.paypal });
        if (userResult.data.zelle) methods.push({ id: 'zelle', type: 'zelle', handle: userResult.data.zelle });
        if (userResult.data.cashapp) methods.push({ id: 'cashapp', type: 'cashapp', handle: userResult.data.cashapp });
        setPaymentMethods(methods);
      }
      if (settingsResult.data) {
        setNotifications(settingsResult.data);
      }
      setIsLoading(false);
    };
    loadSettings();
  }, []);

  const handleProfileSave = async () => {
    setIsSaving(true);
    const result = await api.updateProfile({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
    });
    setIsSaving(false);
    if (!result.error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Compress image client-side before upload
      const compressedFile = await compressImage(file, 800, 800, 0.8);
      
      const result = await api.uploadAvatar(compressedFile);
      if (result.data) {
        const newAvatarUrl = result.data.avatarUrl;
        setProfile({ ...profile, avatarUrl: newAvatarUrl });

        // Fetch updated user from API and update session
        const userResult = await api.getCurrentUser();
        if (userResult.data) {
          await updateSession({
            ...session,
            user: {
              ...session?.user,
              image: userResult.data.avatarUrl,
            },
          });
        }

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm('Are you sure you want to remove your avatar?')) return;

    setIsUploadingAvatar(true);
    try {
      await api.removeAvatar();
      setProfile({ ...profile, avatarUrl: '' });
      
      // Fetch updated user from API and update session
      const userResult = await api.getCurrentUser();
      if (userResult.data) {
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            image: userResult.data.avatarUrl || null,
          },
        });
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to remove avatar:', error);
      alert('Failed to remove avatar. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePasswordSave = async () => {
    if (passwords.new !== passwords.confirm) {
      alert('Passwords do not match');
      return;
    }
    setIsSaving(true);
    const result = await api.changePassword(passwords.current, passwords.new);
    setIsSaving(false);
    if (!result.error) {
      setPasswords({ current: '', new: '', confirm: '' });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleNotificationSave = async () => {
    setIsSaving(true);
    const result = await api.updateSettings(notifications);
    setIsSaving(false);
    if (!result.error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const addPaymentMethod = async () => {
    if (newPaymentType && newPaymentHandle) {
      const updatedMethods = [...paymentMethods, { id: newPaymentType, type: newPaymentType, handle: newPaymentHandle }];
      setPaymentMethods(updatedMethods);
      
      const paymentFields: Record<string, string> = {};
      updatedMethods.forEach(m => {
        paymentFields[m.type] = m.handle;
      });
      
      setIsSaving(true);
      const result = await api.updateProfile(paymentFields);
      setIsSaving(false);
      
      if (!result.error) {
        setNewPaymentType('');
        setNewPaymentHandle('');
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    }
  };

  const removePaymentMethod = async (id: string) => {
    const updatedMethods = paymentMethods.filter(p => p.id !== id);
    setPaymentMethods(updatedMethods);
    
    const paymentFields: Record<string, string | undefined> = {};
    updatedMethods.forEach(m => {
      paymentFields[m.type] = m.handle;
    });
    ['venmo', 'paypal', 'zelle', 'cashapp'].forEach(type => {
      if (!paymentFields[type]) paymentFields[type] = undefined;
    });
    
    setIsSaving(true);
    const result = await api.updateProfile(paymentFields);
    setIsSaving(false);
    
    if (!result.error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: <Mail className="h-4 w-4" /> },
    { id: 'security' as const, label: 'Security', icon: <Lock className="h-4 w-4" /> },
    { id: 'notifications' as const, label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
    { id: 'payments' as const, label: 'Payments', icon: <Wallet className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-theme-gradient">
      <LeftSidebar />
      
      <AppHeader title="Settings" />

      <main className="ml-sidebar p-6">
        <div className="mx-auto max-w-4xl">

          <div className="flex gap-6">
            {/* Sidebar tabs */}
            <div className="w-48 shrink-0">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1">
              {activeTab === 'profile' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex items-center gap-6">
                      <div className="relative h-24 w-24 shrink-0">
                        <Avatar
                          src={profile.avatarUrl || undefined}
                          name={profile.name || 'User'}
                          size="xl"
                          className="h-24 w-24"
                        />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">Profile Photo</h3>
                        <p className="text-sm text-muted-foreground">
                          JPG, GIF or PNG. Max size 5MB.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingAvatar}
                          >
                            <Camera className="mr-2 h-4 w-4" />
                            {isUploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                          </Button>
                          {profile.avatarUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={handleRemoveAvatar}
                              disabled={isUploadingAvatar}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </Button>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </div>
                    </div>

                    <div className="border-t border-border pt-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <Button onClick={handleProfileSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : saved ? <><Check className="mr-2 h-4 w-4" /> Saved</> : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'security' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="current">Current Password</Label>
                      <Input
                        id="current"
                        type="password"
                        value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new">New Password</Label>
                      <Input
                        id="new"
                        type="password"
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm">Confirm New Password</Label>
                      <Input
                        id="confirm"
                        type="password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <Button onClick={handlePasswordSave} disabled={isSaving}>
                      {isSaving ? 'Updating...' : saved ? <><Check className="mr-2 h-4 w-4" /> Updated</> : <><Save className="mr-2 h-4 w-4" /> Update Password</>}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Channels</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Choose how you want to receive notifications
                      </p>
                      <div className="grid gap-4 md:grid-cols-3">
                        <button
                          onClick={() => setNotificationChannels({ ...notificationChannels, push: !notificationChannels.push })}
                          className={cn(
                            "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                            notificationChannels.push
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <Bell className="h-6 w-6" />
                          <span className="font-medium">Push</span>
                          <span className="text-xs text-muted-foreground">In-app</span>
                        </button>
                        <button
                          onClick={() => setNotificationChannels({ ...notificationChannels, email: !notificationChannels.email })}
                          className={cn(
                            "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                            notificationChannels.email
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <Mail className="h-6 w-6" />
                          <span className="font-medium">Email</span>
                          <span className="text-xs text-muted-foreground">test@example.com</span>
                        </button>
                        <button
                          onClick={() => setNotificationChannels({ ...notificationChannels, text: !notificationChannels.text })}
                          className={cn(
                            "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                            notificationChannels.text
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <Smartphone className="h-6 w-6" />
                          <span className="font-medium">Text</span>
                          <span className="text-xs text-muted-foreground">+1 (555) 123-4567</span>
                        </button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Email: Trip Invites</p>
                            <p className="text-sm text-muted-foreground">Receive email when invited to trips</p>
                          </div>
                          <button
                            onClick={() => setNotifications({ ...notifications, emailTripInvites: !notifications.emailTripInvites })}
                            className={cn(
                              "relative h-6 w-11 rounded-full transition-colors",
                              notifications.emailTripInvites ? "bg-primary" : "bg-secondary"
                            )}
                          >
                            <span className={cn(
                              "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                              notifications.emailTripInvites && "translate-x-5"
                            )} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Email: Voting Reminders</p>
                            <p className="text-sm text-muted-foreground">When you need to vote on activities</p>
                          </div>
                          <button
                            onClick={() => setNotifications({ ...notifications, emailVotingReminders: !notifications.emailVotingReminders })}
                            className={cn(
                              "relative h-6 w-11 rounded-full transition-colors",
                              notifications.emailVotingReminders ? "bg-primary" : "bg-secondary"
                            )}
                          >
                            <span className={cn(
                              "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                              notifications.emailVotingReminders && "translate-x-5"
                            )} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Email: Payment Requests</p>
                            <p className="text-sm text-muted-foreground">When someone owes you or you owe them</p>
                          </div>
                          <button
                            onClick={() => setNotifications({ ...notifications, emailPaymentRequests: !notifications.emailPaymentRequests })}
                            className={cn(
                              "relative h-6 w-11 rounded-full transition-colors",
                              notifications.emailPaymentRequests ? "bg-primary" : "bg-secondary"
                            )}
                          >
                            <span className={cn(
                              "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                              notifications.emailPaymentRequests && "translate-x-5"
                            )} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Email: Messages</p>
                            <p className="text-sm text-muted-foreground">When you receive direct messages</p>
                          </div>
                          <button
                            onClick={() => setNotifications({ ...notifications, emailMessages: !notifications.emailMessages })}
                            className={cn(
                              "relative h-6 w-11 rounded-full transition-colors",
                              notifications.emailMessages ? "bg-primary" : "bg-secondary"
                            )}
                          >
                            <span className={cn(
                              "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                              notifications.emailMessages && "translate-x-5"
                            )} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Push: Trip Reminders</p>
                            <p className="text-sm text-muted-foreground">Get notified before your trips</p>
                          </div>
                          <button
                            onClick={() => setNotifications({ ...notifications, pushTripReminders: !notifications.pushTripReminders })}
                            className={cn(
                              "relative h-6 w-11 rounded-full transition-colors",
                              notifications.pushTripReminders ? "bg-primary" : "bg-secondary"
                            )}
                          >
                            <span className={cn(
                              "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                              notifications.pushTripReminders && "translate-x-5"
                            )} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Push: Messages</p>
                            <p className="text-sm text-muted-foreground">When you receive direct messages</p>
                          </div>
                          <button
                            onClick={() => setNotifications({ ...notifications, pushMessages: !notifications.pushMessages })}
                            className={cn(
                              "relative h-6 w-11 rounded-full transition-colors",
                              notifications.pushMessages ? "bg-primary" : "bg-secondary"
                            )}
                          >
                            <span className={cn(
                              "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                              notifications.pushMessages && "translate-x-5"
                            )} />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Methods</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Add your payment handles so friends can pay you back easily. These will be shared with trip members when you request or receive payments.
                      </p>

                      {paymentMethods.length === 0 && (
                        <div className="rounded-lg bg-muted p-6 text-center">
                          <Wallet className="mx-auto h-8 w-8 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">No payment methods added yet</p>
                        </div>
                      )}

                      {paymentMethods.map((method) => (
                        <div 
                          key={method.id} 
                          className="flex items-center justify-between rounded-lg border border-border p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-xl",
                              method.type === 'venmo' && "bg-[#008CFF] text-white",
                              method.type === 'paypal' && "bg-[#003087] text-white",
                              method.type === 'zelle' && "bg-[#6D28D9] text-white",
                              method.type === 'cashapp' && "bg-black text-white"
                            )}>
                              {method.type === 'venmo' && (
                                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                                </svg>
                              )}
                              {method.type === 'paypal' && (
                                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/>
                                </svg>
                              )}
                              {method.type === 'zelle' && (
                                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                              )}
                              {method.type === 'cashapp' && (
                                <span className="font-bold text-lg">$</span>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold capitalize">{method.type}</p>
                              <p className="text-sm text-muted-foreground">{method.handle}</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removePaymentMethod(method.id)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Add Payment Method</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-4">
                        {[
                          { type: 'venmo' as const, label: 'Venmo', color: 'bg-[#008CFF]', placeholder: '@username or email' },
                          { type: 'paypal' as const, label: 'PayPal', color: 'bg-[#003087]', placeholder: 'email@example.com' },
                          { type: 'zelle' as const, label: 'Zelle', color: 'bg-[#6D28D9]', placeholder: 'email or phone number' },
                          { type: 'cashapp' as const, label: 'Cash App', color: 'bg-[#000000]', placeholder: '$username' },
                        ].map((option) => (
                          <button
                            key={option.type}
                            onClick={() => setNewPaymentType(option.type)}
                            className={cn(
                              "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                              newPaymentType === option.type
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-white", option.color)}>
                              {option.type === 'venmo' && <span className="font-bold">V</span>}
                              {option.type === 'paypal' && <span className="font-bold">P</span>}
                              {option.type === 'zelle' && <span className="font-bold">Z</span>}
                              {option.type === 'cashapp' && <span className="font-bold">$</span>}
                            </div>
                            <span className="font-medium">{option.label}</span>
                          </button>
                        ))}
                      </div>

                      {newPaymentType && (
                        <div className="flex gap-2">
                          <Input
                            placeholder={
                              newPaymentType === 'venmo' ? '@username or email' :
                              newPaymentType === 'paypal' ? 'email@example.com' :
                              newPaymentType === 'zelle' ? 'email or phone number' :
                              '$username'
                            }
                            value={newPaymentHandle}
                            onChange={(e) => setNewPaymentHandle(e.target.value)}
                            className="flex-1"
                          />
                          <Button 
                            onClick={addPaymentMethod} 
                            disabled={!newPaymentHandle}
                            className={cn(
                              newPaymentType === 'venmo' && "bg-[#008CFF] hover:bg-[#0073D9]",
                              newPaymentType === 'paypal' && "bg-[#003087] hover:bg-[#002266]",
                              newPaymentType === 'zelle' && "bg-[#6D28D9] hover:bg-[#5B21B6]",
                              newPaymentType === 'cashapp' && "bg-black hover:bg-gray-800"
                            )}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Button onClick={handleNotificationSave} disabled={isSaving} className="w-full">
                    {isSaving ? 'Saving...' : saved ? <><Check className="mr-2 h-4 w-4" /> Saved</> : <><Save className="mr-2 h-4 w-4" /> Save Payment Settings</>}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
