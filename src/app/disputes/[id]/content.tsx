'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { addEvidence, updateDisputeStatus, submitDispute } from '../actions';
import { 
  FilePlus, 
  CheckCircle, 
  Send, 
  AlertCircle, 
  Paperclip, 
  Plus,
  FileText
} from 'lucide-react';

export default function DisputeDetailContent({ 
  dispute, 
  evidenceList, 
  order 
}: { 
  dispute: any, 
  evidenceList: any[], 
  order: any 
}) {
  const [isAddingEvidence, setIsAddingEvidence] = useState(false);
  const [evidenceData, setEvidenceData] = useState({ title: '', content: '', type: 'OTHER' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    await addEvidence(dispute.id, evidenceData);
    setEvidenceData({ title: '', content: '', type: 'OTHER' });
    setIsAddingEvidence(false);
  };

  const handleApproval = async () => {
    await updateDisputeStatus(dispute.id, 'PENDING_APPROVAL');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await submitDispute(dispute.id);
    setIsSubmitting(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Evidence Profile</h2>
            <Badge variant={
              dispute.status === 'WON' ? 'success' :
              dispute.status === 'LOST' ? 'danger' :
              dispute.status === 'PENDING_APPROVAL' ? 'warning' :
              'default'
            }>
              {dispute.status.replace('_', ' ')}
            </Badge>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 font-medium uppercase">Reason</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">{dispute.reason}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 font-medium uppercase">Processor</p>
                <p className="text-sm font-semibold text-slate-900 mt-1 capitalize">{dispute.processor}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-slate-400" />
                  Collected Evidence
                </h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => setIsAddingEvidence(true)}
                >
                  <Plus className="w-3 h-3" /> Add Evidence
                </Button>
              </div>

              <div className="space-y-3">
                {evidenceList.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                    <FilePlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No evidence collected yet.</p>
                  </div>
                ) : (
                  evidenceList.map((ev) => (
                    <div key={ev.id} className="p-4 border border-slate-200 rounded-lg flex items-start justify-between hover:border-indigo-300 transition-colors">
                      <div className="flex gap-3">
                        <div className="p-2 bg-slate-100 rounded text-slate-600">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{ev.title}</p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{ev.content}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] h-5">
                        {ev.isAutoCollected ? 'Auto-Collected' : 'Manual'}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {isAddingEvidence && (
          <div className="bg-white border border-indigo-200 rounded-xl shadow-sm p-6 animate-in fade-in slide-in-from-top-4 duration-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Add New Evidence</h3>
            <form onSubmit={handleAddEvidence} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500">Title</label>
                  <input 
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={evidenceData.title}
                    onChange={e => setEvidenceData({ ...evidenceData, title: e.target.value })}
                    placeholder="e.g. Delivery Confirmation"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500">Type</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={evidenceData.type}
                    onChange={e => setEvidenceData({ ...evidenceData, type: e.target.value })}
                  >
                    <option value="ORDER_DETAILS">Order Details</option>
                    <option value="SHIPPING_PROOF">Shipping Proof</option>
                    <option value="CUSTOMER_COMMUNICATION">Customer Communication</option>
                    <option value="TOS_AGREEMENT">TOS Agreement</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">Content/Link</label>
                <textarea 
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  value={evidenceData.content}
                  onChange={e => setEvidenceData({ ...evidenceData, content: e.target.value })}
                  placeholder="Paste evidence text or link to document..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" size="sm" onClick={() => setIsAddingEvidence(false)}>Cancel</Button>
                <Button variant="primary" size="sm" type="submit">Save Evidence</Button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="space-y-8">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-6">Case Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Amount</span>
              <span className="font-semibold text-slate-900">${Number(dispute.amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Deadline</span>
              <span className="font-semibold text-slate-900">{new Date(dispute.deadline).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Customer</span>
              <span className="font-semibold text-slate-900">{order.customerId}</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
            {dispute.status === 'OPEN' || dispute.status === 'EVIDENCE_COLLECTING' ? (
              <Button 
                className="w-full flex items-center justify-center gap-2" 
                onClick={handleApproval}
              >
                <CheckCircle className="w-4 h-4" />
                Mark Ready for Approval
              </Button>
            ) : dispute.status === 'PENDING_APPROVAL' ? (
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg flex gap-3 items-start">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <p className="text-xs text-yellow-800">
                    This case has been marked as ready. Please review the evidence before submitting to the processor.
                  </p>
                </div>
                <Button 
                  className="w-full flex items-center justify-center gap-2" 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Submitting...' : 'Submit Evidence Package'}
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <p className="text-sm font-medium text-slate-600">
                  Case is {dispute.status.replace('_', ' ')}. No further actions required.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
