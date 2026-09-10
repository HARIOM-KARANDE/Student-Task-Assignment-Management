import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Calendar,
  Award,
  Upload,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  MessageSquare
} from 'lucide-react';
import { assignmentService } from '../../services/assignmentService';
import { submissionService } from '../../services/submissionService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Textarea } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';
import { EmptyState } from '../../components/common/EmptyState';
import { Badge } from '../../components/common/Badge';
import { PDFViewerModal } from '../../components/common/PDFViewerModal';

export const StudentAssignmentDetail = () => {
  const { id } = useParams();
  const toast = useToast();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  // PDF Viewer
  const [activePdfUrl, setActivePdfUrl] = useState(null);
  const [pdfTitle, setPdfTitle] = useState('');

  // Submit Solution Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [solutionFile, setSolutionFile] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAssignmentDetail = async () => {
    try {
      const data = await assignmentService.getById(id);
      setAssignment(data);
      if (data.my_submission?.submission_text) {
        setSubmissionText(data.my_submission.submission_text);
      }
    } catch (err) {
      toast.error('Failed to load assignment information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentDetail();
  }, [id]);

  const handleSubmitSolution = async (e) => {
    e.preventDefault();
    if (!solutionFile && !submissionText.trim()) {
      toast.error('Please either upload a solution PDF or write solution text');
      return;
    }

    if (solutionFile && !solutionFile.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF documents are allowed for solution uploads');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (submissionText.trim()) {
        formData.append('submission_text', submissionText.trim());
      }
      if (solutionFile) {
        formData.append('file', solutionFile);
      }

      await submissionService.submit(id, formData);
      toast.success('Your solution has been submitted successfully!');
      setIsSubmitModalOpen(false);
      setSolutionFile(null);
      fetchAssignmentDetail();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit solution');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader message="Loading assignment..." />;
  if (!assignment) return <EmptyState title="Assignment not found" />;

  const mySub = assignment.my_submission;
  const isSubmitted = Boolean(mySub && mySub.id);
  const dueDate = new Date(assignment.due_date);
  const now = new Date();
  const isOverdue = now > dueDate;

  const currentStatus = mySub?.status || (isOverdue ? 'Late' : 'Pending');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Back link */}
      <Link
        to="/student/assignments"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Assignments
      </Link>

      {/* Main Grid: Assignment Details & Submission Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Instructions & Question PDF */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700">
                  {assignment.class_name}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500">
                  {assignment.subject_name} ({assignment.subject_code})
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {assignment.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Due {dueDate.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>{assignment.total_marks} Points Possible</span>
                </div>
              </div>
            </div>

            {/* Description / Instructions */}
            {assignment.description && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Instructions & Objectives
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {assignment.description}
                </p>
              </div>
            )}

            {/* Question Text */}
            {assignment.question_text && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Problem Statement
                </h3>
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line font-mono text-xs">
                  {assignment.question_text}
                </p>
              </div>
            )}

            {/* Question PDF Attachment */}
            {assignment.question_file_url && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950">
                      Question Document (PDF)
                    </h4>
                    <p className="text-[11px] text-indigo-700">
                      Detailed problem sheet provided by your instructor
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  icon={Eye}
                  onClick={() => {
                    setActivePdfUrl(assignment.question_file_url);
                    setPdfTitle(`Question Sheet: ${assignment.title}`);
                  }}
                >
                  Inspect PDF
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Submission Card & Instructor Feedback */}
        <div className="space-y-6">
          {/* Submission Status Box */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-sm font-bold text-slate-900">Your Submission</span>
              <Badge size="md">{currentStatus}</Badge>
            </div>

            {/* If Already Submitted */}
            {isSubmitted ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Turned in on:</span>
                  <span className="font-semibold text-slate-700">
                    {new Date(mySub.submitted_at).toLocaleDateString()} at{' '}
                    {new Date(mySub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {mySub.solution_file_url && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-700 font-semibold truncate max-w-[170px]">
                      <FileText className="w-4 h-4 shrink-0" />
                      <span className="truncate">Your Solution PDF</span>
                    </div>
                    <button
                      onClick={() => {
                        setActivePdfUrl(mySub.solution_file_url);
                        setPdfTitle(`Your Solution: ${assignment.title}`);
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      View
                    </button>
                  </div>
                )}

                {mySub.submission_text && (
                  <div className="p-3 rounded-xl bg-slate-50 text-slate-600 border border-slate-100 italic">
                    "{mySub.submission_text}"
                  </div>
                )}

                {/* Resubmit button if student wants to update solution */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  icon={Upload}
                  onClick={() => setIsSubmitModalOpen(true)}
                >
                  Resubmit Solution
                </Button>
              </div>
            ) : (
              /* Not Submitted Yet */
              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Prepare your solution report as a PDF document and upload it before the deadline.
                </p>

                {isOverdue && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Past deadline! Any submission will be marked Late.</span>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  icon={Upload}
                  onClick={() => setIsSubmitModalOpen(true)}
                >
                  Turn In Solution
                </Button>
              </div>
            )}
          </div>

          {/* Instructor Evaluation / Score Box */}
          {mySub?.marks_awarded != null && (
            <div className="p-6 rounded-3xl bg-emerald-50/70 border border-emerald-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Instructor Evaluation
                </span>
                <span className="text-xs text-emerald-700 font-medium">
                  {mySub.graded_at ? new Date(mySub.graded_at).toLocaleDateString() : 'Reviewed'}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-700">
                  {mySub.marks_awarded}
                </span>
                <span className="text-sm font-semibold text-emerald-600">
                  / {assignment.total_marks} Marks
                </span>
              </div>

              {mySub.feedback && (
                <div className="p-3.5 rounded-2xl bg-white/80 border border-emerald-100 text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold block text-slate-900 mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Feedback:
                  </span>
                  "{mySub.feedback}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Submit Solution Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title={isSubmitted ? 'Resubmit Assignment Solution' : 'Submit Assignment'}
        description={`Upload your solution PDF for "${assignment.title}"`}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsSubmitModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={submitting}
              onClick={handleSubmitSolution}
            >
              Confirm & Submit
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmitSolution} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Upload Solution PDF *
            </label>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setSolutionFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
            {solutionFile && (
              <p className="mt-1.5 text-xs text-emerald-600 font-medium">
                Selected: {solutionFile.name} ({(solutionFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <Textarea
            label="Additional Comments / Solution Notes (Optional)"
            rows={3}
            placeholder="Execution instructions, external libraries utilized, or comments for instructor..."
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
          />
        </form>
      </Modal>

      {/* PDF Viewer Modal */}
      <PDFViewerModal
        isOpen={Boolean(activePdfUrl)}
        onClose={() => setActivePdfUrl(null)}
        fileUrl={activePdfUrl}
        title={pdfTitle}
      />
    </div>
  );
};
