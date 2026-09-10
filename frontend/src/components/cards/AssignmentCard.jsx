import React from 'react';
import { Calendar, FileText, Award, Clock, ArrowRight } from 'lucide-react';
import { Badge } from '../common/Badge';

export const AssignmentCard = ({
  assignment,
  onClick,
  isStudent = false,
}) => {
  const dueDate = new Date(assignment.due_date);
  const now = new Date();
  const isOverdue = now > dueDate;

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const status = assignment.my_submission?.status || (isOverdue ? 'Late' : 'Pending');

  return (
    <div
      onClick={onClick}
      className="group flex flex-col justify-between p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all duration-200 cursor-pointer"
    >
      <div>
        {/* Header: Class tag & Status badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 max-w-[200px] truncate">
            {assignment.class_name || 'Class Assignment'}
          </span>
          {isStudent ? (
            <Badge>{status}</Badge>
          ) : (
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {assignment.submissions_count || 0} Submissions
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
          {assignment.title}
        </h4>

        {/* Description snippet */}
        {assignment.description && (
          <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {assignment.description}
          </p>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          {/* Due date */}
          <div
            className={`flex items-center gap-1.5 font-medium ${
              isOverdue && status !== 'Completed'
                ? 'text-rose-600 font-semibold'
                : 'text-slate-500'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Due {formatDate(dueDate)}</span>
          </div>

          {/* Points */}
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            {isStudent && assignment.my_submission?.marks_awarded != null ? (
              <span className="font-semibold text-emerald-600">
                {assignment.my_submission.marks_awarded}/{assignment.total_marks} pts
              </span>
            ) : (
              <span>{assignment.total_marks} pts</span>
            )}
          </div>
        </div>

        {/* Action arrow */}
        <span className="text-indigo-600 font-medium flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
          View <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
