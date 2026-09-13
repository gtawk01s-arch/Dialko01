export interface IVicidialAdapter {
  syncCampaign(campaignData: any): Promise<{ viciCampaignId: string; status: string }>;
  getAgentStatus(viciAgentId: string): Promise<any>;
  monitorCall(viciCallId: string, supervisorAgentId: string, mode: 'listen' | 'barge' | 'whisper'): Promise<{ success: boolean; channel: string; mode: string }>;
  getRandomLiveCall(): Promise<{ viciCallId: string; agentName: string; phoneNumber: string; duration: string } | null>;
  dispatchLeadToDialer(leadData: any, listId: string): Promise<{ success: boolean; viciLeadId: string }>;
  hangupCall(viciCallId: string): Promise<{ success: boolean }>;
}

export class MockVicidialAdapter implements IVicidialAdapter {
  async syncCampaign(campaignData: any): Promise<{ viciCampaignId: string; status: string }> {
    return {
      viciCampaignId: `VICI_${campaignData.name || 'CAMP'}_${Date.now().toString().slice(-4)}`,
      status: 'SYNCED_OK'
    };
  }

  async getAgentStatus(viciAgentId: string): Promise<any> {
    return {
      viciAgentId,
      status: 'INCALL',
      campaign: 'RIYA001',
      sessionSec: 145,
      channel: 'SIP/27001-000000a1'
    };
  }

  async monitorCall(viciCallId: string, supervisorAgentId: string, mode: 'listen' | 'barge' | 'whisper'): Promise<{ success: boolean; channel: string; mode: string }> {
    return {
      success: true,
      channel: `Local/8600051@default`,
      mode: mode.toUpperCase()
    };
  }

  async getRandomLiveCall(): Promise<{ viciCallId: string; agentName: string; phoneNumber: string; duration: string } | null> {
    return {
      viciCallId: 'VICI-CALL-' + Math.floor(Math.random() * 90000 + 10000),
      agentName: 'somnathlead_agent01@zeedial.com',
      phoneNumber: '918073236368',
      duration: '00:02:45'
    };
  }

  async dispatchLeadToDialer(leadData: any, listId: string): Promise<{ success: boolean; viciLeadId: string }> {
    return {
      success: true,
      viciLeadId: `VICI_LEAD_${Date.now().toString().slice(-6)}`
    };
  }

  async hangupCall(viciCallId: string): Promise<{ success: boolean }> {
    return { success: true };
  }
}

export const vicidialAdapter: IVicidialAdapter = new MockVicidialAdapter();
