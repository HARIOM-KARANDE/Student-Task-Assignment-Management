import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  FileCheck2,
  Users,
  Send,
  User,
  X,
  Layers,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();

  const adminNav = [
    { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/subjects', label: 'Subjects', icon: Layers },
    { to: '/admin/classes', label: 'Classes & Sections', icon: GraduationCap },
    { to: '/admin/assignments', label: 'Assignments', icon: BookOpen },
    { to: '/admin/submissions', label: 'Submissions', icon: FileCheck2 },
    { to: '/admin/students', label: 'Student Directory', icon: Users },
    { to: '/profile', label: 'Account Profile', icon: User },
  ];

  const studentNav = [
    { to: '/student/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/student/classes', label: 'Enrolled Classes', icon: GraduationCap },
    { to: '/student/assignments', label: 'Assignments & Tasks', icon: ClipboardList },
    { to: '/student/submissions', label: 'Submission History', icon: Send },
    { to: '/profile', label: 'Account Profile', icon: User },
  ];

  const links = isAdmin ? adminNav : studentNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 border-r border-slate-200/80 bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-100">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-slate-900">
                  Class<span className="text-indigo-600">room</span>
                </span>
                <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  Management
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-6 space-y-1">
            <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Main Menu
            </div>
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Bottom User Card in Sidebar */}
        <div className="p-4 border-t border-slate-100 m-3 rounded-2xl bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate">
                {user?.full_name}
              </p>
              <p className="text-[10px] text-slate-500 truncate capitalize">
                Role: {user?.role}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
