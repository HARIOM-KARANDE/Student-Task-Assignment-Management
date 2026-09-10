import React, { useState } from 'react';
import { Users, BookOpen, Copy, Check, Calendar, ArrowRight } from 'lucide-react';
import { Badge } from '../common/Badge';

export const ClassCard = ({
  classData,
  onOpen,
  isAdmin = false,
  onEdit,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(classData.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate deterministic gradient banner based on class id
  const gradients = [
    'from-indigo-600 via-indigo-700 to-blue-800',
    'from-emerald-600 via-teal-700 to-cyan-800',
    'from-violet-600 via-purple-700 to-indigo-800',
    'from-rose-600 via-pink-700 to-purple-800',
    'from-amber-600 via-orange-700 to-rose-800',
  ];
  const bgGradient = gradients[classData.id % gradients.length];

  return (
    <div
      onClick={onOpen}
      className="group relative flex flex-col justify-between rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-slate-300 transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1"
    >
      {/* Top Banner */}
      <div className={`p-6 bg-gradient-to-r ${bgGradient} text-white relative overflow-hidden`}>
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase bg-white/20 backdrop-blur-md rounded-full text-white">
            {classData.subject_code || 'COURSE'}
          </span>
          <span className="text-xs text-white/80 font-medium">
            {classData.semester || 'Current Term'}
          </span>
        </div>

        <h3 className="text-lg font-bold tracking-tight text-white line-clamp-1 group-hover:text-white/95">
          {classData.name}
        </h3>
        <p className="text-xs text-white/80 line-clamp-1 mt-0.5">
          {classData.subject_name} {classData.section ? `• Section ${classData.section}` : ''}
        </p>
      </div>

      {/* Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Class code badge */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Class Code:</span>
            <span className="font-mono font-bold text-indigo-600 tracking-wider text-sm">
              {classData.code}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            title="Copy code"
            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Schedule info if available */}
        {classData.schedule && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{classData.schedule}</span>
          </div>
        )}

        {/* Metrics & Action */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <strong className="font-semibold text-slate-700">{classData.students_count ?? 0}</strong> students
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <strong className="font-semibold text-slate-700">{classData.assignments_count ?? 0}</strong> tasks
            </span>
          </div>

          <span className="text-indigo-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Enter <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
