'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Label } from '@/components';
import { LeftSidebar } from '@/components/left-sidebar';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { NotificationDrawer } from '@/components/notification-drawer';
import { Mail, Lock, Bell, Wallet, Save, Trash2, Plus, Check, MessageSquare, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'payments';

interface NotificationSettings {
  tripReminders: boolean;
  voteAlerts: boolean;
  paymentRequests: boolean;
  chatMessages: boolean;
  friendRequests: boolean;
  tripUpdates: boolean;
}

interface PaymentMethod {
  id: string;
  type: 'venmo' | 'paypal' | 'zelle';
  handle: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    name: 'Test User',
    email: 'test@example.com',
    phone: '+1 (555) 123-4567',
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    tripReminders: true,
    voteAlerts: true,
    paymentRequests: true,
    chatMessages: true,
    friendRequests: true,
    tripUpdates: true,
  });

  const [notificationChannels, setNotificationChannels] = useState({
    push: true,
    email: true,
    text: false,
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: '1', type: 'venmo', handle: 'test-user' },
  ]);

  const [newPaymentType, setNewPaymentType] = useState<'venmo' | 'paypal' | 'zelle' | ''>('');
  const [newPaymentHandle, setNewPaymentHandle] = useState('');

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  const addPaymentMethod = () => {
    if (newPaymentType && newPaymentHandle) {
      setPaymentMethods([
        ...paymentMethods,
        { id: Date.now().toString(), type: newPaymentType, handle: newPaymentHandle },
      ]);
      setNewPaymentType('');
      setNewPaymentHandle('');
    }
  };

  const removePaymentMethod = (id: string) => {
    setPaymentMethods(paymentMethods.filter(p => p.id !== id));
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
      
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30 ml-sidebar">
        <div className="mx-auto flex max-w-4xl items-center justify-end gap-2 px-6 py-4">
          <ThemeSwitcher />
          <NotificationDrawer />
        </div>
      </header>

      <main className="ml-sidebar p-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-2xl font-bold">Settings</h1>

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
                  <CardContent className="space-y-4">
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
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? 'Saving...' : saved ? <><Check className="mr-2 h-4 w-4" /> Saved</> : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                    </Button>
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
                    <Button onClick={handleSave} disabled={isSaving}>
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
                        {[
                          { key: 'tripReminders', label: 'Trip Reminders', desc: 'Get notified before your trips' },
                          { key: 'voteAlerts', label: 'Vote Alerts', desc: 'When you need to vote on activities' },
                          { key: 'paymentRequests', label: 'Payment Requests', desc: 'When someone owes you or you owe them' },
                          { key: 'chatMessages', label: 'Chat Messages', desc: 'When you are tagged in chat' },
                          { key: 'friendRequests', label: 'Friend Requests', desc: 'When someone adds you as a friend' },
                          { key: 'tripUpdates', label: 'Trip Updates', desc: 'Activity bookings, status changes, etc.' },
                        ].map((item) => (
                          <div key={item.key} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{item.label}</p>
                              <p className="text-sm text-muted-foreground">{item.desc}</p>
                            </div>
                            <button
                              onClick={() => setNotifications({ 
                                ...notifications, 
                                [item.key]: !notifications[item.key as keyof NotificationSettings] 
                              })}
                              className={cn(
                                "relative h-6 w-11 rounded-full transition-colors",
                                notifications[item.key as keyof NotificationSettings] 
                                  ? "bg-primary" 
                                  : "bg-secondary"
                              )}
                            >
                              <span className={cn(
                                "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                                notifications[item.key as keyof NotificationSettings] && "translate-x-5"
                              )} />
                            </button>
                          </div>
                        ))}
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
                              method.type === 'zelle' && "bg-[#6D28D9] text-white"
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
                      <div className="grid gap-4 md:grid-cols-3">
                        {[
                          { type: 'venmo' as const, label: 'Venmo', color: 'bg-[#008CFF]', placeholder: '@username or email' },
                          { type: 'paypal' as const, label: 'PayPal', color: 'bg-[#003087]', placeholder: 'email@example.com' },
                          { type: 'zelle' as const, label: 'Zelle', color: 'bg-[#6D28D9]', placeholder: 'email or phone number' },
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
                              'email or phone number'
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
                              newPaymentType === 'zelle' && "bg-[#6D28D9] hover:bg-[#5B21B6]"
                            )}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Requests</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Auto-share payment details</p>
                          <p className="text-sm text-muted-foreground">Automatically share your payment handles when you request or receive payments</p>
                        </div>
                        <button
                          className={cn(
                            "relative h-6 w-11 rounded-full transition-colors",
                            "bg-primary"
                          )}
                        >
                          <span className="absolute left-0.5 top-0.5 h-5 w-5 translate-x-5 rounded-full bg-white transition-transform" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Request minimum</p>
                          <p className="text-sm text-muted-foreground">Only request payments above this amount</p>
                        </div>
                        <Input type="number" placeholder="0.00" className="w-24" />
                      </div>
                    </CardContent>
                  </Card>

                  <Button onClick={handleSave} disabled={isSaving} className="w-full">
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
