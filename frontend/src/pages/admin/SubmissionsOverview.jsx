import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Search,
  Filter,
  Eye,
  FileText,
  Clock,
  Award,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { submissionService } from '../../services/submissionService';
import { classService } from '../../services/classService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input, Textarea, Select } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';
import { EmptyState } from '../../components/common/EmptyState';
import { Badge } from '../../components/common/Badge';
import { PDFViewerModal } from '../../components/common/PDFViewerModal';

export const SubmissionsOverview = () => {
  const [submissions, setSubmissions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const toast = useToast();

  // PDF Preview
  const [activePdfUrl, setActivePdfUrl] = useState(null);
  const [pdfTitle, setPdfTitle] = useState('');

  // Grading Modal
  const [gradingSub, setGradingSub] = useState(null);
  const [gradeData, setGradeData] = useState({
    marks_awarded: '',
    feedback: '',
    status: 'Completed',
  });
  const [gradeLoading, setGradeLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [subsData, classesData] = await Promise.all([
        submissionService.getAll({
          class_id: selectedClass || undefined,
          status_filter: statusFilter || undefined,
          search: search || undefined,
        }),
        classService.getAll(),
      ]);
      setSubmissions(subsData);
      setClasses(classesData);
    } catch (err) {
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedClass, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenGrade = (sub) => {
    setGradingSub(sub);
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
    const maxMarks = gradingSub?.total_marks || 100;
    if (marksNum > maxMarks) {
      toast.error(`Marks cannot exceed total marks (${maxMarks})`);
      return;
    }

    setGradeLoading(true);
    try {
      await submissionService.grade(gradingSub.id, {
        marks_awarded: marksNum,
        feedback: gradeData.feedback.trim() || undefined,
        status: gradeData.status,
      });
      toast.success('Evaluation saved successfully');
      setGradingSub(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit grade');
    } finally {
      setGradeLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Submissions Directory
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Comprehensive log of all student work submissions, reviews, and grading statuses
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="w-full md:flex-1">
          <Input
            placeholder="Search by student name, email or task..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-full md:w-56">
          <Select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.code})
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full md:w-44">
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

      {/* Table */}
      {loading ? (
        <Loader message="Loading submissions..." />
      ) : submissions.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No submissions found"
          description="Submissions will appear here once students upload and turn in their assignments."
        />
      ) : (
        <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Assignment / Class</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Solution PDF</th>
                  <th className="px-6 py-4">Grade</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => (
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
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800 block max-w-xs truncate">
                        {sub.assignment_title}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {sub.class_name} • {sub.subject_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge size="sm">{sub.status}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      {sub.solution_file_url ? (
                        <button
                          onClick={() => {
                            setActivePdfUrl(sub.solution_file_url);
                            setPdfTitle(`Solution: ${sub.student_name}`);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-indigo-600 font-semibold transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" /> PDF
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">Text response</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {sub.marks_awarded != null ? (
                        <span className="font-bold text-emerald-600 text-sm">
                          {sub.marks_awarded}/{sub.total_marks || 100}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium italic">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant={sub.marks_awarded != null ? 'secondary' : 'primary'}
                        size="xs"
                        onClick={() => handleOpenGrade(sub)}
                      >
                        {sub.marks_awarded != null ? 'Edit Grade' : 'Grade'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      <Modal
        isOpen={Boolean(gradingSub)}
        onClose={() => setGradingSub(null)}
        title={`Evaluate: ${gradingSub?.student_name}`}
        description={`Task: ${gradingSub?.assignment_title}`}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setGradingSub(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={gradeLoading}
              onClick={handleGradeSubmit}
            >
              Save Grade
            </Button>
          </>
        }
      >
        <form onSubmit={handleGradeSubmit} className="space-y-4">
          {gradingSub?.submission_text && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="font-bold text-slate-700 block mb-1">
                Student Notes:
              </span>
              <p className="text-slate-600">{gradingSub.submission_text}</p>
            </div>
          )}

          {gradingSub?.solution_file_url && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Uploaded Solution File</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => {
                  setActivePdfUrl(gradingSub.solution_file_url);
                  setPdfTitle(`Solution: ${gradingSub.student_name}`);
                }}
              >
                View PDF
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={`Marks (Max ${gradingSub?.total_marks || 100}) *`}
              type="number"
              step="0.5"
              min="0"
              max={gradingSub?.total_marks || 100}
              value={gradeData.marks_awarded}
              onChange={(e) =>
                setGradeData({ ...gradeData, marks_awarded: e.target.value })
              }
              required
            />

            <Select
              label="Evaluation Status"
              value={gradeData.status}
              onChange={(e) =>
                setGradeData({ ...gradeData, status: e.target.value })
              }
            >
              <option value="Completed">Completed</option>
              <option value="Late">Late</option>
              <option value="Submitted">Submitted</option>
            </Select>
          </div>

          <Textarea
            label="Feedback Comments"
            rows={3}
            placeholder="Feedback for the student..."
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
        title={pdfTitle}
      />
    </div>
  );
};
