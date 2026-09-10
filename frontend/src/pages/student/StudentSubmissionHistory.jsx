import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  FileText,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { submissionService } from '../../services/submissionService';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { EmptyState } from '../../components/common/EmptyState';
import { PDFViewerModal } from '../../components/common/PDFViewerModal';

export const StudentSubmissionHistory = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePdfUrl, setActivePdfUrl] = useState(null);
  const [pdfTitle, setPdfTitle] = useState('');
  const toast = useToast();

  const fetchSubmissions = async () => {
    try {
      const data = await submissionService.getMySubmissions();
      setSubmissions(data);
    } catch (err) {
      toast.error('Failed to load submission history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  if (loading) return <Loader message="Loading submission records..." />;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Submission History & Transcripts
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Review all submitted solution PDFs, instructor grades, and written feedback
        </p>
      </div>

      {submissions.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No submissions found"
          description="Assignments you submit will appear in this timeline."
        />
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                      {sub.class_name}
                    </span>
                    <Badge size="sm">{sub.status}</Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {sub.assignment_title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Link to={`/student/assignments/${sub.assignment_id}`}>
                    <Button variant="secondary" size="xs" icon={ExternalLink}>
                      Task Details
                    </Button>
                  </Link>
                  {sub.solution_file_url && (
                    <Button
                      variant="outline"
                      size="xs"
                      icon={FileText}
                      onClick={() => {
                        setActivePdfUrl(sub.solution_file_url);
                        setPdfTitle(`Your Solution: ${sub.assignment_title}`);
                      }}
                    >
                      View Solution PDF
                    </Button>
                  )}
                </div>
              </div>

              {/* Middle row: Submission date, notes, score */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Turned In:</span>
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(sub.submitted_at).toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Evaluation:</span>
                  {sub.marks_awarded != null ? (
                    <span className="font-extrabold text-emerald-600 text-sm flex items-center gap-1">
                      <Award className="w-4 h-4 text-emerald-500" />
                      {sub.marks_awarded} / {sub.total_marks} Marks
                    </span>
                  ) : (
                    <span className="text-amber-600 font-semibold italic">
                      Pending Evaluation
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Student Notes:</span>
                  <span className="text-slate-600 truncate block">
                    {sub.submission_text || 'No extra notes.'}
                  </span>
                </div>
              </div>

              {/* Feedback Comment if available */}
              {sub.feedback && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-700">
                  <span className="font-bold text-indigo-950 block mb-1 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    Instructor Feedback & Notes:
                  </span>
                  <p className="italic text-slate-700 leading-relaxed">
                    "{sub.feedback}"
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* PDF Viewer */}
      <PDFViewerModal
        isOpen={Boolean(activePdfUrl)}
        onClose={() => setActivePdfUrl(null)}
        fileUrl={activePdfUrl}
        title={pdfTitle}
      />
    </div>
  );
};
