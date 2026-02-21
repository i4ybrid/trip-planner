import { PrismaClient } from '@prisma/client';

// Stub implementation - requires @sendgrid/mail to be configured
export class EmailNotificationService {
  private prisma: PrismaClient;
  private fromEmail = process.env.EMAIL_FROM || 'TripPlanner <noreply@tripplanner.app>';

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private async sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
    console.log('Email not configured - sendgrid not installed');
    return false;
  }

  private getBaseUrl(): string {
    return process.env.APP_URL || 'https://tripplanner.app';
  }

  async sendInviteEmail(inviteEmail: string, tripName: string, inviterName: string, token: string): Promise<boolean> {
    return false;
  }

  async sendTripUpdateEmail(userId: string, tripName: string, updateContent: string): Promise<boolean> {
    return false;
  }

  async sendPaymentRequestEmail(userId: string, tripName: string, amount: number, description: string): Promise<boolean> {
    return false;
  }

  async sendPaymentConfirmedEmail(userId: string, tripName: string, amount: number): Promise<boolean> {
    return false;
  }

  async sendBookingConfirmationEmail(userId: string, activityName: string, tripName: string, confirmationNum?: string): Promise<boolean> {
    return false;
  }

  async sendVotingReminderEmail(userId: string, tripName: string, activityCount: number): Promise<boolean> {
    return false;
  }

  async sendTripReminderEmail(userId: string, tripName: string, daysUntil: number): Promise<boolean> {
    return false;
  }

  async sendMessageMentionEmail(userId: string, senderName: string, tripName: string, messagePreview: string): Promise<boolean> {
    return false;
  }

  async notifyTripMembers(tripId: string, templateFn: (user: any) => Promise<{ subject: string; html: string; text: string }>, excludeUserId?: string): Promise<number> {
    return 0;
  }
}
