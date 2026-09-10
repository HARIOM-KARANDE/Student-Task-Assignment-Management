import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Calendar,
  Award,
  Download,
  Eye,
  CheckCircle,
  Clock,
  Search,
  Check
} from 'lucide-react';
import { assignmentService } from '../../services/assignmentService';
import { submissionService } from '../../services/submissionService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input, Textarea, Select } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';
import { EmptyState } from '../../components/common/EmptyState';
import { Badge } from '../../components/common/Badge';
import { PDFViewerModal } from '../../components/common/PDFViewerModal';

export const AssignmentDetailSubmissions = () => {
  const { id } = useParams();
  const toast = useToast();

  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // PDF modal
  const [activePdfUrl, setActivePdfUrl] = useState(null);
  const [pdfModalTitle, setPdfModalTitle] = useState('');

  // Grade modal
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeData, setGradeData] = useState({
    marks_awarded: '',
    feedback: '',
    status: 'Completed',
  });
  const [gradeLoading, setGradeLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [asgData, subsData] = await Promise.all([
        assignmentService.getById(id),
        submissionService.getByAssignment(id),
      ]);
      setAssignment(asgData);
      setSubmissions(subsData);
    } catch (err) {
      toast.error('Failed to load assignment submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleOpenGrade = (sub) => {
    setGradingSubmission(sub);
    setGradeData({
      marks_awarded: sub.marks_awarded != null ? String(sub.marks_awarded) : '',
      feedback: sub.feedback || '',
      status: sub.status === 'Late' ? 'Late' : 'Completed',
    });
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (gradeData.marks_awarded === '') {
      toast.error('Please enter marks to award');
      return;
    }
    const marksNum = parseFloat(gradeData.marks_awarded);
    if (isNaN(marksNum) || marksNum < 0) {
      toast.error('Marks must be a positive number');
      return;
    }
    if (marksNum > assignment.total_marks) {
      toast.error(`Marks cannot exceed maximum marks (${assignment.total_marks})`);
      return;
    }

    setGradeLoading(true);
    try {
      await submissionService.grade(gradingSubmission.id, {
        marks_awarded: marksNum,
        feedback: gradeData.feedback.trim() || undefined,
        status: gradeData.status,
      });
      toast.success('Submission evaluated and student notified!');
      setGradingSubmission(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit grade');
    } finally {
      setGradeLoading(false);
    }
  };

  if (loading) return <Loader message="Loading submissions..." />;
  if (!assignment) return <EmptyState title="Assignment not found" />;

  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch =
      !search ||
      s.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.student_email?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || s.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Back button */}
      <Link
        to="/admin/assignments"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Assignments List
      </Link>

      {/* Assignment Overview Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700">
                {assignment.class_name}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">
                {assignment.subject_name}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {assignment.title}
            </h1>
            {assignment.description && (
              <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-3xl">
                {assignment.description}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Total: {assignment.total_marks} Marks</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Due: {new Date(assignment.due_date).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Question Text & Question PDF */}
        {(assignment.question_text || assignment.question_file_url) && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-600">
              {assignment.question_text && (
                <p className="line-clamp-2 italic">"{assignment.question_text}"</p>
              )}
            </div>

            {assignment.question_file_url && (
              <Button
                variant="outline"
                size="sm"
                icon={Eye}
                onClick={() => {
                  setActivePdfUrl(assignment.question_file_url);
                  setPdfModalTitle(`Question PDF: ${assignment.title}`);
                }}
              >
                View Question PDF
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Submissions Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Student Submissions ({submissions.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluate student solution PDFs and record feedback
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-48 sm:w-60">
              <Input
                placeholder="Search student..."
                icon={Search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-36">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Completed">Completed</option>
                <option value="Late">Late</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Table of Submissions */}
        <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Submission Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Solution PDF</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                      No submissions matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                            {sub.student_name ? sub.student_name[0] : 'S'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">
                              {sub.student_name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {sub.student_email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(sub.submitted_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge size="sm">{sub.status}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        {sub.solution_file_url ? (
                          <button
                            onClick={() => {
                              setActivePdfUrl(sub.solution_file_url);
                              setPdfModalTitle(`Solution: ${sub.student_name}`);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-indigo-600 font-semibold transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" /> View PDF
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">Text response</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {sub.marks_awarded != null ? (
                          <div>
                            <span className="font-bold text-emerald-600 text-sm">
                              {sub.marks_awarded} / {assignment.total_marks}
                            </span>
                            {sub.feedback && (
                              <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                "{sub.feedback}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-amber-600 font-medium italic bg-amber-50 px-2 py-0.5 rounded-md">
                            Ungraded
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant={sub.marks_awarded != null ? 'secondary' : 'primary'}
                          size="xs"
                          onClick={() => handleOpenGrade(sub)}
                        >
                          {sub.marks_awarded != null ? 'Edit Evaluation' : 'Evaluate & Grade'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Grade / Evaluation Modal */}
      <Modal
        isOpen={Boolean(gradingSubmission)}
        onClose={() => setGradingSubmission(null)}
        title={`Grade: ${gradingSubmission?.student_name}`}
        description={`Evaluating submission for "${assignment.title}"`}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setGradingSubmission(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={gradeLoading}
              onClick={handleGradeSubmit}
            >
              Save Evaluation
            </Button>
          </>
        }
      >
        <form onSubmit={handleGradeSubmit} className="space-y-4">
          {gradingSubmission?.submission_text && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="font-bold text-slate-700 block mb-1">
                Student's Submitted Notes:
              </span>
              <p className="text-slate-600 leading-relaxed">
                {gradingSubmission.submission_text}
              </p>
            </div>
          )}

          {gradingSubmission?.solution_file_url && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Student Solution PDF</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => {
                  setActivePdfUrl(gradingSubmission.solution_file_url);
                  setPdfModalTitle(`Solution: ${gradingSubmission.student_name}`);
                }}
              >
                Inspect Solution
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={`Marks Awarded (Max ${assignment.total_marks}) *`}
              type="number"
              step="0.5"
              min="0"
              max={assignment.total_marks}
              value={gradeData.marks_awarded}
              onChange={(e) =>
                setGradeData({ ...gradeData, marks_awarded: e.target.value })
              }
              required
            />

            <Select
              label="Submission Status *"
              value={gradeData.status}
              onChange={(e) =>
                setGradeData({ ...gradeData, status: e.target.value })
              }
            >
              <option value="Completed">Completed (Reviewed)</option>
              <option value="Late">Late</option>
              <option value="Submitted">Submitted (Needs follow-up)</option>
            </Select>
          </div>

          <Textarea
            label="Feedback & Instructor Comments"
            rows={3}
            placeholder="Write constructive evaluation, rubrics feedback, or commendations..."
            value={gradeData.feedback}
            onChange={(e) =>
              setGradeData({ ...gradeData, feedback: e.target.value })
            }
          />
        </form>
      </Modal>

      {/* PDF Viewer Modal */}
      <PDFViewerModal
        isOpen={Boolean(activePdfUrl)}
        onClose={() => setActivePdfUrl(null)}
        fileUrl={activePdfUrl}
        title={pdfModalTitle}
      />
    </div>
  );
};
