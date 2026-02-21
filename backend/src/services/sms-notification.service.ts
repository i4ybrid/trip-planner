import { PrismaClient } from '@prisma/client';

// Stub implementation - requires twilio to be configured
export class SMSNotificationService {
  private prisma: PrismaClient;
  private fromNumber: string;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
  }

  private async sendSMS(to: string, body: string): Promise<boolean> {
    console.log('SMS notifications not configured - twilio not installed');
    return false;
  }

  async sendInviteSMS(phoneNumber: string, tripName: string, inviterName: string): Promise<boolean> {
    return false;
  }

  async sendTripReminderSMS(phoneNumber: string, tripName: string, daysUntil: number): Promise<boolean> {
    return false;
  }

  async sendPaymentRequestSMS(phoneNumber: string, tripName: string, amount: string): Promise<boolean> {
    return false;
  }

  async sendBookingConfirmationSMS(phoneNumber: string, activityName: string): Promise<boolean> {
    return false;
  }

  async notifyTripMembers(tripId: string, templateFn: (phone: string, userId: string) => Promise<{ body: string } | null>): Promise<number> {
    return 0;
  }

  async sendVerificationCode(phoneNumber: string, code: string): Promise<boolean> {
    return false;
  }

  async sendOneTimePassword(phoneNumber: string, code: string): Promise<boolean> {
    return false;
  }
}
