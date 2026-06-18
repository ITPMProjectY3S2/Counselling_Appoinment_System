import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import AdminCounselors from './pages/AdminCounselors';
import AdminSpecialties from './pages/AdminSpecialties';
import AdminUsers from './pages/AdminUsers';
import AdminAppointments from './pages/AdminAppointments';
import CounselorDashboard from './pages/CounselorDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ReportsDashboard from './pages/admin/analytics/ReportsDashboard';
import CounselorPerformance from './pages/admin/analytics/CounselorPerformance';
import FeedbackReports from './pages/admin/analytics/FeedbackReports';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin-counselors" element={<AdminCounselors />} />
            <Route path="/admin-specialties" element={<AdminSpecialties />} />
            <Route path="/admin-users" element={<AdminUsers />} />
            <Route path="/admin-appointments" element={<AdminAppointments />} />
            <Route path="/admin/reports" element={<ReportsDashboard />} />
            <Route path="/admin/performance" element={<CounselorPerformance />} />
            <Route path="/admin/feedback-reports" element={<FeedbackReports />} />
          </Route>

          {/* Protected Counselor Routes */}
          <Route element={<ProtectedRoute allowedRoles={['counselor', 'admin']} />}>
            <Route path="/counselor-dashboard" element={<CounselorDashboard />} />
          </Route>

          {/* Protected Student Routes */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/student-dashboard" element={<StudentDashboard />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
