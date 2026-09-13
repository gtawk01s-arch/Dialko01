import React from 'react';
import {
  Plus,
  Filter as FilterIcon,
  Search,
  Upload,
  Download,
  Edit2,
  Trash2,
  X,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';
import { Contact, Tenant } from '../types/index.js';
import { FilterDrawer } from '../components/FilterDrawer.js';

interface ContactsPageProps {
  activeTenant: Tenant;
}

export const ContactsPage: React.FC<ContactsPageProps> = ({ activeTenant }) => {
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [showExportDropdown, setShowExportDropdown] = React.useState(false);

  const [newContactForm, setNewContactForm] = React.useState({
    name: '',
    phoneNumber: '',
    altPhoneNumber: '',
    email: '',
    primaryAddress: '',
    city: '',
    state: '',
    country: 'India'
  });

  const fetchContacts = async () => {
    try {
      const res = await fetch(`/api/contacts?tenantId=${activeTenant.id}`);
      const data = await res.json();
      setContacts(data);
    } catch (err) {
      console.error('Failed to load contacts', err);
    }
  };

  React.useEffect(() => {
    fetchContacts();
  }, [activeTenant.id]);

  const handleExport = (format: 'CSV' | 'TXT') => {
    setShowExportDropdown(false);
    let content = '';
    if (format === 'CSV') {
      content = "data:text/csv;charset=utf-8," +
        ["Name,Phone,Email,City,State,Created"].join(",") + "\n" +
        contacts.map(c => `${c.name},${c.phoneNumber},${c.email},${c.city},${c.state},${c.createdAt}`).join("\n");
    } else {
      content = "data:text/plain;charset=utf-8," +
        contacts.map(c => `${c.name} | ${c.phoneNumber} | ${c.email} | ${c.city}`).join("\n");
    }
    const encodedUri = encodeURI(content);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dialko_contacts_${Date.now()}.${format.toLowerCase()}`);
    document.body.appendChild(link);
    link.click();
  };

  const handleDeleteContact = async (id: string) => {
    try {
      await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      fetchContacts();
    } catch (err) {
      console.error('Failed to delete contact', err);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify(newContactForm)
      });
      setIsCreateModalOpen(false);
      fetchContacts();
    } catch (err) {
      console.error('Failed to create contact', err);
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phoneNumber.includes(searchTerm) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="contacts-page-container" className="p-4 space-y-3 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            CO
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Contacts</h2>
            <span className="text-[11px] text-slate-500">Address book and EspoCRM synchronized contacts</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 w-44 sm:w-56"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold border border-slate-200"
            >
              <Download className="w-3.5 h-3.5" />
              Export
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showExportDropdown && (
              <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-30">
                <button
                  onClick={() => handleExport('CSV')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-medium"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport('TXT')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-medium"
                >
                  Export TXT
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded font-bold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Contact
          </button>

          <button
            onClick={() => setIsFilterOpen(true)}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200"
          >
            <FilterIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3.5 border-r border-slate-200">Name</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Phone Number</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Alternative Phone</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Email</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Primary Address</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">City</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Created At</th>
                <th className="py-2.5 px-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContacts.map(contact => (
                <tr key={contact.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3.5 border-r border-slate-100 font-bold text-slate-800 flex items-center gap-1.5">
                    {contact.name}
                    {contact.espoContactId && (
                      <span className="text-[9px] px-1 py-0.2 bg-teal-50 text-teal-700 rounded border border-teal-200">
                        ESPO
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono text-sky-700">{contact.phoneNumber}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 font-mono text-slate-400">{contact.altPhoneNumber || '-'}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-600">{contact.email}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-600 truncate max-w-[160px]">{contact.primaryAddress}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-600">{contact.city}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-500 font-mono text-[11px]">{contact.createdAt}</td>
                  <td className="py-2.5 px-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                        title="Delete Contact"
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

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => {}}
        onReset={() => setSearchTerm('')}
        title="Filter Contacts"
      >
        <div>
          <label className="block text-slate-700 font-bold mb-1">Search Contact</label>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs"
          />
        </div>
      </FilterDrawer>

      {/* Add Contact Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-3.5 bg-[#0284c7] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Add New Contact</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newContactForm.name}
                  onChange={e => setNewContactForm({ ...newContactForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={newContactForm.phoneNumber}
                  onChange={e => setNewContactForm({ ...newContactForm, phoneNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Email</label>
                <input
                  type="email"
                  value={newContactForm.email}
                  onChange={e => setNewContactForm({ ...newContactForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">City</label>
                <input
                  type="text"
                  value={newContactForm.city}
                  onChange={e => setNewContactForm({ ...newContactForm, city: e.target.value })}
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
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
