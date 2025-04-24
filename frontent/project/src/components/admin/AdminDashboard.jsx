// import { Routes, Route, Link } from 'react-router-dom';
// import { useNavigate } from 'react-router-dom';
// import { useState, useEffect } from 'react';
// import AdminSchools from './AdminSchools';
// import AdminDepartments from './AdminDepartments';
// import AdminPrograms from './AdminPrograms';
// import AdminSections from './AdminSections';
// import AdminBatchYears from './AdminBatchYears';
// import AdminSubjects from './AdminSubjects';
// import AdminTeachers from './AdminTeachers';
// import AdminStudents from './AdminStudents';
// import AdminTagSubjects from './AdminTagSubjects';
// import AdminTagSubjectsWithStudents from './AdminTagSubjectsWithStudents';
// import Signup from './Signup';
// import './AdminDashboard.css';

// function AdminDashboard() {
//   const navigate = useNavigate();
//   const [totals, setTotals] = useState({
//     students: 0,
//     teachers: 0,
//     schools: 0,
//     programs: 0,
//     subjects: 0,
//     departments: 0,
//     sections: 0
//   });

//   const handleLogout = async () => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       try {
//         await fetch('http://localhost:5000/logout', {
//           method: 'POST',
//           headers: {
//             'Authorization': `Bearer ${token}`,
//           },
//         });
//       } catch (error) {
//         console.error('Logout error:', error);
//       }
//     }
//     localStorage.removeItem('token');
//     navigate('/login');
//   };

//   const handleEnrollStudent = async () => {
//     try {
//       const response = await fetch('http://192.168.118.222/', {
//         method: 'GET',
//       });
//       if (!response.ok) {
//         throw new Error('Failed to connect to enrollment service');
//       }
//       console.log('Enrollment request sent successfully');
//     } catch (error) {
//       console.error('Error enrolling student:', error);
//       alert('Failed to enroll student: ' + error.message);
//     }
//   };

//   useEffect(() => {
//     const fetchTotals = async () => {
//       try {
//         const token = localStorage.getItem('token');
//         const headers = {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         };

//         const [
//           studentsRes,
//           teachersRes,
//           schoolsRes,
//           programsRes,
//           subjectsRes,
//           departmentsRes,
//           sectionsRes
//         ] = await Promise.all([
//           fetch('http://localhost:5000/totals/students', { headers }),
//           fetch('http://localhost:5000/totals/teachers', { headers }),  // Fixed typo
//           fetch('http://localhost:5000/totals/schools', { headers }),
//           fetch('http://localhost:5000/totals/programs', { headers }),
//           fetch('http://localhost:5000/totals/subjects', { headers }),
//           fetch('http://localhost:5000/totals/departments', { headers }),
//           fetch('http://localhost:5000/totals/sections', { headers })
//         ]);

//         const [
//           studentsData,
//           teachersData,
//           schoolsData,
//           programsData,
//           subjectsData,
//           departmentsData,
//           sectionsData
//         ] = await Promise.all([
//           studentsRes.json(),
//           teachersRes.json(),
//           schoolsRes.json(),
//           programsRes.json(),
//           subjectsRes.json(),
//           departmentsRes.json(),
//           sectionsRes.json()
//         ]);

//         setTotals({
//           students: studentsData.total_students || 0,
//           teachers: teachersData.total_teachers || 0,
//           schools: schoolsData.total_schools || 0,
//           programs: programsData.total_programs || 0,
//           subjects: subjectsData.total_subjects || 0,
//           departments: departmentsData.total_departments || 0,
//           sections: sectionsData.total_sections || 0
//         });
//       } catch (error) {
//         console.error('Error fetching totals:', error);
//       }
//     };

//     fetchTotals();
//   }, []);

//   return (
//     <div className="admin-dashboard">
//       <header className="dashboard-header">
//         <h1>Departmental Admin Dashboard</h1>
//         <button onClick={handleLogout} className="logout-btn">Logout</button>
//       </header>

//       <div className="dashboard-container">
//         <aside className="sidebar">
//           <nav>
//             <ul>
//               <li><Link to="/admin/schools">Schools</Link></li>
//               <li><Link to="/admin/departments">Departments</Link></li>
//               <li><Link to="/admin/programs">Programs</Link></li>
//               <li><Link to="/admin/sections">Sections</Link></li>
//               <li><Link to="/admin/batch-years">Batch Years</Link></li>
//               <li><Link to="/admin/subjects">Subjects</Link></li>
//               <li><Link to="/admin/teachers">Teachers</Link></li>
//               <li><Link to="/admin/students">Students</Link></li>
//               <li><Link to="/admin/AdminTagSubjects">Tag Subjects With Teacher</Link></li>
//               <li><Link to="/admin/tag-subjects-with-students">Tag Subjects with Students</Link></li>
//               <li><Link to="/admin/createuser">Create User</Link></li>
//               <li>
//                 <button onClick={handleEnrollStudent} className="sidebar-btn">
//                   Enroll Student
//                 </button>
//               </li>
//             </ul>
//           </nav>
//         </aside>

//         <main className="main-content">
//           <Routes>
//             <Route path="/" element={
//               <div>
//                 <h2>Welcome, Admin User</h2>
//                 <p>Manage the attendance system through the sections on the sidebar.</p>
//                 <div className="stats-grid">
//                   <div className="stat-card">
//                     <h3>Students</h3>
//                     <p>{totals.students}+</p>
//                   </div>
//                   <div className="stat-card">
//                     <h3>Teachers</h3>
//                     <p>{totals.teachers}+</p>
//                   </div>
//                   <div className="stat-card">
//                     <h3>Schools</h3>
//                     <p>{totals.schools}+</p>
//                   </div>
//                   <div className="stat-card">
//                     <h3>Programs</h3>
//                     <p>{totals.programs}+</p>
//                   </div>
//                   <div className="stat-card">
//                     <h3>Subjects</h3>
//                     <p>{totals.subjects}+</p>
//                   </div>
//                   <div className="stat-card">
//                     <h3>Departments</h3>
//                     <p>{totals.departments}+</p>
//                   </div>
//                   <div className="stat-card">
//                     <h3>Sections</h3>
//                     <p>{totals.sections}+</p>
//                   </div>
//                 </div>
//               </div>
//             } />
//             <Route path="schools" element={<AdminSchools />} />
//             <Route path="departments" element={<AdminDepartments />} />
//             <Route path="programs" element={<AdminPrograms />} />
//             <Route path="sections" element={<AdminSections />} />
//             <Route path="batch-years" element={<AdminBatchYears />} />
//             <Route path="subjects" element={<AdminSubjects />} />
//             <Route path="teachers" element={<AdminTeachers />} />
//             <Route path="students" element={<AdminStudents />} />
//             <Route path="AdminTagSubjects" element={<AdminTagSubjects />} />
//             <Route path="tag-subjects-with-students" element={<AdminTagSubjectsWithStudents />} />
//             <Route path="createuser" element={<Signup />} />
//           </Routes>
//         </main>
//       </div>
//     </div>
//   );
// }

// export default AdminDashboard;








import { Routes, Route, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AdminSchools from './AdminSchools';
import AdminDepartments from './AdminDepartments';
import AdminPrograms from './AdminPrograms';
import AdminSections from './AdminSections';
import AdminBatchYears from './AdminBatchYears';
import AdminSubjects from './AdminSubjects';
import AdminTeachers from './AdminTeachers';
import AdminStudents from './AdminStudents';
import AdminTagSubjects from './AdminTagSubjects';
import AdminTagSubjectsWithStudents from './AdminTagSubjectsWithStudents';
import Signup from './Signup';
import UserProfile from '../UserProfile';
import './AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const [totals, setTotals] = useState({
    students: 0,
    teachers: 0,
    schools: 0,
    programs: 0,
    subjects: 0,
    departments: 0,
    sections: 0
  });
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

  const handleEnrollStudent = async () => {
    try {
      const response = await fetch('http://192.168.235.222:80/', {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error('Failed to connect to enrollment service');
      }
      console.log('Enrollment request sent successfully');
    } catch (error) {
      console.error('Error enrolling student:', error);
      alert('Failed to enroll student: ' + error.message);
    }
  };

  useEffect(() => {
    const fetchTotals = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };

        const [
          studentsRes,
          teachersRes,
          schoolsRes,
          programsRes,
          subjectsRes,
          departmentsRes,
          sectionsRes
        ] = await Promise.all([
          fetch('http://localhost:5000/totals/students', { headers }),
          fetch('http://localhost:5000/totals/teachers', { headers }),
          fetch('http://localhost:5000/totals/schools', { headers }),
          fetch('http://localhost:5000/totals/programs', { headers }),
          fetch('http://localhost:5000/totals/subjects', { headers }),
          fetch('http://localhost:5000/totals/departments', { headers }),
          fetch('http://localhost:5000/totals/sections', { headers })
        ]);

        const [
          studentsData,
          teachersData,
          schoolsData,
          programsData,
          subjectsData,
          departmentsData,
          sectionsData
        ] = await Promise.all([
          studentsRes.json(),
          teachersRes.json(),
          schoolsRes.json(),
          programsRes.json(),
          subjectsRes.json(),
          departmentsRes.json(),
          sectionsRes.json()
        ]);

        setTotals({
          students: studentsData.total_students || 0,
          teachers: teachersData.total_teachers || 0,
          schools: schoolsData.total_schools || 0,
          programs: programsData.total_programs || 0,
          subjects: subjectsData.total_subjects || 0,
          departments: departmentsData.total_departments || 0,
          sections: sectionsData.total_sections || 0
        });
      } catch (error) {
        console.error('Error fetching totals:', error);
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
    navigate('/admin/user-profile');
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Departmental Admin Dashboard</h1>
        <div>
          <span>{userProfile.registration_number || 'admin@gmail.com'}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="dashboard-container">
        <aside className="sidebar">
          <div className="user-profile" onClick={handleProfileClick}>
            <div className="user-initial">{userProfile.name.charAt(0).toUpperCase() || 'A'}</div>
            <div className="user-info">
              <span>{userProfile.name || 'Admin User'}</span>
            </div>
          </div>
          <nav>
            <ul>
              <li><Link to="/admin/schools">Schools</Link></li>
              <li><Link to="/admin/departments">Departments</Link></li>
              <li><Link to="/admin/programs">Programs</Link></li>
              <li><Link to="/admin/sections">Sections</Link></li>
              <li><Link to="/admin/batch-years">Batch Years</Link></li>
              <li><Link to="/admin/subjects">Subjects</Link></li>
              <li><Link to="/admin/teachers">Teachers</Link></li>
              <li><Link to="/admin/students">Students</Link></li>
              <li><Link to="/admin/AdminTagSubjects">Tag Subjects With Teacher</Link></li>
              <li><Link to="/admin/tag-subjects-with-students">Tag Subjects with Students</Link></li>
              <li><Link to="/admin/createuser">Create User</Link></li>
              <li>
                <button onClick={handleEnrollStudent} className="sidebar-btn">
                  Enroll Student
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/" element={
              <div>
                <h2>Welcome, Admin User</h2>
                <p>Manage the attendance system through the sections on the sidebar.</p>
                <div className="stats-grid">
                  <div className="stat-card">
                    <h3>Students</h3>
                    <p>{totals.students}+</p>
                  </div>
                  <div className="stat-card">
                    <h3>Teachers</h3>
                    <p>{totals.teachers}+</p>
                  </div>
                  <div className="stat-card">
                    <h3>Schools</h3>
                    <p>{totals.schools}+</p>
                  </div>
                  <div className="stat-card">
                    <h3>Programs</h3>
                    <p>{totals.programs}+</p>
                  </div>
                  <div className="stat-card">
                    <h3>Subjects</h3>
                    <p>{totals.subjects}+</p>
                  </div>
                  <div className="stat-card">
                    <h3>Departments</h3>
                    <p>{totals.departments}+</p>
                  </div>
                  <div className="stat-card">
                    <h3>Sections</h3>
                    <p>{totals.sections}+</p>
                  </div>
                </div>
              </div>
            } />
            <Route path="schools" element={<AdminSchools />} />
            <Route path="departments" element={<AdminDepartments />} />
            <Route path="programs" element={<AdminPrograms />} />
            <Route path="sections" element={<AdminSections />} />
            <Route path="batch-years" element={<AdminBatchYears />} />
            <Route path="subjects" element={<AdminSubjects />} />
            <Route path="teachers" element={<AdminTeachers />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="AdminTagSubjects" element={<AdminTagSubjects />} />
            <Route path="tag-subjects-with-students" element={<AdminTagSubjectsWithStudents />} />
            <Route path="createuser" element={<Signup />} />
            <Route path="user-profile" element={<UserProfile userProfile={userProfile} setUserProfile={setUserProfile} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;