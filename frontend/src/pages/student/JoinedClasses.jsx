import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Plus, Search } from 'lucide-react';
import { classService } from '../../services/classService';
import { useToast } from '../../context/ToastContext';
import { ClassCard } from '../../components/cards/ClassCard';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';
import { EmptyState } from '../../components/common/EmptyState';

export const JoinedClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  const fetchClasses = async () => {
    try {
      const data = await classService.getAll({ search: search || undefined });
      setClasses(data);
    } catch (err) {
      toast.error('Failed to load your classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClasses();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleJoinClass = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      toast.error('Please enter a class code');
      return;
    }

    setJoinLoading(true);
    try {
      const joined = await classService.joinClass(joinCode.trim());
      toast.success(`Enrolled in "${joined.name}" successfully!`);
      setIsJoinOpen(false);
      setJoinCode('');
      fetchClasses();
      navigate(`/student/classes/${joined.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid class code');
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            My Enrolled Classes
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Active courses, lectures, and sections you are currently registered in
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setIsJoinOpen(true)}
        >
          Join Class with Code
        </Button>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <Input
          placeholder="Search enrolled classes by name or code..."
          icon={Search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Classes Grid */}
      {loading ? (
        <Loader message="Loading your enrolled classes..." />
      ) : classes.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No classes enrolled yet"
          description="Use your instructor's class code to join a lecture cohort."
          actionLabel="Join Class"
          onAction={() => setIsJoinOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <ClassCard
              key={cls.id}
              classData={cls}
              isAdmin={false}
              onOpen={() => navigate(`/student/classes/${cls.id}`)}
            />
          ))}
        </div>
      )}

      {/* Join Class Modal */}
      <Modal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        title="Join Class with Code"
        description="Enter the unique code provided by your instructor"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsJoinOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={joinLoading}
              onClick={handleJoinClass}
            >
              Join Class
            </Button>
          </>
        }
      >
        <form onSubmit={handleJoinClass} className="space-y-4">
          <Input
            label="Class Join Code *"
            placeholder="e.g. CS101-A"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            required
            helperText="Enter the 6-8 character uppercase code provided by your teacher"
          />
        </form>
      </Modal>
    </div>
  );
};
