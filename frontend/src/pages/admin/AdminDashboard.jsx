import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Layers,
  GraduationCap,
  Users,
  BookOpen,
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowRight,
  Calendar,
  Award
} from 'lucide-react';
import { statsService } from '../../services/statsService';
import { StatCard } from '../../components/cards/StatCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      const data = await statsService.getAdminStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <Loader message="Loading administrator dashboard..." />;
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
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-xl shadow-indigo-950/10 relative overflow-hidden">
        <div className="relative z-10">
          <span className="px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md">
            Admin Management Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-3 text-white">
            Academic Term Overview
          </h1>
          <p className="text-indigo-200/90 text-sm mt-1 max-w-xl">
            Monitor course curriculum, active cohorts, incoming assignments, and student submission evaluations in real-time.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="relative z-10 flex flex-wrap gap-2.5">
          <Link to="/admin/classes">
            <Button variant="secondary" size="sm" icon={GraduationCap}>
              Manage Classes
            </Button>
          </Link>
          <Link to="/admin/assignments">
            <Button variant="primary" size="sm" icon={Plus}>
              Create Assignment
            </Button>
          </Link>
        </div>

        {/* Decorative background circle */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Active Subjects"
          value={stats?.total_subjects ?? 0}
          subtitle="Registered academic departments"
          icon={Layers}
          color="indigo"
        />
        <StatCard
          title="Total Classes"
          value={stats?.total_classes ?? 0}
          subtitle="Enrolled lecture sections"
          icon={GraduationCap}
          color="purple"
        />
        <StatCard
          title="Total Students"
          value={stats?.total_students ?? 0}
          subtitle="Active student directory"
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Assignments Created"
          value={stats?.total_assignments ?? 0}
          subtitle="Course problem sets & labs"
          icon={BookOpen}
          color="amber"
        />
      </div>

      {/* Secondary Review Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Submissions
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {stats?.total_submissions ?? 0}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Grading
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {stats?.pending_reviews ?? 0}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Grading Rate
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {stats?.completion_rate ?? 0}%
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Submissions & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Recent Submissions Table */}
        <div className="lg:col-span-2 rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Recent Student Submissions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest assignments submitted by students across all classes
              </p>
            </div>
            <Link
              to="/admin/submissions"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Assignment</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Score</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!stats?.recent_submissions || stats.recent_submissions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                      No submissions recorded yet.
                    </td>
                  </tr>
                ) : (
                  stats.recent_submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                            {sub.student_name[0]}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 block">
                              {sub.student_name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {sub.class_name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700 max-w-[180px] truncate">
                        {sub.assignment_title}
                      </td>
                      <td className="px-6 py-4">
                        <Badge size="sm">{sub.status}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        {sub.marks_awarded != null ? (
                          <span className="font-bold text-emerald-600">
                            {sub.marks_awarded}/{sub.total_marks}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium italic">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/admin/assignments/${sub.assignment_id}/submissions`}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Upcoming Deadlines */}
        <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Upcoming Deadlines
              </h2>
              <Link
                to="/admin/assignments"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                All Tasks
              </Link>
            </div>

            <div className="space-y-4">
              {!stats?.upcoming_deadlines || stats.upcoming_deadlines.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No upcoming deadlines currently scheduled.
                </p>
              ) : (
                stats.upcoming_deadlines.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/admin/assignments/${item.id}/submissions`)}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/40 border border-slate-100 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {item.title}
                      </h4>
                      <span className="text-[11px] font-semibold text-indigo-600 shrink-0">
                        {item.total_marks} pts
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                      <span className="truncate max-w-[140px]">{item.class_name}</span>
                      <span className="font-medium text-slate-600">
                        {formatDeadline(item.due_date)}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span>
                        {item.submissions_count} / {item.total_enrolled} Submitted
                      </span>
                      <span className="font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center">
                        Details &rarr;
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link to="/admin/assignments">
              <Button variant="outline" size="sm" className="w-full" icon={Plus}>
                Create New Assignment
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
