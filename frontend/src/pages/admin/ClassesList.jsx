import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Plus, Search, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { classService } from '../../services/classService';
import { subjectService } from '../../services/subjectService';
import { useToast } from '../../context/ToastContext';
import { ClassCard } from '../../components/cards/ClassCard';
import { Button } from '../../components/common/Button';
import { Input, Select } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';
import { EmptyState } from '../../components/common/EmptyState';

export const ClassesList = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [search, setSearch] = useState('');
  const toast = useToast();
  const navigate = useNavigate();

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [codeGenLoading, setCodeGenLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject_id: '',
    name: '',
    section: 'A',
    code: '',
    semester: 'Fall 2026',
    schedule: '',
    max_students: 50,
  });

  const fetchData = async () => {
    try {
      const [classesData, subjectsData] = await Promise.all([
        classService.getAll({
          subject_id: selectedSubject || undefined,
          search: search || undefined,
        }),
        subjectService.getAll(),
      ]);
      setClasses(classesData);
      setSubjects(subjectsData);
    } catch (err) {
      toast.error('Failed to load classes and subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSubject]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenCreate = async () => {
    let initialCode = '';
    try {
      const res = await classService.generateCode();
      initialCode = res.code;
    } catch (err) {
      initialCode = 'CLASS-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    }

    setFormData({
      subject_id: subjects[0]?.id ? String(subjects[0].id) : '',
      name: '',
      section: 'A',
      code: initialCode,
      semester: 'Fall 2026',
      schedule: 'Mon & Wed 10:00 AM - 11:30 AM',
      max_students: 50,
    });
    setIsCreateOpen(true);
  };

  const handleRegenerateCode = async () => {
    setCodeGenLoading(true);
    try {
      const res = await classService.generateCode();
      setFormData((prev) => ({ ...prev, code: res.code }));
      toast.info(`Generated new class code: ${res.code}`);
    } catch (err) {
      toast.error('Failed to auto-generate code');
    } finally {
      setCodeGenLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject_id || !formData.name.trim() || !formData.code.trim()) {
      toast.error('Please fill in Subject, Class Name, and Code');
      return;
    }

    setCreateLoading(true);
    try {
      await classService.create({
        ...formData,
        subject_id: Number(formData.subject_id),
        max_students: Number(formData.max_students),
      });
      toast.success(`Class "${formData.name}" created successfully!`);
      setIsCreateOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create class');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Classes & Lecture Cohorts
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage course sections, generate unique student enrollment codes, and track rosters
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenCreate}>
          Create Class
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="w-full sm:flex-1">
          <Input
            placeholder="Search class by name, code or section..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-64">
          <Select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">All Subjects & Disciplines</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name} ({sub.code})
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Classes Grid */}
      {loading ? (
        <Loader message="Loading classes..." />
      ) : classes.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No classes available"
          description="Create a class section under any subject and share the code with students."
          actionLabel="Create Class"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <ClassCard
              key={cls.id}
              classData={cls}
              isAdmin={true}
              onOpen={() => navigate(`/admin/classes/${cls.id}`)}
            />
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Class"
        description="Configure class cohort details and invite code"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={createLoading}
              onClick={handleCreateSubmit}
            >
              Publish Class
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Select
            label="Academic Subject *"
            value={formData.subject_id}
            onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
            required
          >
            <option value="">Select a subject...</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </Select>

          <Input
            label="Class Title *"
            placeholder="e.g. CS 101 - Introductory Programming"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Section / Cohort"
              placeholder="e.g. A, Morning, or Lab 2"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
            />

            <Input
              label="Semester / Term"
              placeholder="e.g. Fall 2026"
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
            />
          </div>

          {/* Code with Generator button */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Class Join Code *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="block w-full font-mono uppercase tracking-wider rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-indigo-700 font-bold bg-indigo-50/40 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                required
              />
              <Button
                type="button"
                variant="secondary"
                size="md"
                icon={RefreshCw}
                loading={codeGenLoading}
                onClick={handleRegenerateCode}
                title="Generate new unique code"
              >
                Generate
              </Button>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Students will enter this unique code to self-enroll in this class.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Weekly Schedule"
              placeholder="e.g. Mon & Wed 10:00 AM"
              value={formData.schedule}
              onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
            />

            <Input
              label="Max Student Capacity"
              type="number"
              min="1"
              max="500"
              value={formData.max_students}
              onChange={(e) => setFormData({ ...formData, max_students: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
