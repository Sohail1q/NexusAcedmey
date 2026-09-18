import React, { useState, useRef, useEffect } from 'react';
import {
  Contact,
  Search,
  FileSpreadsheet,
  Download,
  Calendar,
  Award,
  ExternalLink,
  Eye,
  X,
  Copy,
  Check,
  Camera,
  Trash2,
} from 'lucide-react';
import { NexusStudent, NexusTestRecord, NexusAttendanceRecord } from '../types';
import { downloadBlob, exportToExcelXls } from '../services/cloudSync';
import { compressImage } from '../utils/imageOptimizer';

interface StudentInfoViewProps {
  students: NexusStudent[];
  tests: NexusTestRecord[];
  attendance: Record<string, Record<string, NexusAttendanceRecord[]>>;
  currency?: string;
  onUpdateStudent?: (student: NexusStudent) => void;
  onNotification: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const StudentInfoView: React.FC<StudentInfoViewProps> = ({
  students,
  tests,
  attendance,
  currency = 'PKR',
  onUpdateStudent,
  onNotification,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeStudent, setActiveStudent] = useState<NexusStudent | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; name: string; id: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const profileFileInputRef = useRef<HTMLInputElement | null>(null);
  const modalFileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync activeStudent when students array updates
  useEffect(() => {
    if (activeStudent) {
      const refreshed = students.find((s) => s.id === activeStudent.id);
      if (refreshed) {
        setActiveStudent(refreshed);
        if (previewPhoto && previewPhoto.id === refreshed.id) {
          setPreviewPhoto({
            url: refreshed.photo || '',
            name: refreshed.name,
            id: refreshed.id,
          });
        }
      }
    }
  }, [students]);

  // Handler: upload/change student photo with automatic compression
  const handlePhotoFileChange = async (student: NexusStudent, file: File) => {
    try {
      onNotification('Optimizing and uploading photo...', 'info');
      const compressedDataUrl = await compressImage(file, 400, 400, 0.82);

      let savedUrl = compressedDataUrl;
      try {
        const res = await fetch('/api/upload-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl: compressedDataUrl,
            studentId: student.id,
            prefix: student.name,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.url) {
            savedUrl = json.url;
          }
        }
      } catch {
        // Fallback to compressed base64
      }

      const updated: NexusStudent = {
        ...student,
        photo: savedUrl,
        photoUrl: savedUrl.startsWith('http') ? savedUrl : `${window.location.origin}${savedUrl}`,
      };

      if (onUpdateStudent) {
        onUpdateStudent(updated);
      }
      setActiveStudent(updated);
      setPreviewPhoto({ url: savedUrl, name: student.name, id: student.id });
      onNotification(`Photo successfully updated for ${student.name}!`, 'success');
    } catch {
      onNotification('Failed to process image file.', 'error');
    }
  };

  // Handler: remove student photo and make it a clean square blank
  const handleRemovePhoto = (student: NexusStudent) => {
    const updated: NexusStudent = {
      ...student,
      photo: '',
      photoUrl: '',
      photoLink: '',
    };
    if (onUpdateStudent) {
      onUpdateStudent(updated);
    }
    setActiveStudent(updated);
    if (previewPhoto && previewPhoto.id === student.id) {
      setPreviewPhoto({ url: '', name: student.name, id: student.id });
    }
    onNotification(`Photo removed for ${student.name}. Displaying square blank.`, 'info');
  };

  const handleSearch = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      onNotification('Please enter a student name, ID, or father name to search.', 'error');
      return;
    }

    const found = students.find(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.fatherName && s.fatherName.toLowerCase().includes(q)) ||
        (s.guardianName && s.guardianName.toLowerCase().includes(q))
    );

    if (found) {
      setActiveStudent(found);
      onNotification(`Found profile for ${found.name} (${found.id})`, 'success');
    } else {
      setActiveStudent(null);
      onNotification(`No student matching "${q}" was found.`, 'error');
    }
  };

  // Compile attendance history rows for the active student
  const attendanceHistory: Array<{ date: string; day: string; status: string; className: string }> = [];
  if (activeStudent) {
    const targetId = activeStudent.id.trim().toLowerCase();
    const targetName = activeStudent.name.trim().toLowerCase();

    Object.keys(attendance || {})
      .sort()
      .reverse()
      .forEach((date) => {
        const classesForDate = attendance[date] || {};
        Object.entries(classesForDate).forEach(([clsName, records]) => {
          const recList = (records as NexusAttendanceRecord[]) || [];
          recList.forEach((r) => {
            const rId = (r.studentId || '').trim().toLowerCase();
            if (rId === targetId || rId === targetName) {
              const dateObj = new Date(date);
              const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              const day = isNaN(dateObj.getTime()) ? '' : dayNames[dateObj.getDay()];

              attendanceHistory.push({
                date,
                day,
                status: r.status,
                className: clsName,
              });
            }
          });
        });
      });
  }

  // Compile test history rows for the active student
  const testHistory: Array<{
    date: string;
    testName: string;
    totalMarks: number;
    achieved: number;
    isPass: boolean;
  }> = [];

  if (activeStudent) {
    const targetId = activeStudent.id.trim().toLowerCase();
    (tests || []).forEach((t) => {
      const scoreObj = t.scores?.find(
        (s) => (s.studentId || '').trim().toLowerCase() === targetId
      );
      if (scoreObj) {
        testHistory.push({
          date: t.date,
          testName: t.testName,
          totalMarks: t.totalMarks,
          achieved: scoreObj.marks,
          isPass: scoreObj.marks >= t.passingMarks,
        });
      }
    });
  }

  const getFullPhotoUrl = (photoPath?: string) => {
    if (!photoPath) return '';
    if (photoPath.startsWith('http')) return photoPath;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
  };

  // Download Attendance in native Excel spreadsheet (.xls) with custom column widths & text format (NEVER shows ######## in Excel)
  const handleDownloadExcel = () => {
    if (!activeStudent) return;
    if (attendanceHistory.length === 0) {
      onNotification(`No attendance records to export for ${activeStudent.name}.`, 'info');
      return;
    }

    const photoFullUrl = getFullPhotoUrl(activeStudent.photo);

    const columns = [
      { header: 'Student ID', width: 90 },
      { header: 'Photo Link', width: 110 },
      { header: 'Student Name', width: 130 },
      { header: 'Father / Guardian', width: 130 },
      { header: 'Class Name', width: 160 },
      { header: 'Attendance Date', width: 120 },
      { header: 'Day of Week', width: 100 },
      { header: 'Status (Present/Absent/Leave)', width: 140 },
    ];

    const rows = attendanceHistory.map((r) => [
      { text: activeStudent.id },
      {
        text: photoFullUrl ? 'View Online Photo' : 'No Photo',
        isLink: !!photoFullUrl,
        linkUrl: photoFullUrl,
      },
      { text: activeStudent.name },
      { text: activeStudent.fatherName || activeStudent.guardianName || '' },
      { text: r.className },
      { text: r.date, isDate: true },
      { text: r.day },
      { text: r.status, isStatus: true },
    ]);

    const safeName = activeStudent.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    exportToExcelXls({
      sheetName: `${activeStudent.id}_Attendance`,
      title: `Nexus Academy — Official Attendance Log: ${activeStudent.name}`,
      subtitle: `Student ID: ${activeStudent.id} | Class: ${activeStudent.className || 'General'} | Guardian: ${activeStudent.fatherName || 'N/A'} | Total Records: ${attendanceHistory.length}`,
      columns,
      rows,
      filename: `${activeStudent.id}_${safeName}_attendance.xls`,
    });

    onNotification(`Excel attendance sheet exported cleanly for ${activeStudent.name}!`, 'success');
  };

  // Download Attendance CSV with text-protected dates so Excel never renders ########
  const handleDownloadCSV = () => {
    if (!activeStudent) return;
    if (attendanceHistory.length === 0) {
      onNotification(`No attendance records to export for ${activeStudent.name}.`, 'info');
      return;
    }

    const photoFullUrl = getFullPhotoUrl(activeStudent.photo);

    const rows = [
      [
        'Student ID',
        'Student Name',
        'Father / Guardian',
        'Class',
        'Attendance Date',
        'Day of Week',
        'Status',
        'Online Photo URL',
      ],
    ];

    attendanceHistory.forEach((r) => {
      // In CSV, Excel auto-expands or treats ='YYYY-MM-DD' as a string formula so it never collapses to ########
      rows.push([
        activeStudent.id,
        activeStudent.name,
        activeStudent.fatherName || activeStudent.guardianName || '',
        r.className,
        `="${r.date}"`,
        r.day,
        r.status,
        photoFullUrl,
      ]);
    });

    const csvContent =
      '\ufeff' +
      rows
        .map((row) =>
          row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
        )
        .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const safeName = activeStudent.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadBlob(blob, `${activeStudent.id}_${safeName}_attendance.csv`);

    onNotification(`Attendance CSV exported for ${activeStudent.name}!`, 'success');
  };

  const copyPhotoLink = (url: string) => {
    const full = getFullPhotoUrl(url);
    navigator.clipboard.writeText(full);
    setCopiedLink(true);
    onNotification('Online photo link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Contact className="w-5 h-5 text-blue-600" /> Search Student Record &amp; History
        </h3>
      </div>

      {/* Search Input Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Type Student Name, Student ID, or Father Name..."
          className="h-10 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-blue-600 flex-1 max-w-md"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-md inline-flex items-center gap-2 transition cursor-pointer"
        >
          <Search className="w-4 h-4" /> Search Profile
        </button>
      </div>

      {/* Student Profile Card */}
      {activeStudent && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={profileFileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && activeStudent) {
                    handlePhotoFileChange(activeStudent, file);
                  }
                  e.target.value = '';
                }}
              />

              <div className="relative group">
                <div
                  className="cursor-pointer"
                  onClick={() => setPreviewPhoto({ url: activeStudent.photo || '', name: activeStudent.name, id: activeStudent.id })}
                >
                  {activeStudent.photo && !activeStudent.photo.includes('svg') ? (
                    <img
                      src={activeStudent.photo}
                      alt={activeStudent.name}
                      className="w-20 h-20 rounded-xl object-cover border-2 border-blue-600 shadow-sm group-hover:opacity-90 transition"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-white flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 shadow-2xs">
                      <Camera className="w-6 h-6 text-slate-300 mb-1" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Blank</span>
                    </div>
                  )}
                </div>

                <div className="absolute -bottom-2 -right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => profileFileInputRef.current?.click()}
                    className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow transition cursor-pointer"
                    title="Upload or change picture"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  {activeStudent.photo && (
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(activeStudent)}
                      className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-md shadow transition cursor-pointer"
                      title="Remove picture (make square blank)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-900">{activeStudent.name}</h2>
                  {activeStudent.photo && (
                    <button
                      type="button"
                      onClick={() => copyPhotoLink(activeStudent.photo!)}
                      className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
                      title="Copy online photo URL"
                    >
                      {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {copiedLink ? 'Link Copied!' : 'Copy Photo URL'}
                    </button>
                  )}
                  {activeStudent.photo && (
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(activeStudent)}
                      className="text-[11px] px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 flex items-center gap-1 cursor-pointer"
                      title="Remove student photo"
                    >
                      <Trash2 className="w-3 h-3" /> Remove Photo
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-0.5">
                  Father: <strong className="text-slate-800">{activeStudent.fatherName}</strong> | ID:{' '}
                  <strong className="text-blue-600">{activeStudent.id}</strong> | Phone:{' '}
                  <span className="text-slate-700 font-medium">{activeStudent.studentNumber || activeStudent.guardianNumber || 'N/A'}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                    {activeStudent.className || 'No Class Assigned'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-semibold">
                    Dues: {currency} {(activeStudent.dues || 0).toLocaleString()}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    Paid: {currency} {(activeStudent.totalPaid || 0).toLocaleString()}
                  </span>
                  {activeStudent.photo && (
                    <a
                      href={getFullPhotoUrl(activeStudent.photo)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 font-medium flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Online Photo Link
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Dual Download Buttons (Excel .xls & CSV) */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={handleDownloadExcel}
                className="h-10 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg inline-flex items-center gap-2 shadow-sm transition cursor-pointer"
                title="Export with clear dates, colors, wide columns, and photo link"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" /> Export Excel (.xls)
              </button>

              <button
                type="button"
                onClick={handleDownloadCSV}
                className="h-10 px-3.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                title="Download standard CSV"
              >
                <Download className="w-4 h-4 text-slate-300" /> CSV
              </button>
            </div>
          </div>

          {/* History Tables Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance History */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" /> Attendance History Log ({attendanceHistory.length})
                </h4>
                {attendanceHistory.length > 0 && (
                  <button
                    onClick={handleDownloadExcel}
                    className="text-xs text-emerald-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Export Sheet
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Day</th>
                      <th className="py-2.5 px-3">Class</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendanceHistory.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">
                          No attendance records found for this student.
                        </td>
                      </tr>
                    ) : (
                      attendanceHistory.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-800">{r.date}</td>
                          <td className="py-2 px-3 text-slate-500">{r.day}</td>
                          <td className="py-2 px-3 text-slate-600 truncate max-w-[130px]">
                            {r.className}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                                r.status === 'Present'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : r.status === 'Absent'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Test History */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" /> Academic Test History ({testHistory.length})
              </h4>
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Test Name</th>
                      <th className="py-2.5 px-3">Score</th>
                      <th className="py-2.5 px-3">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {testHistory.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">
                          No test scores recorded for this student.
                        </td>
                      </tr>
                    ) : (
                      testHistory.map((t, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-500">{t.date}</td>
                          <td className="py-2 px-3 font-medium text-slate-700">{t.testName}</td>
                          <td className="py-2 px-3 text-slate-700">
                            <strong>{t.achieved}</strong> / {t.totalMarks}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                t.isPass
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {t.isPass ? 'Passed' : 'Failed'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Contact className="w-4 h-4 text-blue-600" /> {previewPhoto.name} ({previewPhoto.id})
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
                  className="w-56 h-56 object-cover rounded-xl border border-slate-200 shadow-md"
                />
              ) : (
                <div className="w-56 h-56 bg-slate-50 rounded-xl flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 shadow-2xs">
                  <Camera className="w-12 h-12 text-slate-300 mb-2" />
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
                    const target = students.find((s) => s.id === previewPhoto.id) || activeStudent;
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
                      const target = students.find((s) => s.id === previewPhoto.id) || activeStudent;
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
