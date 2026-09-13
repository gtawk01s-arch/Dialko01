import React from 'react';
import { Plus, Search, Calendar, Phone, Clock, User, X, Trash2 } from 'lucide-react';
import { Meeting, Tenant } from '../types/index.js';

interface MeetingsPageProps {
  activeTenant: Tenant;
}

export const MeetingsPage: React.FC<MeetingsPageProps> = ({ activeTenant }) => {
  const [meetings, setMeetings] = React.useState<Meeting[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  const [newMeetingForm, setNewMeetingForm] = React.useState({
    meetingTitle: '',
    meetingSubtitle: '',
    phoneNumber: '9480732362',
    agent: 'somnathlead_agent01',
    module: 'Sales',
    campaign: 'RIYA001',
    scheduledTime: new Date().toISOString().slice(0, 16)
  });

  const fetchMeetings = async () => {
    try {
      const res = await fetch(`/api/meetings?tenantId=${activeTenant.id}`);
      const data = await res.json();
      setMeetings(data);
    } catch (err) {
      console.error('Failed to load meetings', err);
    }
  };

  React.useEffect(() => {
    fetchMeetings();
  }, [activeTenant.id]);

  const handleDeleteMeeting = async (id: string) => {
    try {
      await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
      fetchMeetings();
    } catch (err) {
      console.error('Failed to delete meeting', err);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify(newMeetingForm)
      });
      setIsCreateModalOpen(false);
      fetchMeetings();
    } catch (err) {
      console.error('Failed to create meeting', err);
    }
  };

  const filteredMeetings = meetings.filter(m =>
    m.meetingTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.phoneNumber.includes(searchTerm)
  );

  return (
    <div id="meetings-page-container" className="p-4 space-y-3 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            ME
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Meetings</h2>
            <span className="text-[11px] text-slate-500">Scheduled sales appointments, callbacks, and demos</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search meetings..."
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
            Schedule Meeting
          </button>
        </div>
      </div>

      {/* Meetings Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3.5 border-r border-slate-200">Meeting Title</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Phone Number</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Agent</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Module</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Campaign</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Status</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Scheduled Time</th>
                <th className="py-2.5 px-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMeetings.map(meeting => (
                <tr key={meeting.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3.5 border-r border-slate-100 font-bold text-slate-800">{meeting.meetingTitle}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono text-sky-700">{meeting.phoneNumber}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-700">{meeting.agent}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-600">{meeting.module}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 font-medium text-slate-800">{meeting.campaign}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700">
                      {meeting.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono text-slate-600">{meeting.scheduledTime}</td>
                  <td className="py-2.5 px-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button className="text-sky-600 hover:text-sky-800 font-semibold text-xs">Join / Call</button>
                      <button
                        onClick={() => handleDeleteMeeting(meeting.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                        title="Delete Meeting"
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

      {/* Create Meeting Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-3.5 bg-[#0284c7] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Schedule New Meeting</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Meeting Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Product Demo Call"
                  value={newMeetingForm.meetingTitle}
                  onChange={e => setNewMeetingForm({ ...newMeetingForm, meetingTitle: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Customer Phone *</label>
                <input
                  type="text"
                  required
                  value={newMeetingForm.phoneNumber}
                  onChange={e => setNewMeetingForm({ ...newMeetingForm, phoneNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={newMeetingForm.scheduledTime}
                  onChange={e => setNewMeetingForm({ ...newMeetingForm, scheduledTime: e.target.value })}
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
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
