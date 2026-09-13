export interface IEspoCRMAdapter {
  syncContact(contactData: any): Promise<{ espoContactId: string; status: string }>;
  syncLead(leadData: any): Promise<{ espoLeadId: string; status: string }>;
  syncTicket(ticketData: any): Promise<{ espoTicketId: string; status: string }>;
  getAccount(espoAccountId: string): Promise<any>;
}

export class MockEspoCRMAdapter implements IEspoCRMAdapter {
  async syncContact(contactData: any): Promise<{ espoContactId: string; status: string }> {
    return {
      espoContactId: `espo-ct-${Date.now().toString().slice(-5)}`,
      status: 'SYNCED_ESPO'
    };
  }

  async syncLead(leadData: any): Promise<{ espoLeadId: string; status: string }> {
    return {
      espoLeadId: `espo-ld-${Date.now().toString().slice(-5)}`,
      status: 'SYNCED_ESPO'
    };
  }

  async syncTicket(ticketData: any): Promise<{ espoTicketId: string; status: string }> {
    return {
      espoTicketId: `espo-tk-${Date.now().toString().slice(-5)}`,
      status: 'SYNCED_ESPO'
    };
  }

  async getAccount(espoAccountId: string): Promise<any> {
    return {
      id: espoAccountId,
      name: 'Acme Enterprise Client',
      type: 'Customer',
      industry: 'Telecommunications'
    };
  }
}

export const espoCRMAdapter: IEspoCRMAdapter = new MockEspoCRMAdapter();
