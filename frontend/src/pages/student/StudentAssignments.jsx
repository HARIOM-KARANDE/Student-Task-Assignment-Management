import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Search, Filter, Calendar, Award } from 'lucide-react';
import { assignmentService } from '../../services/assignmentService';
import { useToast } from '../../context/ToastContext';
import { AssignmentCard } from '../../components/cards/AssignmentCard';
import { Input } from '../../components/common/Input';
import { Loader } from '../../components/common/Loader';
import { EmptyState } from '../../components/common/EmptyState';

export const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('all'); // 'all', 'pending', 'submitted', 'completed', 'late'
  const toast = useToast();
  const navigate = useNavigate();

  const fetchAssignments = async () => {
    try {
      const data = await assignmentService.getAll({
        search: search || undefined,
        status_filter: statusTab !== 'all' ? statusTab : undefined,
      });
      setAssignments(data);
    } catch (err) {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [statusTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssignments();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const tabs = [
    { id: 'all', label: 'All Assignments' },
    { id: 'pending', label: 'Pending' },
    { id: 'submitted', label: 'Submitted' },
    { id: 'completed', label: 'Graded / Completed' },
    { id: 'late', label: 'Late / Overdue' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Assignments & Tasks
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          View all homework, problem sets, and lab evaluations from your enrolled classes
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl overflow-x-auto w-full sm:w-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setStatusTab(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusTab === t.id
                  ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search assignments..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <Loader message="Loading assignments..." />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments found"
          description={
            statusTab === 'all'
              ? 'No assignments currently posted in your enrolled classes.'
              : `No assignments currently marked as "${statusTab}".`
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((asg) => (
            <AssignmentCard
              key={asg.id}
              assignment={asg}
              isStudent={true}
              onClick={() => navigate(`/student/assignments/${asg.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
