import React, { useState, useRef } from 'react';
import {
  Users,
  Search,
  Receipt,
  Pencil,
  Trash2,
  FileSpreadsheet,
  Eye,
  X,
  Copy,
  Check,
  ExternalLink,
  Camera,
  Upload,
} from 'lucide-react';
import { NexusStudent } from '../types';
import { exportToExcelXls } from '../services/cloudSync';
import { compressImage } from '../utils/imageOptimizer';

interface DirectoryViewProps {
  students: NexusStudent[];
  currency?: string;
  onOpenReceipt: (student: NexusStudent) => void;
  onOpenEditModal: (student: NexusStudent) => void;
  onDeleteStudent: (studentId: string) => void;
  onUpdateStudent?: (student: NexusStudent) => void;
  onNotification: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  students,
  currency = 'PKR',
  onOpenReceipt,
  onOpenEditModal,
  onDeleteStudent,
  onUpdateStudent,
  onNotification,
}) => {
  const [query, setQuery] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; name: string; id: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const modalFileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoFileChange = async (student: NexusStudent, file: File) => {
    try {
      const compressed = await compressImage(file, 240, 240, 0.8);
      if (onUpdateStudent) {
        onUpdateStudent({
          ...student,
          photo: compressed,
        });
        if (previewPhoto && previewPhoto.id === student.id) {
          setPreviewPhoto({ ...previewPhoto, url: compressed });
        }
        onNotification(`Photo updated for ${student.name}!`, 'success');
      }
    } catch {
      onNotification('Could not process selected image', 'error');
    }
  };

  const handleRemovePhoto = (student: NexusStudent) => {
    if (onUpdateStudent) {
      onUpdateStudent({
        ...student,
        photo: '',
      });
      if (previewPhoto && previewPhoto.id === student.id) {
        setPreviewPhoto({ ...previewPhoto, url: '' });
      }
      onNotification(`Photo removed for ${student.name} (now square blank)`, 'info');
    }
  };

  const filtered = students.filter((s) => {
    const q = query.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      (s.fatherName && s.fatherName.toLowerCase().includes(q)) ||
      (s.className && s.className.toLowerCase().includes(q)) ||
      (s.guardianNumber && s.guardianNumber.includes(q)) ||
      (s.studentNumber && s.studentNumber.includes(q))
    );
  });

  const getFullPhotoUrl = (photoPath?: string) => {
    if (!photoPath) return '';
    if (photoPath.startsWith('http')) return photoPath;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
  };

  const handleExportDirectory = () => {
    if (filtered.length === 0) {
      onNotification('No students to export in directory.', 'info');
      return;
    }

    const columns = [
      { header: 'Student ID', width: 90 },
      { header: 'Photo Link', width: 110 },
      { header: 'Student Name', width: 130 },
      { header: 'Father Name', width: 130 },
      { header: 'Class Option', width: 180 },
      { header: `Monthly Fee (${currency})`, width: 110 },
      { header: `Total Dues (${currency})`, width: 110 },
      { header: 'Guardian Phone', width: 120 },
      { header: 'Student Phone', width: 120 },
      { header: 'Email', width: 150 },
    ];

    const rows = filtered.map((s) => {
      const fullPhoto = getFullPhotoUrl(s.photo);
      return [
        { text: s.id },
        {
          text: fullPhoto ? 'View Online Photo' : 'No Photo',
          isLink: !!fullPhoto,
          linkUrl: fullPhoto,
        },
        { text: s.name },
        { text: s.fatherName || s.guardianName || '' },
        { text: s.className || 'Unassigned' },
        { text: `${s.monthlyFee || 0}` },
        { text: `${s.dues || 0}` },
        { text: s.guardianNumber || '' },
        { text: s.studentNumber || '' },
        { text: s.gmail || '' },
      ];
    });

    exportToExcelXls({
      sheetName: 'Student_Directory',
      title: 'Nexus Academy — Complete Enrolled Students Directory',
      subtitle: `Total Records: ${filtered.length} | Export Date: ${new Date().toLocaleDateString()}`,
      columns,
      rows,
      filename: `Nexus_Students_Directory_${Date.now()}.xls`,
    });

    onNotification(`Exported ${filtered.length} student records to Excel (.xls)!`, 'success');
  };

  const copyPhotoLink = (url: string) => {
    const full = getFullPhotoUrl(url);
    navigator.clipboard.writeText(full);
    setCopiedLink(true);
    onNotification('Online photo link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" /> All Enrolled Students Directory
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Showing {filtered.length} of {students.length} student(s)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportDirectory}
            className="h-9 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            title="Download directory with online photo links to Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" /> Export Directory (.xls)
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search directory by name, ID, class, phone..."
            className="w-full h-10 pl-9 pr-3 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* Directory Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
              <th className="py-2.5 px-3">ID #</th>
              <th className="py-2.5 px-3">Photo</th>
              <th className="py-2.5 px-3">Student Name</th>
              <th className="py-2.5 px-3">Father Name</th>
              <th className="py-2.5 px-3">Assigned Class Option</th>
              <th className="py-2.5 px-3">Monthly Fee</th>
              <th className="py-2.5 px-3">Total Dues</th>
              <th className="py-2.5 px-3">Receipt</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  No enrolled student records found matching "{query}".
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-semibold text-blue-600">{s.id}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <div
                        onClick={() => setPreviewPhoto({ url: s.photo || '', name: s.name, id: s.id })}
                        className="cursor-pointer group relative inline-block shrink-0"
                        title="Click to view full photo & options"
                      >
                        {s.photo && !s.photo.includes('svg') ? (
                          <img
                            src={s.photo}
                            alt={s.name}
                            className="w-10 h-10 rounded-md object-cover border border-slate-300 group-hover:ring-2 group-hover:ring-blue-500 transition shadow-2xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-white border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 group-hover:border-blue-500 transition shadow-2xs">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Blank</span>
                          </div>
                        )}
                      </div>

                      {/* Hidden file input to change picture directly */}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={(el) => {
                          fileInputRefs.current[s.id] = el;
                        }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoFileChange(s, file);
                          e.target.value = '';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[s.id]?.click()}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                        title="Change / upload student picture"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900">{s.name}</td>
                  <td className="py-3 px-3 text-slate-600">{s.fatherName}</td>
                  <td className="py-3 px-3">
                    <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 truncate max-w-[180px]">
                      {s.className || 'Unassigned'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-medium">
                    {currency} {(s.monthlyFee || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                        (s.dues || 0) > 0
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {currency} {(s.dues || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => onOpenReceipt(s)}
                      className="h-7 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded inline-flex items-center gap-1 transition cursor-pointer"
                    >
                      <Receipt className="w-3 h-3" /> Receipt
                    </button>
                  </td>
                  <td className="py-3 px-3 text-right space-x-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenEditModal(s)}
                      className="h-7 px-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded inline-flex items-center gap-1 transition cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to permanently delete student "${s.name}" (${s.id})?`)) {
                          onDeleteStudent(s.id);
                          onNotification(`Student ${s.name} deleted.`, 'info');
                        }
                      }}
                      className="h-7 px-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded inline-flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" /> {previewPhoto.name} ({previewPhoto.id})
              </h3>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex flex-col items-center">
              {previewPhoto.url && !previewPhoto.url.includes('svg') ? (
                <img
                  src={previewPhoto.url}
                  alt={previewPhoto.name}
                  className="w-48 h-48 object-cover rounded-xl border-2 border-blue-500 shadow-md"
                />
              ) : (
                <div className="w-48 h-48 bg-slate-50 rounded-xl flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 shadow-2xs">
                  <Camera className="w-10 h-10 text-slate-300 mb-2" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Square Blank
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">No picture uploaded</p>
                </div>
              )}

              {/* Action Buttons to Change Photo or Remove to Blank */}
              <div className="mt-4 flex items-center gap-2 w-full">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={modalFileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    const target = students.find((s) => s.id === previewPhoto.id);
                    if (file && target) {
                      handlePhotoFileChange(target, file);
                    }
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => modalFileInputRef.current?.click()}
                  className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{previewPhoto.url ? 'Change Photo' : 'Upload Photo'}</span>
                </button>

                {previewPhoto.url && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = students.find((s) => s.id === previewPhoto.id);
                      if (target) handleRemovePhoto(target);
                    }}
                    className="h-9 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                    title="Remove picture (make square blank)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {/* Online Image Link */}
              <div className="mt-4 w-full bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Online Image URL Link:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getFullPhotoUrl(previewPhoto.url)}
                    className="text-xs bg-white border border-slate-300 rounded px-2 py-1.5 flex-1 font-mono text-slate-700 outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={() => copyPhotoLink(previewPhoto.url)}
                    className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer"
                    title="Copy URL"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <a
                    href={getFullPhotoUrl(previewPhoto.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
