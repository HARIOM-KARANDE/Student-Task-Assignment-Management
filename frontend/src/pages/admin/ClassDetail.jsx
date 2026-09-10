import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  Copy,
  Check,
  Plus,
  UserPlus,
  Trash2,
  Edit2,
  FileText,
  Clock,
  ArrowLeft,
  Mail,
  AlertCircle
} from 'lucide-react';
import { classService } from '../../services/classService';
import { assignmentService } from '../../services/assignmentService';
import { studentService } from '../../services/studentService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input, Textarea, Select } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';
import { EmptyState } from '../../components/common/EmptyState';
import { Badge } from '../../components/common/Badge';

export const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [classObj, setClassObj] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' or 'students'
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Add student modal
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState('');
  const [addStudentLoading, setAddStudentLoading] = useState(false);

  // New assignment modal
  const [isCreateAsgOpen, setIsCreateAsgOpen] = useState(false);
  const [asgFormData, setAsgFormData] = useState({
    title: '',
    description: '',
    question_text: '',
    total_marks: 100,
    due_date: '',
  });
  const [asgFile, setAsgFile] = useState(null);
  const [asgLoading, setAsgLoading] = useState(false);

  const fetchClassDetails = async () => {
    try {
      const [cData, aData, sData, allSData] = await Promise.all([
        classService.getById(id),
        assignmentService.getAll({ class_id: id }),
        classService.getStudents(id),
        studentService.getAll({ is_active: true }),
      ]);
      setClassObj(cData);
      setAssignments(aData);
      setStudents(sData);
      setAllStudents(allSData);
    } catch (err) {
      toast.error('Failed to load class information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassDetails();
  }, [id]);

  const handleCopyCode = () => {
    if (!classObj?.code) return;
    navigator.clipboard.writeText(classObj.code);
    setCopied(true);
    toast.success('Class code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddStudent = async () => {
    if (!selectedStudentToAdd) {
      toast.error('Please select a student');
      return;
    }
    setAddStudentLoading(true);
    try {
      await classService.addStudent(id, selectedStudentToAdd);
      toast.success('Student enrolled successfully');
      setIsAddStudentOpen(false);
      setSelectedStudentToAdd('');
      fetchClassDetails();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to enroll student');
    } finally {
      setAddStudentLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove ${studentName} from this class?`)) {
      return;
    }
    try {
      await classService.removeStudent(id, studentId);
      toast.success('Student removed from class');
      fetchClassDetails();
    } catch (err) {
      toast.error('Failed to remove student');
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!asgFormData.title || !asgFormData.due_date) {
      toast.error('Please provide Title and Due Date');
      return;
    }

    setAsgLoading(true);
    try {
      const newAsg = await assignmentService.create({
        class_id: Number(id),
        title: asgFormData.title.trim(),
        description: asgFormData.description.trim() || undefined,
        question_text: asgFormData.question_text.trim() || undefined,
        total_marks: Number(asgFormData.total_marks),
        due_date: new Date(asgFormData.due_date).toISOString(),
      });

      // If PDF attached, upload it
      if (asgFile) {
        await assignmentService.uploadQuestionPdf(newAsg.id, asgFile);
      }

      toast.success('Assignment created & published to students!');
      setIsCreateAsgOpen(false);
      setAsgFormData({
        title: '',
        description: '',
        question_text: '',
        total_marks: 100,
        due_date: '',
      });
      setAsgFile(null);
      fetchClassDetails();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create assignment');
    } finally {
      setAsgLoading(false);
    }
  };

  if (loading) return <Loader message="Loading class details..." />;
  if (!classObj) return <EmptyState title="Class not found" />;

  // Filter out students already enrolled
  const enrolledStudentIds = new Set(students.map((s) => s.student_id));
  const availableStudents = allStudents.filter((s) => !enrolledStudentIds.has(s.id));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Back button */}
      <Link
        to="/admin/classes"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to All Classes
      </Link>

      {/* Class Banner Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-bold tracking-wide uppercase bg-white/20 backdrop-blur-md rounded-full">
                {classObj.subject_code || 'COURSE'}
              </span>
              <span className="text-xs text-white/80">
                {classObj.subject_name}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {classObj.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-white/80 pt-2">
              {classObj.section && <span>Section: {classObj.section}</span>}
              <span>•</span>
              {classObj.semester && <span>Semester: {classObj.semester}</span>}
              {classObj.schedule && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {classObj.schedule}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Class Code Box */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <div>
              <span className="block text-[11px] font-semibold text-white/70 uppercase">
                Student Join Code
              </span>
              <span className="font-mono text-2xl font-bold tracking-widest text-white">
                {classObj.code}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 transition-all font-semibold text-xs flex items-center gap-1.5 shadow-sm"
              title="Copy Code"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'assignments'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Assignments ({assignments.length})
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'students'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Enrolled Students ({students.length} / {classObj.max_students})
        </button>
      </div>

      {/* Tab 1: Assignments */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Class Assignments & Tasks
            </h3>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsCreateAsgOpen(true)}
            >
              New Assignment
            </Button>
          </div>

          {assignments.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No assignments posted yet"
              description="Create homework, quizzes, and problem sets with optional question PDFs."
              actionLabel="Create Assignment"
              onAction={() => setIsCreateAsgOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((asg) => (
                <div
                  key={asg.id}
                  onClick={() => navigate(`/admin/assignments/${asg.id}/submissions`)}
                  className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                        {asg.total_marks} Marks
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {asg.submissions_count || 0} Submissions
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {asg.title}
                    </h4>

                    {asg.description && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                        {asg.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Due {new Date(asg.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-indigo-600 font-semibold group-hover:translate-x-1 transition-transform">
                      View Submissions &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Students Roster */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Enrolled Class Roster
              </h3>
              <p className="text-xs text-slate-500">
                Capacity: {students.length} of {classObj.max_students} students
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={UserPlus}
              onClick={() => setIsAddStudentOpen(true)}
            >
              Add Student
            </Button>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Enrolled Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                      No students currently enrolled. Share class code <strong>{classObj.code}</strong> with students.
                    </td>
                  </tr>
                ) : (
                  students.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                            {item.student?.full_name ? item.student.full_name[0] : 'S'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">
                              {item.student?.full_name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ID: #{item.student_id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {item.student?.email}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(item.joined_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemoveStudent(item.student_id, item.student?.full_name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove from class"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      <Modal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        title="Enroll Student in Class"
        description={`Add a student from the registered directory to ${classObj.name}`}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddStudentOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={addStudentLoading}
              onClick={handleAddStudent}
            >
              Enroll Student
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Select Registered Student *"
            value={selectedStudentToAdd}
            onChange={(e) => setSelectedStudentToAdd(e.target.value)}
          >
            <option value="">Choose a student...</option>
            {availableStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name} ({s.email})
              </option>
            ))}
          </Select>
          {availableStudents.length === 0 && (
            <p className="text-xs text-amber-600">
              All active registered students are already enrolled in this class.
            </p>
          )}
        </div>
      </Modal>

      {/* Create Assignment Modal */}
      <Modal
        isOpen={isCreateAsgOpen}
        onClose={() => setIsCreateAsgOpen(false)}
        title="Create New Assignment"
        description={`Post homework or lab task for ${classObj.name}`}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCreateAsgOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={asgLoading}
              onClick={handleCreateAssignment}
            >
              Publish Assignment
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <Input
            label="Assignment Title *"
            placeholder="e.g. Lab 4: Binary Trees & Heaps"
            value={asgFormData.title}
            onChange={(e) =>
              setAsgFormData({ ...asgFormData, title: e.target.value })
            }
            required
          />

          <Textarea
            label="Summary / Instructions"
            rows={2}
            placeholder="Brief overview of expectations and objectives..."
            value={asgFormData.description}
            onChange={(e) =>
              setAsgFormData({ ...asgFormData, description: e.target.value })
            }
          />

          <Textarea
            label="Question Text & Problem Description"
            rows={3}
            placeholder="Write out the problem statement or requirements..."
            value={asgFormData.question_text}
            onChange={(e) =>
              setAsgFormData({ ...asgFormData, question_text: e.target.value })
            }
          />

          {/* Question PDF upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Upload Question PDF (Optional)
            </label>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setAsgFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
            {asgFile && (
              <p className="mt-1 text-xs text-emerald-600 font-medium">
                Selected: {asgFile.name} ({(asgFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Maximum Marks *"
              type="number"
              min="1"
              max="1000"
              value={asgFormData.total_marks}
              onChange={(e) =>
                setAsgFormData({ ...asgFormData, total_marks: e.target.value })
              }
              required
            />

            <Input
              label="Due Date & Time *"
              type="datetime-local"
              value={asgFormData.due_date}
              onChange={(e) =>
                setAsgFormData({ ...asgFormData, due_date: e.target.value })
              }
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
