

import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './StudentDashboard.css';

function StudentProfile() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regNo, setRegNo] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setRegNo(decodedToken.registration_number);
      } catch (e) {
        console.error('Error decoding token:', e);
        setError('Invalid authentication token');
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!regNo) return;

    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }

        const response = await fetch(`http://localhost:5000/student/profile?reg_no=${regNo}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch profile data');
        }

        const data = await response.json();
        setProfileData(data.student);
      } catch (err) {
        console.error('Fetch error:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [regNo]);

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="student-profile-section">
      <h2 className="text-2xl font-bold mb-4">Student Profile</h2>
      {profileData && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex items-center mb-6">
            <img
              src="https://via.placeholder.com/100/4EC0D9/FFFFFF"
              alt="Profile"
              className="w-24 h-24 rounded-full mr-4"
            />
            <div>
              <h3 className="text-xl font-semibold">{profileData.name}</h3>
              <p className="text-gray-600">Registration No: {profileData.reg_no}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Roll No:</strong> {profileData.roll_no}</p>
              <p><strong>School:</strong> {profileData.school_name}</p>
              <p><strong>Department:</strong> {profileData.department_name}</p>
            </div>
            <div>
              <p><strong>Program:</strong> {profileData.program_name}</p>
              <p><strong>Batch Year:</strong> {profileData.batch_year}</p>
              <p><strong>Section:</strong> {profileData.section_name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StudentAttendance() {
  const [filterType, setFilterType] = useState('overall');
  const [monthYear, setMonthYear] = useState('');
  const [date, setDate] = useState('');
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [regNo, setRegNo] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setRegNo(decodedToken.registration_number);
      } catch (e) {
        console.error('Error decoding token:', e);
        setError('Invalid authentication token');
      }
    }
  }, []);

  useEffect(() => {
    if (!regNo) return;

    if (filterType === 'monthly' && !monthYear) {
      setAttendanceData(null);
      return;
    }
    if (filterType === 'datewise' && !date) {
      setAttendanceData(null);
      return;
    }
    fetchAttendanceData();
  }, [regNo, filterType, monthYear, date]);

  const fetchAttendanceData = async () => {
    if (!regNo) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const payload = { reg_no: regNo, filter_type: filterType };
      if (filterType === 'monthly' && monthYear) {
        const [year, monthNum] = monthYear.split('-');
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December',
        ];
        payload.month = months[parseInt(monthNum) - 1];
        payload.year = year;
      } else if (filterType === 'datewise' && date) {
        payload.date = date;
      }

      const response = await fetch('http://localhost:5000/attendance/filter', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch attendance: ${response.status}`);
      }

      const data = await response.json();
      setAttendanceData(data);
    } catch (err) {
      console.error('Fetch error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!regNo && !error) {
    return <p>Loading registration number...</p>;
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="student-attendance-section">
      <h2 className="text-2xl font-bold mb-4">
        Attendance for {regNo} (
        {attendanceData?.filter_type === 'monthly'
          ? `${attendanceData.month} ${attendanceData.year}`
          : attendanceData?.filter_type === 'datewise'
          ? attendanceData.date
          : 'Overall'}
        )
      </h2>
      <div className="mb-6">
        <div className="mb-4">
          <label className="block mb-1">Filter Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="overall">Overall</option>
            <option value="monthly">Monthly</option>
            <option value="datewise">Datewise</option>
          </select>
        </div>
        {filterType === 'monthly' && (
          <div className="mb-4">
            <label className="block mb-1">Month and Year</label>
            <input
              type="month"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>
        )}
        {filterType === 'datewise' && (
          <div className="mb-4">
            <label className="block mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>
        )}
      </div>
      {attendanceData && attendanceData.attendance_summary ? (
        <div className="student-stats-grid mb-6">
          {Object.keys(attendanceData.attendance_summary).map((subjectCode) => {
            const subject = attendanceData.attendance_summary[subjectCode];
            const percentage = subject.percentage;
            let progressColor = '#ff8f00'; // Default color
            if (percentage >= 75) progressColor = '#27ae60'; // Green for 75% and above
            else if (percentage >= 50) progressColor = '#f1c40f'; // Yellow for 50-74%
            else progressColor = '#e74c3c'; // Red for below 50%

            return (
              <div key={subjectCode} className="student-stat-card">
                <h3>{subject.subject_name}</h3>
                <div className="student-progress-circle" style={{ '--percentage': subject.percentage, '--progress-color': progressColor }}>
                  <span className="student-progress-value">{subject.percentage.toFixed(2)}%</span>
                </div>
                <p>Present: {subject.present_classes} / Total: {subject.total_classes}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <p>Please select {filterType === 'monthly' ? 'a month and year' : filterType === 'datewise' ? 'a date' : 'a filter'} to view attendance.</p>
      )}
    </div>
  );
}

function StudentDashboard() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({ name: '', regNo: '', role: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login to access the dashboard');
      navigate('/login');
    } else {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setUserData({
          name: decodedToken.name || 'User',
          regNo: decodedToken.registration_number,
          role: decodedToken.role || 'Student',
        });
      } catch (e) {
        console.error('Error decoding token:', e);
        setError('Invalid authentication token');
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('reg_no');
    navigate('/HomePage');
  };

  if (error) {
    return (
      <div className="student-dashboard">
        <header className="student-dashboard-header">
          <h1>Student Dashboard</h1>
        </header>
        <div className="student-dashboard-container">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <header className="student-dashboard-header">
        <h1>Student Dashboard</h1>
        <div className="flex items-center">
          <span className="mr-4 text-gray-600">{userData.regNo}</span>
          <button onClick={handleLogout} className="student-logout-btn">Logout</button>
        </div>
      </header>

      <div className="student-dashboard-container">
        <aside className="student-sidebar">
          <div className="flex flex-col items-center mb-6">
            <Link to="/student/profile">
              <img
                src="https://via.placeholder.com/100/4EC0D9/FFFFFF"
                alt="Profile"
                className="w-24 h-24 rounded-full mb-2 profile-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '';
                  e.target.alt = userData.role;
                  e.target.className = 'w-24 h-24 rounded-full mb-2 bg-gray-200 flex items-center justify-center text-xl font-semibold text-gray-600';
                }}
              />
            </Link>
            <p className="text-lg font-semibold">{userData.name}</p>
            <p className="text-gray-600">{userData.regNo}</p>
          </div>
          <nav>
            <ul>
              <li>
                <Link to="/student/attendance">Attendance</Link>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="student-main-content">
          <Routes>
            <Route path="/" element={<div><h2>Welcome to Student Dashboard</h2></div>} />
            <Route path="/attendance" element={<StudentAttendance />} />
            <Route path="/profile" element={<StudentProfile />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default StudentDashboard;