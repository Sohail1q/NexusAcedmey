import React, { useState, useEffect } from 'react';
import { Pencil, X, Check, Camera, Trash2 } from 'lucide-react';
import { NexusStudent, NexusClass } from '../types';
import { compressImage } from '../utils/imageOptimizer';

interface EditStudentModalProps {
  student: NexusStudent | null;
  classes: NexusClass[];
  currency?: string;
  onClose: () => void;
  onSave: (updated: NexusStudent) => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  student,
  classes,
  currency = 'PKR',
  onClose,
  onSave,
}) => {
  if (!student) return null;

  const [name, setName] = useState(student.name);
  const [father, setFather] = useState(student.fatherName);
  const [guardianNum, setGuardianNum] = useState(student.guardianNumber || '');
  const [studentNum, setStudentNum] = useState(student.studentNumber || '');
  const [gmail, setGmail] = useState(student.gmail || '');
  const [className, setClassName] = useState(student.className || '');
  const [dues, setDues] = useState<number>(student.dues || 0);
  const [photo, setPhoto] = useState<string>(student.photo || '');

  useEffect(() => {
    if (student) {
      setName(student.name);
      setFather(student.fatherName);
      setGuardianNum(student.guardianNumber || '');
      setStudentNum(student.studentNumber || '');
      setGmail(student.gmail || '');
      setClassName(student.className || '');
      setDues(student.dues || 0);
      setPhoto(student.photo || '');
    }
  }, [student]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 240, 240, 0.8);
        setPhoto(compressed);
      } catch (err) {
        console.error('Failed to compress photo:', err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...student,
      name: name.trim(),
      fatherName: father.trim(),
      guardianName: father.trim(),
      guardianNumber: guardianNum.trim(),
      studentNumber: studentNum.trim(),
      gmail: gmail.trim(),
      className,
      dues: Number(dues) || 0,
      photo: photo.trim() ? photo : '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Pencil className="w-4 h-4 text-amber-500" /> Edit Student Data ({student.id})
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Photo Edit (Square Photo or Square Blank) */}
          <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="relative shrink-0">
              {photo && !photo.includes('svg') ? (
                <div className="relative group">
                  <img
                    src={photo}
                    alt={name}
                    className="w-16 h-16 rounded-md object-cover border-2 border-blue-600 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setPhoto('')}
                    title="Remove photo (make square blank)"
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-xs shadow transition cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-md bg-white flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 shadow-2xs">
                  <Camera className="w-5 h-5 text-slate-300 mb-0.5" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Blank</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Student Photo (Square Blank if none)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Upload new picture or click remove to keep a square blank.
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Student Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-blue-600"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Father / Guardian Name
            </label>
            <input
              type="text"
              value={father}
              onChange={(e) => setFather(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-blue-600"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Guardian Number
              </label>
              <input
                type="text"
                value={guardianNum}
                onChange={(e) => setGuardianNum(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Student Number
              </label>
              <input
                type="text"
                value={studentNum}
                onChange={(e) => setStudentNum(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Gmail / Email
            </label>
            <input
              type="email"
              value={gmail}
              onChange={(e) => setGmail(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Class Option
            </label>
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-blue-600"
            >
              <option value="">-- No Class Assigned --</option>
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

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Total Outstanding Dues ({currency})
            </label>
            <input
              type="number"
              min={0}
              value={dues}
              onChange={(e) => setDues(parseFloat(e.target.value) || 0)}
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-blue-600 font-semibold"
              required
            />
          </div>

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
              <Check className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
