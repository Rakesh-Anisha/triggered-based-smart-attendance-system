
import { Routes, Route, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import TeacherStudents from './TeacherStudents';
import TeacherAttendance from './TeacherAttendance';
import UserProfile from '../UserProfile';
import './TeacherDashboard.css';

function TeacherDashboard() {
  const navigate = useNavigate();
  const [totals, setTotals] = useState({
    students: 0,
    subjects: 0,
    schools: 0,
    departments: 0,
    programs: 0,
    teachers: 0,
    sections: 0
  });
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    registration_number: ''
  });

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch('http://localhost:5000/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    localStorage.removeItem('token');
    navigate('/HomePage');
  };

  useEffect(() => {
    const fetchTotals = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };

        const [
          studentsRes,
          subjectsRes,
          schoolsRes,
          departmentsRes,
          programsRes,
          teachersRes,
          sectionsRes
        ] = await Promise.all([
          fetch('http://localhost:5000/totals/students', { headers }),
          fetch('http://localhost:5000/totals/subjects', { headers }),
          fetch('http://localhost:5000/totals/schools', { headers }),
          fetch('http://localhost:5000/totals/departments', { headers }),
          fetch('http://localhost:5000/totals/programs', { headers }),
          fetch('http://localhost:5000/totals/teachers', { headers }),
          fetch('http://localhost:5000/totals/sections', { headers })
        ]);

        const [
          studentsData,
          subjectsData,
          schoolsData,
          departmentsData,
          programsData,
          teachersData,
          sectionsData
        ] = await Promise.all([
          studentsRes.json(),
          subjectsRes.json(),
          schoolsRes.json(),
          departmentsRes.json(),
          programsRes.json(),
          teachersRes.json(),
          sectionsRes.json()
        ]);

        setTotals({
          students: studentsData.total_students || 0,
          subjects: subjectsData.total_subjects || 0,
          schools: schoolsData.total_schools || 0,
          departments: departmentsData.total_departments || 0,
          programs: programsData.total_programs || 0,
          teachers: teachersData.total_teachers || 0,
          sections: sectionsData.total_sections || 0
        });
      } catch (error) {
        console.error('Error fetching totals:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        setUserProfile(data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchTotals();
    fetchUserProfile();
  }, []);

  const handleProfileClick = () => {
    navigate('/teacher/user-profile');
  };

  return (
    <div className="teacher-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h1>Teacher Dashboard</h1>
        <div>
          <span>{userProfile.registration_number || 'teacher@gmail.com'}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="dashboard-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="user-profile" onClick={handleProfileClick}>
            <div className="user-initial">{userProfile.name.charAt(0).toUpperCase() || 'T'}</div>
            <div className="user-info">
              <span>{userProfile.name || 'Teacher User'}</span>
            </div>
          </div>
          <nav>
            <ul>
              <li><Link to="/teacher/students">Students</Link></li>
              <li><Link to="/teacher/attendance">Attendance</Link></li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={
              <div>
                <h2>Welcome, Teacher User</h2>
                <p>Manage your students and attendance through the sections on the sidebar.</p>
                {loading ? (
                  <p>Loading totals...</p>
                ) : (
                  <div className="stats-grid">
                    <div className="stat-card">
                      <h3>Students</h3>
                      <p>{totals.students}+</p>
                    </div>
                    <div className="stat-card">
                      <h3>Subjects</h3>
                      <p>{totals.subjects}+</p>
                    </div>
                    <div className="stat-card">
                      <h3>Schools</h3>
                      <p>{totals.schools}+</p>
                    </div>
                    <div className="stat-card">
                      <h3>Departments</h3>
                      <p>{totals.departments}+</p>
                    </div>
                    <div className="stat-card">
                      <h3>Programs</h3>
                      <p>{totals.programs}+</p>
                    </div>
                    <div className="stat-card">
                      <h3>Teachers</h3>
                      <p>{totals.teachers}+</p>
                    </div>
                    <div className="stat-card">
                      <h3>Sections</h3>
                      <p>{totals.sections}+</p>
                    </div>
                  </div>
                )}
              </div>
            } />
            <Route path="students" element={<TeacherStudents />} />
            <Route path="attendance" element={<TeacherAttendance />} />
            <Route path="user-profile" element={<UserProfile userProfile={userProfile} setUserProfile={setUserProfile} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default TeacherDashboard;