import React, { useState } from 'react';
import { BadgeCheck, CloudDownload, CheckCircle, AlertCircle } from 'lucide-react';
import { NexusStudent, NexusClass, ReceiptData } from '../types';

interface AdmissionViewProps {
  students: NexusStudent[];
  classes: NexusClass[];
  currency?: string;
  onAdmitStudent?: (updatedStudent: NexusStudent, receiptData: ReceiptData) => void;
  onSaveAdmission?: (updatedStudent: NexusStudent, receiptData: ReceiptData) => void;
  onNotification: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdmissionView: React.FC<AdmissionViewProps> = ({
  students,
  classes,
  currency = 'PKR',
  onAdmitStudent,
  onSaveAdmission,
  onNotification,
}) => {
  const [fetchId, setFetchId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<NexusStudent | null>(null);

  // Form fields
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [selectedClassStr, setSelectedClassStr] = useState('');
  const [admissionDate, setAdmissionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [monthlyFee, setMonthlyFee] = useState<number>(0);
  const [admissionFee, setAdmissionFee] = useState<number>(0);
  const [prevDues, setPrevDues] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // Fetch Student Data by ID
  const handleFetch = () => {
    const trimmed = fetchId.trim();
    if (!trimmed) {
      onNotification('Please enter a Student ID number to fetch.', 'error');
      return;
    }

    const found = students.find(
      (s) => s.id.toLowerCase() === trimmed.toLowerCase()
    );

    if (!found) {
      onNotification(
        `Student ID "${trimmed}" not found in registered records. Please register the student first in the Registration tab.`,
        'error'
      );
      return;
    }

    setSelectedStudent(found);
    setStudentId(found.id);
    setStudentName(found.name || '');
    setFatherName(found.fatherName || found.guardianName || '');
    setPrevDues(found.dues || 0);

    // If student already has a class assigned, try to match it
    if (found.className) {
      setSelectedClassStr(found.className);
      const matchedCls = classes.find(
        (c) =>
          `${c.teacher} | ${c.category} - ${c.className} (${c.startTime} to ${c.endTime})` ===
          found.className
      );
      if (matchedCls) {
        setMonthlyFee(matchedCls.monthlyFee || 0);
        setAdmissionFee(matchedCls.admissionFee || 0);
      }
    } else {
      setSelectedClassStr('');
      setMonthlyFee(0);
      setAdmissionFee(0);
    }

    onNotification(`Found records for ${found.name}. Select a class option to proceed with admission.`, 'success');
  };

  // When class option changes, automatically load fees
  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classStr = e.target.value;
    setSelectedClassStr(classStr);

    if (!classStr) {
      setMonthlyFee(0);
      setAdmissionFee(0);
      return;
    }

    const matchedCls = classes.find(
      (c) =>
        `${c.teacher} | ${c.category} - ${c.className} (${c.startTime} to ${c.endTime})` ===
        classStr
    );

    if (matchedCls) {
      setMonthlyFee(matchedCls.monthlyFee || 0);
      setAdmissionFee(matchedCls.admissionFee || 0);
    }
  };

  const totalRequired = monthlyFee + admissionFee + prevDues;
  const remainingDues = Math.max(0, totalRequired - (paidAmount || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId) {
      onNotification('Please fetch a registered student first.', 'error');
      return;
    }

    const studentToUpdate = selectedStudent || students.find((s) => s.id === studentId);
    if (!studentToUpdate) {
      onNotification('Student record not found.', 'error');
      return;
    }

    if (!selectedClassStr) {
      onNotification('Please select a class option before completing admission.', 'error');
      return;
    }

    if (paidAmount < 0) {
      onNotification('Paid amount cannot be negative.', 'error');
      return;
    }

    const updatedStudent: NexusStudent = {
      ...studentToUpdate,
      name: studentName,
      fatherName: fatherName,
      className: selectedClassStr,
      monthlyFee: monthlyFee,
      admissionFee: admissionFee,
      dues: remainingDues,
      totalPaid: (studentToUpdate.totalPaid || 0) + paidAmount,
      lastAdmissionDate: admissionDate,
    };

    const receipt: ReceiptData = {
      receiptNo: 'REC-' + Math.floor(100000 + Math.random() * 900000),
      date: admissionDate,
      studentId: studentId,
      studentName: studentName,
      fatherName: fatherName,
      className: selectedClassStr,
      monthlyFee: monthlyFee,
      admissionFee: admissionFee,
      prevDues: prevDues,
      paidAmount: paidAmount,
      remainingDues: remainingDues,
    };

    const admitAction = onAdmitStudent || onSaveAdmission;
    if (typeof admitAction === 'function') {
      admitAction(updatedStudent, receipt);
    }

    // Reset form
    setFetchId('');
    setSelectedStudent(null);
    setStudentId('');
    setStudentName('');
    setFatherName('');
    setSelectedClassStr('');
    setMonthlyFee(0);
    setAdmissionFee(0);
    setPrevDues(0);
    setPaidAmount(0);

    onNotification('Student admission recorded and fee receipt generated!', 'success');
  };

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <BadgeCheck className="w-5 h-5 text-blue-600" /> Student Admission &amp; Fee Entry
        </h3>
      </div>

      {/* Fetch Bar */}
      <div className="bg-slate-100 p-3.5 rounded-lg mb-6 flex items-center gap-3 flex-wrap">
        <input
          type="text"
          value={fetchId}
          onChange={(e) => setFetchId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
          placeholder="Type Student ID Number to Fetch Data (e.g. NEX-1001)..."
          className="h-10 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 flex-1 min-w-[240px]"
        />
        <button
          type="button"
          onClick={handleFetch}
          className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-md inline-flex items-center gap-2 transition cursor-pointer"
        >
          <CloudDownload className="w-4 h-4" /> Fetch Data
        </button>
        <span className="text-xs text-slate-500 w-full sm:w-auto">
          Register student first. Then fetch Student ID, choose class, and enter payment.
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Student ID */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Student ID Number
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Auto-filled on fetch"
              className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-md text-sm outline-none focus:border-blue-600"
              required
            />
          </div>

          {/* Student Name */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Student Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Full Name"
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-blue-600"
              required
            />
          </div>

          {/* Father / Guardian Name */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Father Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fatherName}
              onChange={(e) => setFatherName(e.target.value)}
              placeholder="Father / Guardian Name"
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-blue-600"
              required
            />
          </div>

          {/* Select Class Option */}
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Select Class Option <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedClassStr}
              onChange={handleClassChange}
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-blue-600"
              required
            >
              <option value="">-- Select Class Option --</option>
              {classes.map((cls, idx) => {
                const displayStr = `${cls.teacher} | ${cls.category} - ${cls.className} (${cls.startTime} to ${cls.endTime})`;
                return (
                  <option key={idx} value={displayStr}>
                    {displayStr}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Admission Date */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Admission Date
            </label>
            <input
              type="date"
              value={admissionDate}
              onChange={(e) => setAdmissionDate(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-blue-600"
              required
            />
          </div>

          {/* Current Class Fee */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Current Class Fee ({currency})
            </label>
            <input
              type="number"
              value={monthlyFee || ''}
              readOnly
              className="w-full h-10 px-3 bg-slate-100 border border-slate-300 rounded-md text-sm text-slate-700 font-semibold"
            />
          </div>

          {/* Admission Fee */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Admission Fee ({currency})
            </label>
            <input
              type="number"
              value={admissionFee}
              readOnly
              className="w-full h-10 px-3 bg-slate-100 border border-slate-300 rounded-md text-sm text-slate-700 font-semibold"
            />
          </div>

          {/* Previous Dues */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Previous Dues in Current Class ({currency})
            </label>
            <input
              type="number"
              value={prevDues}
              onChange={(e) => setPrevDues(parseFloat(e.target.value) || 0)}
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-blue-600"
            />
          </div>

          {/* Paid Amount */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Paid Amount ({currency}) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              value={paidAmount}
              onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm font-semibold text-emerald-700 outline-none focus:border-blue-600"
              required
            />
          </div>

          {/* Calculated Remaining Dues preview */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col justify-center">
            <span className="text-xs font-medium text-slate-500">Calculated Remaining Dues</span>
            <span className="text-lg font-bold text-red-600">
              {currency} {remainingDues.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-md inline-flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" /> Admit the Student &amp; Generate Fee Receipt
          </button>
        </div>
      </form>
    </div>
  );
};
