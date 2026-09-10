import React, { useState, useEffect } from 'react';
import { Layers, Plus, Search, Edit2, Trash2, BookOpen, AlertCircle } from 'lucide-react';
import { subjectService } from '../../services/subjectService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input, Textarea } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';
import { EmptyState } from '../../components/common/EmptyState';

export const SubjectsList = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const toast = useToast();

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [modalLoading, setModalLoading] = useState(false);

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSubjects = async () => {
    try {
      const data = await subjectService.getAll(search);
      setSubjects(data);
    } catch (err) {
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubjects();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenCreate = () => {
    setEditingSubject(null);
    setFormData({ name: '', code: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Subject Name and Code are required');
      return;
    }

    setModalLoading(true);
    try {
      if (editingSubject) {
        await subjectService.update(editingSubject.id, formData);
        toast.success(`Subject "${formData.name}" updated successfully`);
      } else {
        await subjectService.create(formData);
        toast.success(`Subject "${formData.name}" created successfully`);
      }
      setIsModalOpen(false);
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save subject');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!subjectToDelete) return;
    setDeleteLoading(true);
    try {
      await subjectService.delete(subjectToDelete.id);
      toast.success('Subject and affiliated classes deleted');
      setIsDeleteOpen(false);
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete subject');
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
            Subjects & Curriculum
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Define academic disciplines and courses offered by your institution
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
          Add Subject
        </Button>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <Input
          placeholder="Search subjects by title or code..."
          icon={Search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Subjects Grid */}
      {loading ? (
        <Loader message="Loading academic subjects..." />
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No subjects found"
          description="Create your first academic subject to begin organizing classes and assignments."
          actionLabel="Add Subject"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="group flex flex-col justify-between p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all duration-200"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="px-2.5 py-1 text-xs font-bold font-mono tracking-wider bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
                    {sub.code}
                  </span>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(sub)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit Subject"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSubjectToDelete(sub);
                        setIsDeleteOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {sub.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-3 leading-relaxed">
                  {sub.description || 'No detailed course description provided.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  <strong className="font-semibold text-slate-700">{sub.classes_count}</strong> active classes
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ID: #{sub.id}
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
        title={editingSubject ? 'Edit Subject' : 'Add New Subject'}
        description="Subjects serve as the parent categories for class cohorts and syllabi."
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
              {editingSubject ? 'Update Subject' : 'Create Subject'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Subject Title *"
            placeholder="e.g. Distributed Database Systems"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Subject Code *"
            placeholder="e.g. CS-401"
            value={formData.code}
            onChange={(e) =>
              setFormData({ ...formData, code: e.target.value.toUpperCase() })
            }
            required
            helperText="Uppercase unique identifier code for the discipline"
          />

          <Textarea
            label="Description"
            rows={3}
            placeholder="Overview of core competencies, scope, and objectives..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Subject"
        description="Are you sure you want to permanently remove this subject?"
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
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 text-rose-800 text-xs leading-relaxed">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p>
            Warning: Deleting <strong>{subjectToDelete?.name}</strong> will also remove
            associated classes, enrollments, and assignments linked to this subject.
          </p>
        </div>
      </Modal>
    </div>
  );
};
