import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  Clock,
  Award,
  LogOut,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { classService } from '../../services/classService';
import { assignmentService } from '../../services/assignmentService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Loader } from '../../components/common/Loader';
import { EmptyState } from '../../components/common/EmptyState';
import { AssignmentCard } from '../../components/cards/AssignmentCard';

export const StudentClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [classObj, setClassObj] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' or 'classmates'
  const [loading, setLoading] = useState(true);

  const fetchClassDetails = async () => {
    try {
      const [cData, aData, sData] = await Promise.all([
        classService.getById(id),
        assignmentService.getAll({ class_id: id }),
        classService.getStudents(id),
      ]);
      setClassObj(cData);
      setAssignments(aData);
      setStudents(sData);
    } catch (err) {
      toast.error('Failed to load class information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassDetails();
  }, [id]);

  const handleLeaveClass = async () => {
    if (!window.confirm(`Are you sure you want to unenroll from "${classObj.name}"?`)) {
      return;
    }
    try {
      await classService.leaveClass(id);
      toast.success('You have left the class');
      navigate('/student/classes');
    } catch (err) {
      toast.error('Failed to leave class');
    }
  };

  if (loading) return <Loader message="Loading class..." />;
  if (!classObj) return <EmptyState title="Class not found" />;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Back button */}
      <Link
        to="/student/classes"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Classes
      </Link>

      {/* Class Banner */}
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
              {classObj.section && <span>Section {classObj.section}</span>}
              <span>•</span>
              {classObj.semester && <span>{classObj.semester}</span>}
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

          <button
            onClick={handleLeaveClass}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white/10 hover:bg-rose-500/20 text-white/90 hover:text-rose-200 transition-colors border border-white/20 self-start"
          >
            <LogOut className="w-3.5 h-3.5" /> Unenroll
          </button>
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
          <BookOpen className="w-4 h-4" /> Coursework & Tasks ({assignments.length})
        </button>

        <button
          onClick={() => setActiveTab('classmates')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'classmates'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Classmates ({students.length})
        </button>
      </div>

      {/* Tab 1: Assignments */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No assignments posted yet"
              description="Your instructor hasn't posted any assignments for this class."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      )}

      {/* Tab 2: Classmates */}
      {activeTab === 'classmates' && (
        <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">
            Enrolled Students in {classObj.name}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {students.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                  {item.student?.full_name ? item.student.full_name[0] : 'S'}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-slate-800 block truncate">
                    {item.student?.full_name}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {item.student?.email}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
