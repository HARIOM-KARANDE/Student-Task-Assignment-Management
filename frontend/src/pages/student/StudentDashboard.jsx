import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  ClipboardList,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  Award,
  Calendar,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { statsService } from '../../services/statsService';
import { classService } from '../../services/classService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatCard } from '../../components/cards/StatCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Loader } from '../../components/common/Loader';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      const data = await statsService.getStudentStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load student stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleJoinClass = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      toast.error('Please enter a class code');
      return;
    }

    setJoinLoading(true);
    try {
      const joinedClass = await classService.joinClass(joinCode.trim());
      toast.success(`Enrolled in "${joinedClass.name}" successfully!`);
      setIsJoinOpen(false);
      setJoinCode('');
      fetchStats();
      navigate(`/student/classes/${joinedClass.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid or expired class code');
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) {
    return <Loader message="Loading student workspace..." />;
  }

  const formatDeadline = (iso) => {
    if (!iso) return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Student Hero Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 text-white shadow-xl shadow-indigo-900/10 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/20 backdrop-blur-md">
              Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Your Academic Workspace
          </h1>
          <p className="text-indigo-100/90 text-sm max-w-lg">
            Track your coursework, download assignments, upload solution PDFs, and check instructor evaluations.
          </p>
        </div>

        {/* Join Class Quick Action */}
        <div className="relative z-10 flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            icon={Plus}
            onClick={() => setIsJoinOpen(true)}
            className="shadow-lg"
          >
            Join Class with Code
          </Button>
        </div>

        {/* Decorative ambient circle */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Enrolled Classes"
          value={stats?.enrolled_classes_count ?? 0}
          subtitle="Joined courses this semester"
          icon={GraduationCap}
          color="indigo"
        />
        <StatCard
          title="Pending Tasks"
          value={stats?.pending_assignments_count ?? 0}
          subtitle="Awaiting your solution"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Completed & Graded"
          value={stats?.completed_assignments_count ?? 0}
          subtitle="Reviewed submissions"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Overdue / Late"
          value={stats?.late_submissions_count ?? 0}
          subtitle="Tasks needing attention"
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Two Column Layout: Upcoming Deadlines & Recent Submissions Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upcoming Assignment Deadlines */}
        <div className="lg:col-span-2 rounded-3xl bg-white border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Upcoming Assignment Deadlines
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tasks from your joined classes due in the upcoming days
              </p>
            </div>
            <Link
              to="/student/assignments"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              All Tasks <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {!stats?.upcoming_deadlines || stats.upcoming_deadlines.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400/80" />
                <p className="text-sm font-semibold text-slate-700">All caught up!</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  No upcoming assignment deadlines scheduled at this time.
                </p>
              </div>
            ) : (
              stats.upcoming_deadlines.map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate(`/student/assignments/${task.id}`)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/40 border border-slate-100 transition-all cursor-pointer group gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-100/70 text-indigo-700">
                        {task.class_name}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {task.total_marks} Marks
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {task.title}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDeadline(task.due_date)}</span>
                    </div>
                    <Badge size="sm">
                      {task.is_submitted ? 'Submitted' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Recent Evaluation Activity */}
        <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Recent Grades & Feedback
              </h2>
              <Link
                to="/student/submissions"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                History
              </Link>
            </div>

            <div className="space-y-3">
              {!stats?.recent_activity || stats.recent_activity.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center italic">
                  No submissions graded yet.
                </p>
              ) : (
                stats.recent_activity.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {sub.title}
                      </h4>
                      <Badge size="sm">{sub.status}</Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500">{sub.class_name}</span>
                      {sub.marks_awarded != null ? (
                        <span className="font-bold text-emerald-600">
                          {sub.marks_awarded} / {sub.total_marks}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Ungraded</span>
                      )}
                    </div>

                    {sub.feedback && (
                      <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100 italic">
                        "{sub.feedback}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link to="/student/classes">
              <Button variant="outline" size="sm" className="w-full" icon={GraduationCap}>
                View All Enrolled Classes
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Join Class Modal */}
      <Modal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        title="Join Class with Code"
        description="Enter the unique code provided by your course instructor"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsJoinOpen(false)}>
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
            helperText="Enter the 6-8 character uppercase code provided by your instructor"
          />
        </form>
      </Modal>
    </div>
  );
};
