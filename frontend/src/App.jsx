import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import CounselorDashboard from './pages/CounselorDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminCounselors from './pages/AdminCounselors';
import AdminSpecialties from './pages/AdminSpecialties';
import AdminUsers from './pages/AdminUsers';
import AdminAppointments from './pages/AdminAppointments';

// Analytics & Admin Module
import AdminLayout from './layouts/AdminLayout';
import ReportsDashboard from './pages/analytics/ReportsDashboard';
import FeedbackReports from './pages/analytics/FeedbackReports';
import CounselorPerformance from './pages/analytics/CounselorPerformance';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Admin Routes with Sidebar Module */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/admin-counselors" element={<AdminCounselors />} />
              <Route path="/admin-specialties" element={<AdminSpecialties />} />
              <Route path="/admin-users" element={<AdminUsers />} />
              <Route path="/admin-appointments" element={<AdminAppointments />} />
              <Route path="/admin/analytics" element={<ReportsDashboard />} />
              <Route path="/admin/feedback" element={<FeedbackReports />} />
              <Route path="/admin/performance" element={<CounselorPerformance />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['counselor', 'admin']} />}>
            <Route path="/counselor-dashboard" element={<CounselorDashboard />} />
          </Route>

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
