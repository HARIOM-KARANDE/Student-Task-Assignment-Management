import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Search, Filter, Calendar, Award, Trash2, Edit2, FileText, ArrowRight } from 'lucide-react';
import { assignmentService } from '../../services/assignmentService';
import { classService } from '../../services/classService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input, Textarea, Select } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';
import { EmptyState } from '../../components/common/EmptyState';

export const AssignmentsList = () => {
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [search, setSearch] = useState('');
  const toast = useToast();
  const navigate = useNavigate();

  // Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsg, setEditingAsg] = useState(null);
  const [formData, setFormData] = useState({
    class_id: '',
    title: '',
    description: '',
    question_text: '',
    total_marks: 100,
    due_date: '',
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Delete Modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [asgToDelete, setAsgToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [asgData, clsData] = await Promise.all([
        assignmentService.getAll({
          class_id: selectedClass || undefined,
          search: search || undefined,
        }),
        classService.getAll(),
      ]);
      setAssignments(asgData);
      setClasses(clsData);
    } catch (err) {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedClass]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenCreate = () => {
    setEditingAsg(null);
    setFormData({
      class_id: classes[0]?.id ? String(classes[0].id) : '',
      title: '',
      description: '',
      question_text: '',
      total_marks: 100,
      due_date: '',
    });
    setPdfFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e, asg) => {
    e.stopPropagation();
    setEditingAsg(asg);
    // Format date for datetime-local
    const d = new Date(asg.due_date);
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setFormData({
      class_id: String(asg.class_id),
      title: asg.title,
      description: asg.description || '',
      question_text: asg.question_text || '',
      total_marks: asg.total_marks,
      due_date: localIso,
    });
    setPdfFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.due_date) {
      toast.error('Please enter Title and Due Date');
      return;
    }

    setModalLoading(true);
    try {
      if (editingAsg) {
        await assignmentService.update(editingAsg.id, {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          question_text: formData.question_text.trim() || undefined,
          total_marks: Number(formData.total_marks),
          due_date: new Date(formData.due_date).toISOString(),
        });
        if (pdfFile) {
          await assignmentService.uploadQuestionPdf(editingAsg.id, pdfFile);
        }
        toast.success('Assignment updated successfully');
      } else {
        const newAsg = await assignmentService.create({
          class_id: Number(formData.class_id),
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          question_text: formData.question_text.trim() || undefined,
          total_marks: Number(formData.total_marks),
          due_date: new Date(formData.due_date).toISOString(),
        });
        if (pdfFile) {
          await assignmentService.uploadQuestionPdf(newAsg.id, pdfFile);
        }
        toast.success('Assignment published successfully!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save assignment');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!asgToDelete) return;
    setDeleteLoading(true);
    try {
      await assignmentService.delete(asgToDelete.id);
      toast.success('Assignment deleted');
      setIsDeleteOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to delete assignment');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Assignments & Evaluations
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create tasks, upload question PDFs, specify rubrics, and inspect submissions
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
          Create Assignment
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="w-full sm:flex-1">
          <Input
            placeholder="Search assignments by title or keyword..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-64">
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
      </div>

      {/* Assignments List */}
      {loading ? (
        <Loader message="Loading assignments..." />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No assignments found"
          description="Create problem sets or quizzes to assess student progress."
          actionLabel="Create Assignment"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((asg) => (
            <div
              key={asg.id}
              onClick={() => navigate(`/admin/assignments/${asg.id}/submissions`)}
              className="group flex flex-col justify-between p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 max-w-[170px] truncate">
                    {asg.class_name}
                  </span>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleOpenEdit(e, asg)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit Assignment"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAsgToDelete(asg);
                        setIsDeleteOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Assignment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {asg.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {asg.description || asg.question_text || 'No description provided.'}
                </p>

                {asg.question_file_url && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-600 font-medium bg-indigo-50/60 px-2.5 py-1 rounded-lg w-fit">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Question PDF Attached</span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Due {new Date(asg.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="font-bold text-slate-700">
                  {asg.submissions_count || 0} Submissions
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAsg ? 'Edit Assignment' : 'Create Assignment'}
        description="Publish instructions, deadlines, and optional question documents"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={modalLoading}
              onClick={handleSubmit}
            >
              {editingAsg ? 'Save Changes' : 'Publish Assignment'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingAsg && (
            <Select
              label="Target Class *"
              value={formData.class_id}
              onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
              required
            >
              <option value="">Select a class cohort...</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.code})
                </option>
              ))}
            </Select>
          )}

          <Input
            label="Assignment Title *"
            placeholder="e.g. Midterm Project: Sorting Algorithms Benchmark"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <Textarea
            label="Brief Summary"
            rows={2}
            placeholder="General overview for students..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <Textarea
            label="Full Question Text & Problem Statements"
            rows={3}
            placeholder="Detailed requirements, test parameters, format rules..."
            value={formData.question_text}
            onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
          />

          {/* Question PDF Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Question Document (.PDF)
            </label>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
            {pdfFile && (
              <p className="mt-1 text-xs text-emerald-600 font-medium">
                Attached: {pdfFile.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Total Marks *"
              type="number"
              min="1"
              max="1000"
              value={formData.total_marks}
              onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })}
              required
            />

            <Input
              label="Due Date & Time *"
              type="datetime-local"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Assignment"
        description={`Are you sure you want to delete "${asgToDelete?.title}"?`}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleteLoading}
              onClick={handleDelete}
            >
              Confirm Delete
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-500">
          This will delete the assignment and all student submissions affiliated with it.
        </p>
      </Modal>
    </div>
  );
};
