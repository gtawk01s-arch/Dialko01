export interface ISMSGatewayAdapter {
  sendSMS(to: string, message: string, senderId?: string): Promise<{ success: boolean; messageId: string; status: 'Delivered' | 'Sent' | 'Failed' }>;
}

export class MockSMSGatewayAdapter implements ISMSGatewayAdapter {
  async sendSMS(to: string, message: string, senderId = 'ZEEDIAL'): Promise<{ success: boolean; messageId: string; status: 'Delivered' | 'Sent' | 'Failed' }> {
    const messageId = `SMS-GW-${Math.floor(Math.random() * 900000 + 100000)}`;
    return {
      success: true,
      messageId,
      status: 'Delivered'
    };
  }
}

export const smsGatewayAdapter: ISMSGatewayAdapter = new MockSMSGatewayAdapter();
