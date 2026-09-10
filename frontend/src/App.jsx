import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Loader } from './components/common/Loader';
import { AppLayout } from './components/layout/AppLayout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Profile } from './pages/Profile';
import { NotFound } from './pages/NotFound';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { SubjectsList } from './pages/admin/SubjectsList';
import { ClassesList } from './pages/admin/ClassesList';
import { ClassDetail } from './pages/admin/ClassDetail';
import { AssignmentsList } from './pages/admin/AssignmentsList';
import { AssignmentDetailSubmissions } from './pages/admin/AssignmentDetailSubmissions';
import { SubmissionsOverview } from './pages/admin/SubmissionsOverview';
import { StudentsManagement } from './pages/admin/StudentsManagement';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { JoinedClasses } from './pages/student/JoinedClasses';
import { StudentClassDetail } from './pages/student/StudentClassDetail';
import { StudentAssignments } from './pages/student/StudentAssignments';
import { StudentAssignmentDetail } from './pages/student/StudentAssignmentDetail';
import { StudentSubmissionHistory } from './pages/student/StudentSubmissionHistory';

// Role Guard Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader message="Verifying authorization..." fullScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If wrong role, redirect to respective dashboard
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  }

  return children;
};

// Root redirector based on user role
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader message="Starting portal..." fullScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
};

export default function App() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Root Router */}
      <Route path="/" element={<RootRedirect />} />

      {/* Protected Master Layout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Shared Account Profile */}
        <Route path="/profile" element={<Profile />} />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/subjects"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SubjectsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/classes"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ClassesList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/classes/:id"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ClassDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/assignments"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AssignmentsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/assignments/:id/submissions"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AssignmentDetailSubmissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/submissions"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SubmissionsOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <StudentsManagement />
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/classes"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <JoinedClasses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/classes/:id"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentClassDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/assignments"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentAssignments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/assignments/:id"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentAssignmentDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/submissions"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentSubmissionHistory />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
