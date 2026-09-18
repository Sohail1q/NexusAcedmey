import React, { useState } from 'react';
import { Coins, X, Check } from 'lucide-react';
import { NexusStudent, ReceiptData } from '../types';

interface AddFeeModalProps {
  student: NexusStudent | null;
  currency?: string;
  onClose: () => void;
  onSubmitFee: (student: NexusStudent, receiptData: ReceiptData) => void;
}

export const AddFeeModal: React.FC<AddFeeModalProps> = ({
  student,
  currency = 'PKR',
  onClose,
  onSubmitFee,
}) => {
  if (!student) return null;

  const [payAmount, setPayAmount] = useState<number>(0);

  const oldDues = student.dues || 0;
  const newDues = Math.max(0, oldDues - (payAmount || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;

    const updatedStudent: NexusStudent = {
      ...student,
      dues: newDues,
      totalPaid: (student.totalPaid || 0) + payAmount,
    };

    const receipt: ReceiptData = {
      receiptNo: 'REC-' + Math.floor(100000 + Math.random() * 900000),
      date: new Date().toISOString().split('T')[0],
      studentId: student.id,
      studentName: student.name,
      fatherName: student.fatherName || '',
      className: student.className || 'General Tuition',
      monthlyFee: student.monthlyFee || 0,
      admissionFee: 0,
      prevDues: oldDues,
      paidAmount: payAmount,
      remainingDues: newDues,
    };

    onSubmitFee(updatedStudent, receipt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-600" /> Submit Dues / Add Fee Amount
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Student Name
            </label>
            <input
              type="text"
              readOnly
              value={`${student.name} (${student.id})`}
              className="w-full h-10 px-3 bg-slate-100 border border-slate-300 rounded-md text-sm font-semibold text-slate-700"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Current Outstanding Dues
            </label>
            <input
              type="text"
              readOnly
              value={`${currency} ${oldDues.toLocaleString()}`}
              className="w-full h-10 px-3 bg-red-50 border border-red-200 rounded-md text-sm font-bold text-red-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Amount to Submit / Add ({currency}) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={oldDues > 0 ? oldDues * 2 : 100000}
              value={payAmount || ''}
              onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
              placeholder="Enter fee amount paid"
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm font-bold text-emerald-700 outline-none focus:border-blue-600"
              required
              autoFocus
            />
          </div>

          {payAmount > 0 && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs flex justify-between">
              <span className="text-slate-500">Updated Remaining Dues:</span>
              <strong className={newDues > 0 ? 'text-red-600' : 'text-emerald-600'}>
                {currency} {newDues.toLocaleString()}
              </strong>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <Check className="w-4 h-4" /> Submit &amp; Generate Receipt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
