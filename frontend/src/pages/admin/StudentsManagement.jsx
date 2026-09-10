import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Edit2,
  Trash2,
  BookOpen,
  Send,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';
import { studentService } from '../../services/studentService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input, Textarea, Select } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';
import { EmptyState } from '../../components/common/EmptyState';
import { Badge } from '../../components/common/Badge';

export const StudentsManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const toast = useToast();

  // Student Detail Modal
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Edit Modal
  const [editingStudent, setEditingStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({ full_name: '', phone: '', bio: '' });
  const [editLoading, setEditLoading] = useState(false);

  // Delete Modal
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchStudents = async () => {
    try {
      const data = await studentService.getAll({
        search: search || undefined,
        is_active: activeFilter !== '' ? activeFilter === 'true' : undefined,
      });
      setStudents(data);
    } catch (err) {
      toast.error('Failed to load student directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [activeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleToggleStatus = async (student) => {
    try {
      const updated = await studentService.toggleStatus(student.id);
      toast.success(
        `Student "${student.full_name}" is now ${updated.is_active ? 'Active' : 'Deactivated'}`
      );
      fetchStudents();
    } catch (err) {
      toast.error('Failed to update student status');
    }
  };

  const handleViewDetail = async (studentId) => {
    setDetailLoading(true);
    try {
      const data = await studentService.getDetail(studentId);
      setSelectedStudentDetail(data);
    } catch (err) {
      toast.error('Failed to load student dossier');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setEditFormData({
      full_name: student.full_name,
      phone: student.phone || '',
      bio: student.bio || '',
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.full_name.trim()) {
      toast.error('Full Name is required');
      return;
    }
    setEditLoading(true);
    try {
      await studentService.update(editingStudent.id, editFormData);
      toast.success('Student details updated');
      setEditingStudent(null);
      fetchStudents();
    } catch (err) {
      toast.error('Failed to update student');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;
    setDeleteLoading(true);
    try {
      await studentService.delete(studentToDelete.id);
      toast.success('Student account deleted');
      setStudentToDelete(null);
      fetchStudents();
    } catch (err) {
      toast.error('Failed to delete student');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Student Directory & Accounts
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          View enrolled students, inspect individual submission records, and toggle access status
        </p>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="w-full sm:flex-1">
          <Input
            placeholder="Search student by name, email or phone..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-48">
          <Select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Deactivated Only</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loader message="Loading students..." />
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students found"
          description="Students who register will appear in this directory."
        />
      ) : (
        <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4">Registered Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {st.full_name[0]}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block text-sm">
                            {st.full_name}
                          </span>
                          <span className="text-slate-400 text-[11px]">{st.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {st.phone || <span className="text-slate-400 italic">No phone</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          st.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            st.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {st.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(st.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewDetail(st.id)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Dossier & Submissions"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(st)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Student"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(st)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            st.is_active
                              ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={st.is_active ? 'Deactivate Student' : 'Activate Student'}
                        >
                          {st.is_active ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setStudentToDelete(st)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Dossier Modal */}
      <Modal
        isOpen={Boolean(selectedStudentDetail)}
        onClose={() => setSelectedStudentDetail(null)}
        title={selectedStudentDetail?.student?.full_name}
        description="Individual profile, enrolled classes, and submission history"
        maxWidth="max-w-3xl"
        footer={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedStudentDetail(null)}
          >
            Close
          </Button>
        }
      >
        {selectedStudentDetail && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xl font-bold text-indigo-600 block">
                  {selectedStudentDetail.stats.enrolled_classes}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Classes</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xl font-bold text-slate-800 block">
                  {selectedStudentDetail.stats.total_submissions}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Submitted</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xl font-bold text-emerald-600 block">
                  {selectedStudentDetail.stats.completed_submissions}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Graded</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xl font-bold text-rose-600 block">
                  {selectedStudentDetail.stats.late_submissions}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Late</span>
              </div>
            </div>

            {/* Enrolled Classes */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Enrolled Classes ({selectedStudentDetail.classes.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedStudentDetail.classes.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs"
                  >
                    <span className="font-bold text-slate-800 block">{c.name}</span>
                    <span className="text-[10px] text-slate-400">
                      Code: {c.code} • {c.subject_name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Submissions History */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Submissions Log ({selectedStudentDetail.submissions.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedStudentDetail.submissions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No submissions made yet.</p>
                ) : (
                  selectedStudentDetail.submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 block">
                          {sub.assignment_title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {sub.class_name} • {new Date(sub.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge size="sm">{sub.status}</Badge>
                        <span className="font-bold text-slate-700">
                          {sub.marks_awarded != null ? `${sub.marks_awarded}/${sub.total_marks}` : '-'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={Boolean(editingStudent)}
        onClose={() => setEditingStudent(null)}
        title={`Edit Student: ${editingStudent?.full_name}`}
        description="Modify student profile information"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditingStudent(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={editLoading}
              onClick={handleEditSubmit}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Full Name *"
            value={editFormData.full_name}
            onChange={(e) =>
              setEditFormData({ ...editFormData, full_name: e.target.value })
            }
            required
          />

          <Input
            label="Phone Number"
            value={editFormData.phone}
            onChange={(e) =>
              setEditFormData({ ...editFormData, phone: e.target.value })
            }
          />

          <Textarea
            label="Bio"
            rows={3}
            value={editFormData.bio}
            onChange={(e) =>
              setEditFormData({ ...editFormData, bio: e.target.value })
            }
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(studentToDelete)}
        onClose={() => setStudentToDelete(null)}
        title="Delete Student Account"
        description={`Are you sure you want to remove ${studentToDelete?.full_name}?`}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStudentToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleteLoading}
              onClick={handleDelete}
            >
              Delete Account
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600">
          This will delete the student account, remove them from all enrolled classes,
          and delete all their assignment submissions.
        </p>
      </Modal>
    </div>
  );
};
