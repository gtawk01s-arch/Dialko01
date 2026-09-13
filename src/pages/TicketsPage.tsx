import React from 'react';
import {
  Plus,
  Filter as FilterIcon,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Phone,
  User,
  Trash2
} from 'lucide-react';
import { Ticket, Tenant } from '../types/index.js';

interface TicketsPageProps {
  activeTenant: Tenant;
}

export const TicketsPage: React.FC<TicketsPageProps> = ({ activeTenant }) => {
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentStatusTab, setCurrentStatusTab] = React.useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  const [newTicketForm, setNewTicketForm] = React.useState({
    subject: '',
    status: 'open',
    dueDate: '2026-08-30',
    assign: 'somnathlead_agent01@zeedial.com',
    phoneNumber: '9480732362',
    priority: 'Medium'
  });

  const fetchTickets = async () => {
    try {
      const res = await fetch(`/api/tickets?tenantId=${activeTenant.id}`);
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      console.error('Failed to load tickets', err);
    }
  };

  React.useEffect(() => {
    fetchTickets();
  }, [activeTenant.id]);

  const handleDeleteTicket = async (id: string) => {
    try {
      await fetch(`/api/tickets/${id}`, { method: 'DELETE' });
      fetchTickets();
    } catch (err) {
      console.error('Failed to delete ticket', err);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify(newTicketForm)
      });
      setIsCreateModalOpen(false);
      fetchTickets();
    } catch (err) {
      console.error('Failed to create ticket', err);
    }
  };

  const tabs = [
    { id: 'all', label: 'All', count: tickets.length },
    { id: 'open', label: 'Open', count: tickets.filter(t => t.status === 'open').length },
    { id: 'pending', label: 'Pending', count: 0 },
    { id: 'resolved', label: 'Resolved', count: 0 },
    { id: 'unresolve', label: 'Unresolve', count: 0 },
    { id: 'closed', label: 'Closed', count: 0 },
    { id: 'on hold', label: 'On Hold', count: 0 },
    { id: 'over due', label: 'Over Due', count: 0 },
    { id: 'unassigned', label: 'Unassigned', count: 0 }
  ];

  const filteredTickets = tickets.filter(t => {
    const matchesTab = currentStatusTab === 'all' || t.status.toLowerCase() === currentStatusTab.toLowerCase();
    const matchesSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.phoneNumber.includes(searchTerm) ||
                          t.ticketId.includes(searchTerm);
    return matchesTab && matchesSearch;
  });

  return (
    <div id="tickets-page-container" className="p-4 space-y-3 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-amber-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            TI
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Tickets</h2>
            <span className="text-[11px] text-slate-500">Customer issues, CRM tickets, and resolution pipeline</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 w-44 sm:w-56"
            />
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded font-bold shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Ticket
          </button>
        </div>
      </div>

      {/* Status Filter Tabs (Exact GTawk replica) */}
      <div className="flex items-center gap-1 overflow-x-auto bg-white p-1.5 rounded-lg border border-slate-200 text-xs custom-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setCurrentStatusTab(tab.id)}
            className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              currentStatusTab === tab.id
                ? 'bg-[#0284c7] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              currentStatusTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3.5 border-r border-slate-200">Ticket ID</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Status</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Subject</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Due Date</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Assign</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Phone Number</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Duration</th>
                <th className="py-2.5 px-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono font-bold text-sky-700">{ticket.ticketId}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 uppercase">
                      {ticket.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 font-medium text-slate-800">{ticket.subject}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-600 font-mono">{ticket.dueDate}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-700 truncate max-w-[200px]">{ticket.assign}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono text-slate-700">{ticket.phoneNumber}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono text-slate-500">{ticket.duration}</td>
                  <td className="py-2.5 px-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleDeleteTicket(ticket.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                        title="Delete Ticket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Ticket Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-3.5 bg-[#0284c7] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Add New Support Ticket</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Account activation inquiry"
                  value={newTicketForm.subject}
                  onChange={e => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={newTicketForm.phoneNumber}
                  onChange={e => setNewTicketForm({ ...newTicketForm, phoneNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Assign Agent</label>
                <input
                  type="text"
                  value={newTicketForm.assign}
                  onChange={e => setNewTicketForm({ ...newTicketForm, assign: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Due Date</label>
                <input
                  type="date"
                  value={newTicketForm.dueDate}
                  onChange={e => setNewTicketForm({ ...newTicketForm, dueDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded font-bold shadow-xs"
                >
                  Save Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
