import React, { useState } from 'react';
import {
  Coins,
  Search,
  PlusCircle,
  FileSpreadsheet,
  X,
  Users,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { NexusStudent } from '../types';
import { exportToExcelXls } from '../services/cloudSync';

interface DuesViewProps {
  students: NexusStudent[];
  currency?: string;
  onOpenAddFeeModal: (student: NexusStudent) => void;
}

export const DuesView: React.FC<DuesViewProps> = ({
  students,
  currency = 'PKR',
  onOpenAddFeeModal,
}) => {
  const [search, setSearch] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; name: string; id: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      (s.guardianName && s.guardianName.toLowerCase().includes(q)) ||
      (s.fatherName && s.fatherName.toLowerCase().includes(q)) ||
      (s.className && s.className.toLowerCase().includes(q))
    );
  });

  const getFullPhotoUrl = (photoPath?: string) => {
    if (!photoPath) return '';
    if (photoPath.startsWith('http')) return photoPath;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
  };

  const handleExportDues = () => {
    if (filtered.length === 0) return;

    const columns = [
      { header: 'Student ID', width: 90 },
      { header: 'Photo Link', width: 110 },
      { header: 'Student Name', width: 130 },
      { header: 'Guardian Name', width: 130 },
      { header: 'Class', width: 160 },
      { header: `Monthly Fee (${currency})`, width: 120 },
      { header: `Total Dues (${currency})`, width: 120 },
      { header: 'Status', width: 110 },
    ];

    const rows = filtered.map((s) => {
      const fullPhoto = getFullPhotoUrl(s.photo);
      const duesAmt = s.dues || 0;
      return [
        { text: s.id },
        {
          text: fullPhoto ? 'View Online Photo' : 'No Photo',
          isLink: !!fullPhoto,
          linkUrl: fullPhoto,
        },
        { text: s.name },
        { text: s.guardianName || s.fatherName || '' },
        { text: s.className || 'Unassigned' },
        { text: `${s.monthlyFee || 0}` },
        { text: `${duesAmt}` },
        {
          text: duesAmt > 0 ? 'Pending' : 'Cleared',
          isStatus: true,
        },
      ];
    });

    exportToExcelXls({
      sheetName: 'Student_Dues',
      title: 'Nexus Academy — Student Fee & Dues Summary',
      subtitle: `Total Students: ${filtered.length} | Export Date: ${new Date().toLocaleDateString()}`,
      columns,
      rows,
      filename: `Student_Dues_${Date.now()}.xls`,
    });
  };

  const copyPhotoLink = (url: string) => {
    const full = getFullPhotoUrl(url);
    navigator.clipboard.writeText(full);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Coins className="w-5 h-5 text-blue-600" /> Student Dues &amp; Monthly Fee Submission
        </h3>

        {filtered.length > 0 && (
          <button
            type="button"
            onClick={handleExportDues}
            className="h-9 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            title="Download Dues Report in Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" /> Export Dues (.xls)
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student name, ID or guardian..."
            className="w-full h-10 pl-9 pr-3 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* Dues Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
              <th className="py-2.5 px-3">ID #</th>
              <th className="py-2.5 px-3">Photo</th>
              <th className="py-2.5 px-3">Student Name</th>
              <th className="py-2.5 px-3">Father / Guardian</th>
              <th className="py-2.5 px-3">Class</th>
              <th className="py-2.5 px-3">Monthly Fee</th>
              <th className="py-2.5 px-3">Total Dues</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  No student dues records found.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-semibold text-blue-600">{s.id}</td>
                  <td className="py-3 px-3">
                    <div
                      onClick={() => setPreviewPhoto({ url: s.photo || '', name: s.name, id: s.id })}
                      className="cursor-pointer group relative inline-block"
                      title="Click to view full photo & online link"
                    >
                      {s.photo && !s.photo.includes('svg') ? (
                        <img
                          src={s.photo}
                          alt={s.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 group-hover:ring-2 group-hover:ring-blue-500 transition shadow-xs"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 group-hover:ring-2 group-hover:ring-blue-500">
                          {s.name ? s.name.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-900">{s.name}</td>
                  <td className="py-3 px-3 text-slate-600">{s.guardianName || s.fatherName}</td>
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
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => onOpenAddFeeModal(s)}
                      className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Add Fee / Amount
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
                  className="w-52 h-52 object-cover rounded-xl border border-slate-200 shadow-md"
                />
              ) : (
                <div className="w-52 h-52 bg-slate-100 rounded-xl flex items-center justify-center text-4xl font-bold text-slate-400 border border-slate-200">
                  {previewPhoto.name.charAt(0)}
                </div>
              )}

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
