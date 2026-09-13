import React from 'react';
import {
  Plus,
  Search,
  FileQuestion,
  Edit2,
  Trash2,
  Eye,
  Download,
  CheckCircle,
  X,
  ListPlus,
  Layers,
  ChevronRight
} from 'lucide-react';
import { SurveyForm, SurveyQuestion, SurveyResponse, Tenant } from '../types/index.js';

interface SurveysPageProps {
  activeTenant: Tenant;
}

export const SurveysPage: React.FC<SurveysPageProps> = ({ activeTenant }) => {
  const [surveys, setSurveys] = React.useState<SurveyForm[]>([]);
  const [responses, setResponses] = React.useState<SurveyResponse[]>([]);
  const [activeTab, setActiveTab] = React.useState<'surveys' | 'responses'>('surveys');
  const [searchTerm, setSearchTerm] = React.useState('');

  // Builder modal
  const [isBuilderOpen, setIsBuilderOpen] = React.useState(false);
  const [previewSurvey, setPreviewSurvey] = React.useState<SurveyForm | null>(null);

  const [newSurvey, setNewSurvey] = React.useState<{
    title: string;
    description: string;
    campaignId: string;
    questions: SurveyQuestion[];
  }>({
    title: '',
    description: '',
    campaignId: 'c-1',
    questions: [
      {
        id: 'q1',
        type: 'Radio',
        title: 'Is the customer interested in Dialko Enterprise setup?',
        required: true,
        options: ['Yes - Immediate Onboarding', 'Follow Up Required', 'Not Interested']
      },
      {
        id: 'q2',
        type: 'Text',
        title: 'What is their estimated agent seat count?',
        required: true
      },
      {
        id: 'q3',
        type: 'Text',
        title: 'Key Notes and custom CRM integration requirements:',
        required: false
      }
    ]
  });

  const fetchData = async () => {
    try {
      const [survRes, respRes] = await Promise.all([
        fetch(`/api/surveys?tenantId=${activeTenant.id}`),
        fetch(`/api/surveys/responses?tenantId=${activeTenant.id}`)
      ]);
      setSurveys(await survRes.json());
      setResponses(await respRes.json());
    } catch (err) {
      console.error('Failed to load surveys', err);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [activeTenant.id]);

  const handleAddQuestion = () => {
    const newQ: SurveyQuestion = {
      id: `q_${Date.now()}`,
      type: 'Text',
      title: 'New Question Prompt',
      required: false
    };
    setNewSurvey({
      ...newSurvey,
      questions: [...newSurvey.questions, newQ]
    });
  };

  const handleRemoveQuestion = (idx: number) => {
    const updated = [...newSurvey.questions];
    updated.splice(idx, 1);
    setNewSurvey({ ...newSurvey, questions: updated });
  };

  const handleSaveSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': activeTenant.id },
        body: JSON.stringify({
          ...newSurvey,
          status: 'Active'
        })
      });
      setIsBuilderOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save survey', err);
    }
  };

  const handleDeleteSurvey = async (id: string) => {
    try {
      await fetch(`/api/surveys/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to delete survey', err);
    }
  };

  const handleExportResponses = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      ["Date,Survey,Customer Phone,Agent,Answers"].join(",") + "\n" +
      responses.map(r => `${r.submittedAt},${r.surveyTitle},${r.customerPhone},${r.agentId},"${JSON.stringify(r.answers).replace(/"/g, '""')}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dialko_survey_responses_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div id="surveys-page-container" className="p-4 space-y-3 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            SU
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Notes & Survey Forms</h2>
            <span className="text-[11px] text-slate-500">Custom in-call question forms, lead qualification scripts, and disposition surveys</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="bg-slate-100 p-1 rounded-md flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('surveys')}
              className={`px-3 py-1 rounded font-semibold cursor-pointer ${
                activeTab === 'surveys' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Survey Forms ({surveys.length})
            </button>
            <button
              onClick={() => setActiveTab('responses')}
              className={`px-3 py-1 rounded font-semibold cursor-pointer ${
                activeTab === 'responses' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Responses ({responses.length})
            </button>
          </div>

          {activeTab === 'surveys' ? (
            <button
              onClick={() => setIsBuilderOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Survey
            </button>
          ) : (
            <button
              onClick={handleExportResponses}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Responses
            </button>
          )}
        </div>
      </div>

      {activeTab === 'surveys' ? (
        /* Surveys List */
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3.5 border-r border-slate-200">Survey Title</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Description</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Assigned Campaigns</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 text-center">Questions</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200 text-center">Status</th>
                <th className="py-2.5 px-3.5 text-center">Action / Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {surveys.map(survey => (
                <tr key={survey.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3.5 border-r border-slate-100 font-bold text-slate-800">{survey.title}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-600">{survey.description}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 text-sky-700 font-medium">
                    {survey.campaignIds?.join(', ') || 'All Campaigns'}
                  </td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 text-center font-mono font-bold">{survey.questions?.length || 0}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-emerald-700 bg-emerald-50">
                      {survey.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setPreviewSurvey(survey)}
                        className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </button>
                      <button
                        onClick={() => handleDeleteSurvey(survey.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                        title="Delete Survey"
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
      ) : (
        /* Responses List */
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3.5 border-r border-slate-200">Submitted At</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Survey Title</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Customer Phone</th>
                <th className="py-2.5 px-3.5 border-r border-slate-200">Agent</th>
                <th className="py-2.5 px-3.5">Collected Answers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {responses.map(resp => (
                <tr key={resp.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3.5 border-r border-slate-100 text-slate-600">{resp.submittedAt}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 font-sans font-bold text-slate-800">{resp.surveyTitle}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 text-sky-700 font-bold">{resp.customerPhone}</td>
                  <td className="py-2.5 px-3.5 border-r border-slate-100 font-sans text-slate-700">{resp.agentId}</td>
                  <td className="py-2.5 px-3.5 font-sans text-slate-700 text-xs">
                    <div className="space-y-1">
                      {Object.entries(resp.answers || {}).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-2">
                          <span className="font-semibold text-slate-500">{k}:</span>
                          <span className="text-slate-800">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Survey Builder Modal */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-3.5 bg-[#0284c7] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Create In-Call Survey / Notes Form</h3>
              <button onClick={() => setIsBuilderOpen(false)} className="p-1 hover:bg-white/20 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSurvey} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs custom-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Form Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sales Qualification Survey"
                    value={newSurvey.title}
                    onChange={e => setNewSurvey({ ...newSurvey, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assigned Campaign</label>
                  <select
                    value={newSurvey.campaignId}
                    onChange={e => setNewSurvey({ ...newSurvey, campaignId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                  >
                    <option value="RIYA001">RIYA001</option>
                    <option value="MAHI002">MAHI002</option>
                    <option value="NISHA 005">NISHA 005</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Instructions for agents during customer qualification"
                  value={newSurvey.description}
                  onChange={e => setNewSurvey({ ...newSurvey, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2"
                />
              </div>

              {/* Questions List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">Form Questions ({newSurvey.questions.length})</span>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Question
                  </button>
                </div>

                {newSurvey.questions.map((q, idx) => (
                  <div key={q.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-500">Q{idx + 1}.</span>
                      <input
                        type="text"
                        required
                        value={q.title}
                        onChange={e => {
                          const updated = [...newSurvey.questions];
                          updated[idx].title = e.target.value;
                          setNewSurvey({ ...newSurvey, questions: updated });
                        }}
                        className="flex-1 bg-white border border-slate-300 rounded p-1.5"
                      />
                      <select
                        value={q.type}
                        onChange={e => {
                          const updated = [...newSurvey.questions];
                          updated[idx].type = e.target.value as any;
                          setNewSurvey({ ...newSurvey, questions: updated });
                        }}
                        className="bg-white border border-slate-300 rounded p-1.5"
                      >
                        <option value="Text">Short Text</option>
                        <option value="Dropdown">Dropdown</option>
                        <option value="Radio">Radio Buttons</option>
                        <option value="Checkbox">Checkbox</option>
                        <option value="Rating">Rating (1-5)</option>
                        <option value="Date">Date Picker</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {(q.type === 'Radio' || q.type === 'Dropdown' || q.type === 'Checkbox') && (
                      <div className="pl-6 pt-1">
                        <label className="block text-[11px] text-slate-500 font-semibold mb-1">
                          Options (comma separated)
                        </label>
                        <input
                          type="text"
                          value={q.options?.join(', ') || ''}
                          onChange={e => {
                            const updated = [...newSurvey.questions];
                            updated[idx].options = e.target.value.split(',').map(s => s.trim());
                            setNewSurvey({ ...newSurvey, questions: updated });
                          }}
                          placeholder="Option 1, Option 2, Option 3"
                          className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded font-bold shadow-xs"
                >
                  Save Survey Form
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Survey Modal */}
      {previewSurvey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">{previewSurvey.title}</h3>
                <span className="text-[11px] text-slate-400">Preview Form Layout</span>
              </div>
              <button onClick={() => setPreviewSurvey(null)} className="p-1 hover:bg-white/20 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 italic">{previewSurvey.description}</p>
              {previewSurvey.questions?.map((q, idx) => (
                <div key={idx} className="space-y-1.5 pb-2 border-b border-slate-100">
                  <label className="block font-bold text-slate-800">
                    {idx + 1}. {q.title} {q.required && <span className="text-rose-500">*</span>}
                  </label>
                  {q.type === 'Text' && (
                    <input type="text" placeholder="Type answer..." className="w-full bg-slate-50 border border-slate-300 rounded p-2" />
                  )}
                  {q.type === 'Radio' && (
                    <div className="space-y-1 pl-1">
                      {q.options?.map(opt => (
                        <label key={opt} className="flex items-center gap-2 text-slate-700">
                          <input type="radio" name={`prev_${idx}`} />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setPreviewSurvey(null)}
                  className="px-4 py-2 bg-slate-800 text-white font-bold rounded"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
