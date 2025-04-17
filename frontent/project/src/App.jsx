
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './components/admin/AdminDashboard';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import StudentDashboard from './components/student/StudentDashboard'; // New import
import LandingPage from './components/LandingPage';
import HomePage from './components/HomePage';
import Login from './components/Login';
import Logout from './components/Logout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route
          path="/admin/*"
          element={<ProtectedRoute element={<AdminDashboard />} allowedRole="admin" />}
        />
        <Route
          path="/teacher/*"
          element={<ProtectedRoute element={<TeacherDashboard />} allowedRole="teacher" />}
        />
        <Route
          path="/student/*" // Changed from "/student" to "/student/*" to allow sub-routes
          element={<ProtectedRoute element={<StudentDashboard />} allowedRole="student" />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;