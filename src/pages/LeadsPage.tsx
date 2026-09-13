import React from 'react';
import {
  Plus,
  Filter as FilterIcon,
  Search,
  Upload,
  Download,
  Trash2,
  FileText,
  CheckCircle,
  X,
  ChevronRight,
  ChevronLeft,
  Database,
  UserCheck,
  AlertCircle,
  FileSpreadsheet,
  Zap,
  Eye,
  RefreshCw,
  Info
} from 'lucide-react';
import { Lead, Tenant, CampaignList, Campaign } from '../types/index.js';
import { FilterDrawer } from '../components/FilterDrawer.js';

interface LeadsPageProps {
  activeTenant: Tenant;
  onOpenSurvey?: (lead: Lead) => void;
}

interface ParsedLeadRow {
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  industry: string;
  city: string;
  state: string;
  country: string;
  assignedAgent: string;
  notes: string;
  [key: string]: string;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({ activeTenant, onOpenSurvey }) => {
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [campaignLists, setCampaignLists] = React.useState<CampaignList[]>([]);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedIndustry, setSelectedIndustry] = React.useState('Select Industry');
  const [selectedTemplate, setSelectedTemplate] = React.useState('Select Template');
  const [selectedLeadIds, setSelectedLeadIds] = React.useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isUploadWizardOpen, setIsUploadWizardOpen] = React.useState(false);
  const [wizardStep, setWizardStep] = React.useState(1);
  const [notificationToast, setNotificationToast] = React.useState<string | null>(null);

  // Upload Wizard State
  const [uploadData, setUploadData] = React.useState({
    fileType: 'CSV' as 'CSV' | 'XLSX' | 'TXT',
    listId: '12',
    fileName: 'zeedial_leads_sample.csv',
    duplicateCheck: 'Yes' as 'Yes' | 'No',
    autoAssign: 'Yes' as 'Yes' | 'No',
    phoneCol: 'Phone Number',
    firstNameCol: 'First Name',
    lastNameCol: 'Last Name',
    emailCol: 'Email',
    industryCol: 'Industry',
    cityCol: 'City',
    stateCol: 'State',
    countryCol: 'Country',
    assignedAgentCol: 'Assigned Agent',
    notesCol: 'Notes'
  });

  const [rawFileHeaders, setRawFileHeaders] = React.useState<string[]>([
    'Phone Number', 'First Name', 'Last Name', 'Email', 'Industry', 'City', 'State', 'Country', 'Assigned Agent', 'Notes'
  ]);
  const [parsedRows, setParsedRows] = React.useState<ParsedLeadRow[]>([
    {
      phone: '918073236368',
      firstName: 'Rajesh',
      lastName: 'Kumar',
      email: 'rajesh.kumar@enterprise.in',
      industry: 'IT & Telecom',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      assignedAgent: 'somnathlead_agent01',
      notes: 'Decision maker for telecom trunk upgrade'
    },
    {
      phone: '919876543210',
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya.s@fintechcorp.com',
      industry: 'Financial Services',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      assignedAgent: 'somnathlead_agent02',
      notes: 'Requested predictive dialer pricing'
    },
    {
      phone: '18005550199',
      firstName: 'David',
      lastName: 'Miller',
      email: 'david.miller@globalcloud.com',
      industry: 'Healthcare',
      city: 'Chicago',
      state: 'Illinois',
      country: 'USA',
      assignedAgent: 'somnathlead_admin',
      notes: 'Requires IVR voice blast & queue routing'
    }
  ]);
  const [pasteCsvText, setPasteCsvText] = React.useState('');
  const [isPastingCsv, setIsPastingCsv] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const [newLeadForm, setNewLeadForm] = React.useState({
    firstName: '',
    lastName: '',
    phone: '',
    altPhone: '',
    email: '',
    industry: 'IT & Telecom',
    template: 'Default',
    list_id: '12',
    campaign: 'RIYA001',
    disposition: 'New',
    assignedAgent: ''
  });

  const fetchLeads = async () => {
    try {
      const res = await fetch(`/api/leads?tenantId=${activeTenant.id}`);
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      console.error('Failed to load leads', err);
    }
  };

  const fetchListsAndCampaigns = async () => {
    try {
      const [listRes, campRes] = await Promise.all([
        fetch(`/api/lists?tenantId=${activeTenant.id}`),
        fetch(`/api/campaigns?tenantId=${activeTenant.id}`)
      ]);
      const listData = await listRes.json();
      const campData = await campRes.json();
      setCampaignLists(listData || []);
      setCampaigns(campData || []);
      if (listData && listData.length > 0 && !uploadData.listId) {
        setUploadData(prev => ({ ...prev, listId: listData[0].list_id }));
      }
    } catch (err) {
      console.error('Failed to fetch lists and campaigns', err);
    }
  };

  React.useEffect(() => {
    fetchLeads();
    fetchListsAndCampaigns();
  }, [activeTenant.id]);

  // Selected Target List & its Campaign
  const currentTargetList = campaignLists.find(l => String(l.list_id) === String(uploadData.listId)) || campaignLists[0];
  const currentTargetCampaign = campaigns.find(c =>
    c.name.toLowerCase() === (currentTargetList?.campaign_name || '').toLowerCase()
  );
  const isPredictiveMode = currentTargetCampaign?.type === 'PREDICTIVE' || currentTargetCampaign?.type === 'AUTO' || currentTargetCampaign?.type === 'POWER';
  const isPreviewMode = currentTargetCampaign?.type === 'PREVIEW';

  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 4000);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedLeadIds(leads.map(l => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const toggleSelectLead = (id: string) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter(i => i !== id));
    } else {
      setSelectedLeadIds([...selectedLeadIds, id]);
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      fetchLeads();
      showToast('Lead deleted successfully');
    } catch (err) {
      console.error('Failed to delete lead', err);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify(newLeadForm)
      });
      setIsCreateModalOpen(false);
      fetchLeads();
      showToast(`Lead for ${newLeadForm.firstName} created successfully`);
    } catch (err) {
      console.error('Failed to create lead', err);
    }
  };

  // Download Sample Template with Columns
  const handleDownloadSampleFile = (mode: 'standard' | 'preview' | 'predictive' = 'standard') => {
    let headerStr = "Phone Number,First Name,Last Name,Email,Industry,City,State,Country,Assigned Agent,Notes\n";
    let rowsStr = "";

    if (mode === 'preview' || isPreviewMode) {
      rowsStr =
        "918073236368,Rajesh,Kumar,rajesh.kumar@enterprise.in,IT & Telecom,Bengaluru,Karnataka,India,somnathlead_agent01,Hot lead - preview inspection requested before call\n" +
        "919876543210,Priya,Sharma,priya.s@fintechcorp.com,Financial Services,Mumbai,Maharashtra,India,somnathlead_agent02,VIP Enterprise banking account - schedule demo\n" +
        "18005550199,David,Miller,david.miller@globalcloud.com,Healthcare,Chicago,Illinois,USA,somnathlead_admin,High-value enterprise lead for manual agent review\n";
    } else {
      rowsStr =
        "918073236368,Rajesh,Kumar,rajesh.kumar@enterprise.in,IT & Telecom,Bengaluru,Karnataka,India,somnathlead_agent01,Decision maker for telephony trunk upgrade\n" +
        "919876543210,Priya,Sharma,priya.s@fintechcorp.com,Financial Services,Mumbai,Maharashtra,India,somnathlead_agent02,Inquired about automated predictive dialer ratios\n" +
        "18005550199,David,Miller,david.miller@globalcloud.com,Healthcare,Chicago,Illinois,USA,somnathlead_admin,Needs IVR voice blast & inbound routing queue\n";
    }

    const csvContent = headerStr + rowsStr;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `zeedial_leads_sample_${mode === 'preview' ? 'preview_mode' : 'template'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Sample template file downloaded successfully');
  };

  // CSV parsing function
  const parseCsvText = (text: string, fileName: string = 'uploaded_leads.csv') => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return;

    // Parse header row
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    setRawFileHeaders(headers);

    // Auto-map detected columns
    const findHeader = (patterns: string[]) => {
      return headers.find(h => patterns.some(p => h.toLowerCase().includes(p))) || headers[0];
    };

    const detectedPhone = findHeader(['phone', 'mobile', 'contact', 'number', 'tel']);
    const detectedFirst = findHeader(['first', 'fname', 'name', 'full name']);
    const detectedLast = findHeader(['last', 'lname', 'surname']);
    const detectedEmail = findHeader(['email', 'mail']);
    const detectedIndustry = findHeader(['industry', 'sector', 'domain']);
    const detectedCity = findHeader(['city', 'town']);
    const detectedState = findHeader(['state', 'province']);
    const detectedCountry = findHeader(['country', 'nation']);
    const detectedAgent = findHeader(['assigned', 'agent', 'rep', 'owner', 'user']);
    const detectedNotes = findHeader(['note', 'comment', 'remark', 'desc']);

    setUploadData(prev => ({
      ...prev,
      fileName,
      phoneCol: detectedPhone || headers[0],
      firstNameCol: detectedFirst || (headers[1] || headers[0]),
      lastNameCol: detectedLast || (headers[2] || ''),
      emailCol: detectedEmail || '',
      industryCol: detectedIndustry || '',
      cityCol: detectedCity || '',
      stateCol: detectedState || '',
      countryCol: detectedCountry || '',
      assignedAgentCol: detectedAgent || '',
      notesCol: detectedNotes || ''
    }));

    // Parse data rows
    const rows: ParsedLeadRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Simple CSV split handling quotes
      const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      if (values.length >= 1 && values.some(v => v.length > 0)) {
        const rowObj: any = {};
        headers.forEach((h, colIdx) => {
          rowObj[h] = values[colIdx] || '';
        });

        rows.push({
          phone: rowObj[detectedPhone] || values[0] || '',
          firstName: rowObj[detectedFirst] || values[1] || `Lead_${i}`,
          lastName: rowObj[detectedLast] || values[2] || '',
          email: rowObj[detectedEmail] || values[3] || '',
          industry: rowObj[detectedIndustry] || 'IT & Telecom',
          city: rowObj[detectedCity] || 'Bengaluru',
          state: rowObj[detectedState] || 'Karnataka',
          country: rowObj[detectedCountry] || 'India',
          assignedAgent: rowObj[detectedAgent] || '',
          notes: rowObj[detectedNotes] || ''
        });
      }
    }

    if (rows.length > 0) {
      setParsedRows(rows);
      showToast(`Parsed ${rows.length} lead records from file`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      parseCsvText(text, file.name);
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = () => {
    if (!pasteCsvText.trim()) return;
    parseCsvText(pasteCsvText, 'pasted_data.csv');
    setIsPastingCsv(false);
    setPasteCsvText('');
  };

  const handleCompleteUploadWizard = async () => {
    setIsUploading(true);
    try {
      const payload = {
        fileType: uploadData.fileType,
        listId: uploadData.listId,
        campaignName: currentTargetList?.campaign_name || currentTargetCampaign?.name || 'Sales_Campaign',
        campaignType: currentTargetCampaign?.type || (isPredictiveMode ? 'PREDICTIVE' : isPreviewMode ? 'PREVIEW' : 'STANDARD'),
        duplicateCheck: uploadData.duplicateCheck,
        autoAssign: uploadData.autoAssign,
        leadsData: parsedRows
      };

      const res = await fetch('/api/leads/batch-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        showToast(`Successfully imported ${data.count} leads into List #${uploadData.listId}!`);
        setIsUploadWizardOpen(false);
        setWizardStep(1);
        fetchLeads();
        fetchListsAndCampaigns();
      } else {
        showToast('Failed to import leads. Please verify column mapping.');
      }
    } catch (err) {
      console.error('Failed to batch upload leads', err);
      showToast('Error during lead batch upload');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredLeads = leads.filter(l =>
    (l.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     l.phone.includes(searchTerm) ||
     l.lead_id.includes(searchTerm)) &&
    (selectedIndustry === 'Select Industry' || l.industry === selectedIndustry) &&
    (selectedTemplate === 'Select Template' || l.template === selectedTemplate)
  );

  return (
    <div id="leads-page-container" className="p-4 space-y-3 select-none">
      {/* Toast Notification */}
      {notificationToast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            LE
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Leads Management</h2>
            <span className="text-[11px] text-slate-500">Contact records, hopper lists, column mapping & automated dialing queues</span>
          </div>
        </div>

        {/* Dropdowns & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedIndustry}
            onChange={e => setSelectedIndustry(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 font-medium"
          >
            <option value="Select Industry">Select Industry</option>
            <option value="IT & Telecom">IT & Telecom</option>
            <option value="Financial Services">Financial Services</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Real Estate">Real Estate</option>
          </select>

          <select
            value={selectedTemplate}
            onChange={e => setSelectedTemplate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 font-medium"
          >
            <option value="Select Template">Select Template</option>
            <option value="Default">Default</option>
            <option value="Enterprise Sales">Enterprise Sales</option>
          </select>

          <button
            onClick={() => handleDownloadSampleFile('standard')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold border border-slate-200 transition cursor-pointer"
            title="Download CSV Sample Template with Phone Number & Field Columns"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Download Sample File
          </button>

          <button
            onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8," +
                ["Lead ID,First Name,Last Name,Phone,Email,Campaign,List ID,Assigned Agent,Status,Disposition"].join(",") + "\n" +
                filteredLeads.map(l => `${l.lead_id},${l.firstName},${l.lastName || ''},${l.phone},${l.email},${l.campaign},${l.list_id},${l.assignedAgent || ''},${l.status},${l.disposition}`).join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `zeedial_leads_export_${Date.now()}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              showToast('Exported filtered leads to CSV');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold border border-slate-200 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Leads
          </button>

          <button
            id="btn-upload-leads-wizard"
            onClick={() => {
              setWizardStep(1);
              setIsUploadWizardOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-xs transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Leads
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Lead
          </button>

          <button
            onClick={() => setIsFilterOpen(true)}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200"
            title="Filter Leads"
          >
            <FilterIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 border-r border-slate-200 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.length === leads.length && leads.length > 0}
                    onChange={handleSelectAll}
                    className="rounded text-sky-600"
                  />
                </th>
                <th className="py-2.5 px-3 border-r border-slate-200">Lead ID</th>
                <th className="py-2.5 px-3 border-r border-slate-200">First / Last Name</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Phone Number</th>
                <th className="py-2.5 px-3 border-r border-slate-200">List ID</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Campaign</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Assigned Agent</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Industry</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Disposition</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center">Dialed Count</th>
                <th className="py-2.5 px-3 border-r border-slate-200">Source</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map(lead => (
                <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2 px-3 border-r border-slate-100 text-center">
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.includes(lead.id)}
                      onChange={() => toggleSelectLead(lead.id)}
                      className="rounded text-sky-600"
                    />
                  </td>
                  <td className="py-2 px-3 border-r border-slate-100 font-mono font-bold text-sky-700">{lead.lead_id}</td>
                  <td className="py-2 px-3 border-r border-slate-100 font-medium text-slate-800">
                    {lead.firstName} {lead.lastName || ''}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-100 font-mono text-slate-700 font-semibold">{lead.phone}</td>
                  <td className="py-2 px-3 border-r border-slate-100 font-mono text-slate-700">{lead.list_id}</td>
                  <td className="py-2 px-3 border-r border-slate-100 text-slate-800 font-medium">{lead.campaign}</td>
                  <td className="py-2 px-3 border-r border-slate-100 font-medium">
                    {lead.assignedAgent ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1 w-fit">
                        <UserCheck className="w-3 h-3" />
                        {lead.assignedAgent}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned (Queue)</span>
                    )}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-100 text-slate-600">{lead.industry}</td>
                  <td className="py-2 px-3 border-r border-slate-100">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-700">
                      {lead.disposition}
                    </span>
                  </td>
                  <td className="py-2 px-3 border-r border-slate-100 text-center font-mono">{lead.dialedCount}</td>
                  <td className="py-2 px-3 border-r border-slate-100 text-slate-500 truncate max-w-[120px]">{lead.source}</td>
                  <td className="py-2 px-3 border-r border-slate-100 text-center">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      lead.status === 'Queued' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      lead.status === 'In Progress' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onOpenSurvey?.(lead)}
                        className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded transition cursor-pointer"
                        title="Fill Call Survey / Notes"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded transition cursor-pointer"
                        title="Delete Lead"
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

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => {}}
        onReset={() => {
          setSelectedIndustry('Select Industry');
          setSelectedTemplate('Select Template');
          setSearchTerm('');
        }}
        title="Filter Leads"
      >
        <div>
          <label className="block text-slate-700 font-bold mb-1">Search Lead Name / Phone</label>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs"
          />
        </div>
      </FilterDrawer>

      {/* 6-Step Lead Batch Upload Wizard Modal */}
      {isUploadWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl my-6 overflow-hidden animate-in zoom-in-95">
            {/* Wizard Header */}
            <div className="px-5 py-3.5 bg-[#0284c7] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Lead Upload Wizard</h3>
                <span className="text-[11px] text-sky-100">
                  Step {wizardStep} of 6: {
                    wizardStep === 1 ? 'Target List & Sample Template Download' :
                    wizardStep === 2 ? 'Spreadsheet Column Mapping' :
                    wizardStep === 3 ? 'Dialing Strategy & Agent Distribution' :
                    wizardStep === 4 ? 'Deduplication & DNC Scrubbing' :
                    wizardStep === 5 ? 'Data Verification & Hopper Preview' :
                    'Synchronize & Execute Batch Dialing'
                  }
                </span>
              </div>
              <button
                onClick={() => setIsUploadWizardOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-500 overflow-x-auto">
              <span className={`flex items-center gap-1 ${wizardStep === 1 ? 'text-sky-700 font-bold' : ''}`}>
                1. List & Template
              </span>
              <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
              <span className={`flex items-center gap-1 ${wizardStep === 2 ? 'text-sky-700 font-bold' : ''}`}>
                2. Column Map
              </span>
              <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
              <span className={`flex items-center gap-1 ${wizardStep === 3 ? 'text-sky-700 font-bold' : ''}`}>
                3. Distribution
              </span>
              <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
              <span className={`flex items-center gap-1 ${wizardStep === 4 ? 'text-sky-700 font-bold' : ''}`}>
                4. Deduplication
              </span>
              <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
              <span className={`flex items-center gap-1 ${wizardStep === 5 ? 'text-sky-700 font-bold' : ''}`}>
                5. Preview
              </span>
              <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
              <span className={`flex items-center gap-1 ${wizardStep === 6 ? 'text-sky-700 font-bold' : ''}`}>
                6. Sync
              </span>
            </div>

            {/* Wizard Step Body */}
            <div className="p-6 text-xs space-y-4 max-h-[70vh] overflow-y-auto">
              {/* STEP 1: Select Target List & Download Sample Template */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Step 1: Select Target List & Download Sample File</h4>
                      <p className="text-slate-500 text-[11px]">
                        Choose the campaign list to receive these leads. Download the sample file to fill in phone numbers and columns.
                      </p>
                    </div>

                    {/* Download Sample File Action */}
                    <button
                      type="button"
                      onClick={() => handleDownloadSampleFile(isPreviewMode ? 'preview' : 'predictive')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      Download Sample File (.CSV)
                    </button>
                  </div>

                  {/* Target List Selector */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Select Target Campaign List *</label>
                    <select
                      value={uploadData.listId}
                      onChange={e => setUploadData({ ...uploadData, listId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-semibold text-slate-800"
                    >
                      {campaignLists.map(list => {
                        const camp = campaigns.find(c => c.name.toLowerCase() === (list.campaign_name || '').toLowerCase());
                        const dialType = camp?.type || 'PREDICTIVE';
                        return (
                          <option key={list.list_id} value={list.list_id}>
                            List #{list.list_id} — {list.list_name} [Campaign: {list.campaign_name} • Mode: {dialType}] ({list.lead_count || 0} leads)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Mode Banner Indicator */}
                  {isPredictiveMode ? (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2.5">
                      <Zap className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-amber-900 block">⚡ Predictive Campaign Active ({currentTargetCampaign?.name})</span>
                        <p className="text-amber-800 text-[11px] mt-0.5">
                          When you upload this file, phone numbers will immediately enter the active Hopper. The predictive dialer will automatically dial numbers concurrently based on the dial ratio ({currentTargetCampaign?.dial_ratio || '1.5'}x).
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-sky-50 border border-sky-200 p-3 rounded-lg flex items-start gap-2.5">
                      <Eye className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-sky-900 block">👁️ Preview Campaign Active ({currentTargetCampaign?.name || 'Preview Mode'})</span>
                        <p className="text-sky-800 text-[11px] mt-0.5">
                          In Preview mode, the <strong>'Assigned Agent'</strong> column from your spreadsheet will assign each row to its respective agent. Agents inspect lead info on their workspace before initiating the call.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* File Upload / Drop Area */}
                  <div className="space-y-2">
                    <label className="block text-slate-700 font-bold">Select or Upload Leads Spreadsheet (.CSV / .XLSX / .TXT)</label>
                    <div className="border-2 border-dashed border-sky-300 bg-sky-50/40 rounded-lg p-6 text-center hover:bg-sky-50 transition relative">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls,.txt"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Upload className="w-8 h-8 text-sky-600 mx-auto mb-2" />
                      <p className="font-bold text-slate-700 text-xs">{uploadData.fileName}</p>
                      <p className="text-[11px] text-slate-500">
                        Drag and drop your filled file here or click to browse. ({parsedRows.length} sample rows loaded)
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => setIsPastingCsv(!isPastingCsv)}
                        className="text-sky-700 font-semibold text-[11px] hover:underline cursor-pointer"
                      >
                        {isPastingCsv ? 'Hide CSV Paste Box' : 'Or Paste CSV / Tabular Text Directly'}
                      </button>
                    </div>

                    {isPastingCsv && (
                      <div className="space-y-2 bg-slate-50 p-3 rounded border border-slate-200 animate-in fade-in">
                        <label className="block text-slate-700 font-bold text-[11px]">Paste CSV Raw Text (Headers in First Row)</label>
                        <textarea
                          rows={4}
                          value={pasteCsvText}
                          onChange={e => setPasteCsvText(e.target.value)}
                          placeholder="Phone Number,First Name,Last Name,Email,Assigned Agent&#10;918073236368,Rajesh,Kumar,rajesh@corp.in,somnathlead_agent01"
                          className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={handlePasteSubmit}
                          className="px-3 py-1 bg-sky-600 text-white rounded font-bold text-xs"
                        >
                          Parse Pasted CSV Text
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: Map File Columns to Database Fields */}
              {wizardStep === 2 && (
                <div className="space-y-3">
                  <div className="border-b border-slate-200 pb-2">
                    <h4 className="font-bold text-slate-800 text-sm">Step 2: Map Spreadsheet Columns to Lead Database Fields</h4>
                    <p className="text-slate-500 text-[11px]">
                      Match the columns from your uploaded file to Zeedial lead fields. Phone Number is mandatory.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Phone Number Column <span className="text-rose-600">* (Mandatory for Dialing)</span>
                      </label>
                      <select
                        value={uploadData.phoneCol}
                        onChange={e => setUploadData({ ...uploadData, phoneCol: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-semibold"
                      >
                        {rawFileHeaders.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        First / Full Name Column
                      </label>
                      <select
                        value={uploadData.firstNameCol}
                        onChange={e => setUploadData({ ...uploadData, firstNameCol: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs"
                      >
                        {rawFileHeaders.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Last Name Column
                      </label>
                      <select
                        value={uploadData.lastNameCol}
                        onChange={e => setUploadData({ ...uploadData, lastNameCol: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs"
                      >
                        <option value="">-- None / Blank --</option>
                        {rawFileHeaders.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Email Address Column
                      </label>
                      <select
                        value={uploadData.emailCol}
                        onChange={e => setUploadData({ ...uploadData, emailCol: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs"
                      >
                        <option value="">-- None / Blank --</option>
                        {rawFileHeaders.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    {/* Assigned Agent Column for Preview Dialing */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Assigned Agent Column <span className="text-indigo-600 font-semibold">(Key for Preview Mode)</span>
                      </label>
                      <select
                        value={uploadData.assignedAgentCol}
                        onChange={e => setUploadData({ ...uploadData, assignedAgentCol: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-medium text-indigo-900 bg-indigo-50/40"
                      >
                        <option value="">-- Auto Assign via System --</option>
                        {rawFileHeaders.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Industry / Process Column
                      </label>
                      <select
                        value={uploadData.industryCol}
                        onChange={e => setUploadData({ ...uploadData, industryCol: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs"
                      >
                        <option value="">-- Default (IT & Telecom) --</option>
                        {rawFileHeaders.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        City / Location Column
                      </label>
                      <select
                        value={uploadData.cityCol}
                        onChange={e => setUploadData({ ...uploadData, cityCol: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs"
                      >
                        <option value="">-- None --</option>
                        {rawFileHeaders.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Notes / Comments Column
                      </label>
                      <select
                        value={uploadData.notesCol}
                        onChange={e => setUploadData({ ...uploadData, notesCol: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs"
                      >
                        <option value="">-- None --</option>
                        {rawFileHeaders.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Distribution & Agent Assignment Strategy */}
              {wizardStep === 3 && (
                <div className="space-y-3">
                  <div className="border-b border-slate-200 pb-2">
                    <h4 className="font-bold text-slate-800 text-sm">Step 3: Lead Distribution & Dial Routing Strategy</h4>
                    <p className="text-slate-500 text-[11px]">
                      Configure how incoming records are allocated to agents or the campaign auto-dialing hopper.
                    </p>
                  </div>

                  <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Assignment Fallback Strategy</label>
                      <select
                        value={uploadData.autoAssign}
                        onChange={e => setUploadData({ ...uploadData, autoAssign: e.target.value as any })}
                        className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
                      >
                        <option value="Yes">Map to 'Assigned Agent' column; Round-Robin any blank rows</option>
                        <option value="No">Leave unassigned in Campaign Queue / Predictive Hopper</option>
                      </select>
                    </div>

                    {isPreviewMode ? (
                      <div className="bg-sky-50 border border-sky-200 p-3 rounded text-[11px] text-sky-900 space-y-1">
                        <span className="font-bold block">Preview Campaign Workflow:</span>
                        <p>
                          1. Each row with an assigned agent (e.g. <code>somnathlead_agent01</code>) will appear in that agent's queue.
                        </p>
                        <p>
                          2. Agent previews contact details (phone, history, notes) before dialing.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded text-[11px] text-amber-900 space-y-1">
                        <span className="font-bold block">Predictive Campaign Workflow:</span>
                        <p>
                          1. All uploaded numbers immediately transition to <strong>Queued</strong> status in the Hopper.
                        </p>
                        <p>
                          2. Softphone dial engine concurrently places calls using the campaign's configured DID Rotate Strategy.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 4: Deduplication & DNC Compliance */}
              {wizardStep === 4 && (
                <div className="space-y-3">
                  <div className="border-b border-slate-200 pb-2">
                    <h4 className="font-bold text-slate-800 text-sm">Step 4: Deduplication & TCPA Compliance</h4>
                    <p className="text-slate-500 text-[11px]">
                      Filter duplicate phone numbers and enforce compliance scrubbers.
                    </p>
                  </div>

                  <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={uploadData.duplicateCheck === 'Yes'}
                        onChange={e => setUploadData({ ...uploadData, duplicateCheck: e.target.checked ? 'Yes' : 'No' })}
                        className="rounded text-sky-600 w-4 h-4"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">Skip duplicate phone numbers in this list / database</span>
                        <span className="text-[11px] text-slate-500">Prevents multiple dials to the same customer within active campaign cycle.</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded text-sky-600 w-4 h-4"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">Auto-clean phone number format (E.164 sanitization)</span>
                        <span className="text-[11px] text-slate-500">Strips special characters, spaces, and ensures clean digit strings for telephony gateways.</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 5: Validation & Hopper Injection Preview */}
              {wizardStep === 5 && (
                <div className="space-y-3">
                  <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Step 5: File Validation & Lead Records Preview</h4>
                      <p className="text-slate-500 text-[11px]">
                        Review the mapped leads before synchronizing to campaign database.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px]">
                      {parsedRows.length} Valid Records Ready
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                        <tr>
                          <th className="py-2 px-2.5 border-r border-slate-200">#</th>
                          <th className="py-2 px-2.5 border-r border-slate-200">Phone Number</th>
                          <th className="py-2 px-2.5 border-r border-slate-200">Customer Name</th>
                          <th className="py-2 px-2.5 border-r border-slate-200">Assigned Agent</th>
                          <th className="py-2 px-2.5 border-r border-slate-200">Industry</th>
                          <th className="py-2 px-2.5">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-2.5 border-r border-slate-100 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-1.5 px-2.5 border-r border-slate-100 font-mono font-bold text-sky-700">{row.phone}</td>
                            <td className="py-1.5 px-2.5 border-r border-slate-100 font-medium">{row.firstName} {row.lastName}</td>
                            <td className="py-1.5 px-2.5 border-r border-slate-100">
                              {row.assignedAgent ? (
                                <span className="text-indigo-700 font-semibold">{row.assignedAgent}</span>
                              ) : (
                                <span className="text-slate-400 italic">Auto-Assigned</span>
                              )}
                            </td>
                            <td className="py-1.5 px-2.5 border-r border-slate-100 text-slate-600">{row.industry || 'IT & Telecom'}</td>
                            <td className="py-1.5 px-2.5 text-slate-500 truncate max-w-[150px]">{row.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* STEP 6: Synchronize & Final Execution */}
              {wizardStep === 6 && (
                <div className="space-y-4 text-center py-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <Database className="w-8 h-8 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-base">Ready to Synchronize Batch Leads!</h4>
                    <p className="text-slate-500 text-xs max-w-md mx-auto mt-1">
                      {parsedRows.length} records will be imported into <strong>List #{uploadData.listId}</strong> for campaign <strong>{currentTargetList?.campaign_name || 'Sales'}</strong>.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-w-md mx-auto text-left text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Campaign Dial Mode:</span>
                      <span className="font-bold text-slate-800">{currentTargetCampaign?.type || (isPredictiveMode ? 'PREDICTIVE' : 'PREVIEW')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Assigned Agent Mapping:</span>
                      <span className="font-bold text-indigo-700">{uploadData.assignedAgentCol ? `Column '${uploadData.assignedAgentCol}'` : 'Auto Round-Robin'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Duplicate Check:</span>
                      <span className="font-bold text-slate-800">{uploadData.duplicateCheck === 'Yes' ? 'Enabled (Skip duplicates)' : 'Disabled'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Hopper Auto-Dial:</span>
                      <span className="font-bold text-emerald-700">{isPredictiveMode ? 'Enabled (Auto-start dialing)' : 'Manual Preview by Agent'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Wizard Footer Navigation */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep(wizardStep - 1)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium text-xs cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {wizardStep < 6 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep(wizardStep + 1)}
                  className="flex items-center gap-1 px-4 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded font-bold text-xs shadow-xs cursor-pointer"
                >
                  Next Step
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={handleCompleteUploadWizard}
                  className="flex items-center gap-1 px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Syncing to Hopper...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Execute Batch Import ({parsedRows.length} Leads)
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Single Lead Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-3.5 bg-[#0284c7] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Create New Lead Record</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.firstName}
                    onChange={e => setNewLeadForm({ ...newLeadForm, firstName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newLeadForm.lastName}
                    onChange={e => setNewLeadForm({ ...newLeadForm, lastName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 918073236368"
                  value={newLeadForm.phone}
                  onChange={e => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Campaign</label>
                  <select
                    value={newLeadForm.campaign}
                    onChange={e => setNewLeadForm({ ...newLeadForm, campaign: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  >
                    {campaigns.map(c => (
                      <option key={c.id} value={c.name}>{c.name} ({c.type})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target List ID</label>
                  <select
                    value={newLeadForm.list_id}
                    onChange={e => setNewLeadForm({ ...newLeadForm, list_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  >
                    {campaignLists.map(l => (
                      <option key={l.list_id} value={l.list_id}>List #{l.list_id} ({l.list_name})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assigned Agent (Optional for Preview)</label>
                <input
                  type="text"
                  placeholder="e.g. somnathlead_agent01"
                  value={newLeadForm.assignedAgent}
                  onChange={e => setNewLeadForm({ ...newLeadForm, assignedAgent: e.target.value })}
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
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
