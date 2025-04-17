import { useState, useEffect } from 'react';
import axios from 'axios';
import './TeacherStudents.css';

function TeacherStudents() {
  const [students, setStudents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [batchYears, setBatchYears] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filterData, setFilterData] = useState({
    school_name: '',
    department_name: '',
    program_name: '',
    batch_year: '',
    section_name: '',
    subject_code: ''
  });
  const [message, setMessage] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [isVerifying, setIsVerifying] = useState(false);

  const FLASK_SERVER_URL = 'http://192.168.235.167:5000';
  const ESP32_URL = 'http://192.168.235.222';

  useEffect(() => {
    fetchSchools();
    fetchBatchYears();
    fetchSections();
    fetchSubjects();
    window.addEventListener('message', handleAttendanceMessage);
    return () => window.removeEventListener('message', handleAttendanceMessage);
  }, []);

  useEffect(() => {
    if (filterData.school_name) fetchDepartments(filterData.school_name);
  }, [filterData.school_name]);

  useEffect(() => {
    if (filterData.department_name) fetchPrograms(filterData.department_name);
  }, [filterData.department_name]);

  useEffect(() => {
    const allFiltersSelected = 
      filterData.school_name && 
      filterData.department_name && 
      filterData.program_name && 
      filterData.batch_year && 
      filterData.section_name && 
      filterData.subject_code;
    
    if (allFiltersSelected) {
      fetchStudents();
    } else {
      setStudents([]);
      setMessage('Please select all filters to view students');
    }
  }, [filterData]);

  const handleAttendanceMessage = (event) => {
    if (event.data.type === 'attendanceMarked') {
      const newSelected = new Set(selectedStudents);
      newSelected.add(event.data.fingerprint_id);
      setSelectedStudents(newSelected);
      setMessage(`Attendance marked for fingerprint ID: ${event.data.fingerprint_id}`);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await axios.get(`${FLASK_SERVER_URL}/schools`);
      setSchools(response.data);
    } catch (err) {
      setMessage('Failed to fetch schools: ' + err.message);
    }
  };

  const fetchBatchYears = async () => {
    try {
      const response = await axios.get(`${FLASK_SERVER_URL}/batch_years`);
      setBatchYears(response.data);
    } catch (err) {
      setMessage('Failed to fetch batch years: ' + err.message);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await axios.get(`${FLASK_SERVER_URL}/sections`);
      setSections(response.data);
    } catch (err) {
      setMessage('Failed to fetch sections: ' + err.message);
    }
  };

  const fetchDepartments = async (schoolName) => {
    try {
      const response = await axios.get(`${FLASK_SERVER_URL}/departments`, { params: { school_name: schoolName } });
      setDepartments(response.data);
    } catch (err) {
      setMessage('Failed to fetch departments: ' + err.message);
    }
  };

  const fetchPrograms = async (departmentName) => {
    try {
      const response = await axios.get(`${FLASK_SERVER_URL}/programs`, { params: { department_name: departmentName } });
      setPrograms(response.data);
    } catch (err) {
      setMessage('Failed to fetch programs: ' + err.message);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get(`${FLASK_SERVER_URL}/subjects`);
      setSubjects(response.data);
    } catch (err) {
      setMessage('Failed to fetch subjects: ' + err.message);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.post(`${FLASK_SERVER_URL}/students/filter`, filterData);
      setStudents(response.data.students);
      setMessage(null);
    } catch (err) {
      setMessage('Failed to fetch students: ' + err.message);
      setStudents([]);
    }
  };

  const handleMarkAttendance = async () => {
    if (!filterData.subject_code) {
      setMessage('Please select a subject before marking attendance');
      return;
    }
    setIsVerifying(true);
    setMessage('Place your finger on the scanner...');

    try {
      const response = await axios.post(
        `${ESP32_URL}/verify`,
        {},
        { params: { subject_code: filterData.subject_code } }
      );
      if (response.data.status === 'success') {
        const newSelected = new Set(selectedStudents);
        newSelected.add(response.data.fingerprint_id);
        setSelectedStudents(newSelected);
        setMessage(`Attendance marked for ${response.data.name} (Roll: ${response.data.roll_no})`);
      } else {
        setMessage('Verification failed: ' + response.data.message);
      }
    } catch (err) {
      console.error('Axios Error Details:', {
        message: err.message,
        response: err.response,
        request: err.request
      });
      setMessage('Error connecting to scanner: ' + (err.response ? JSON.stringify(err.response.data) : err.message));
    } finally {
      setIsVerifying(false);
    }
  };

  const getSubjectName = (subject_code) => {
    const subject = subjects.find(s => s.subject_code === subject_code);
    return subject ? subject.subject_name : 'N/A';
  };

  return (
    <div className="teacher-students">
      <h2>View Students & Mark Attendance</h2>
      <div className="filter-grid">
        <select
          value={filterData.school_name}
          onChange={(e) => setFilterData({ ...filterData, school_name: e.target.value })}
          className="filter-select"
        >
          <option value="">Select School</option>
          {schools.map((school) => (
            <option key={school.school_name} value={school.school_name}>{school.school_name}</option>
          ))}
        </select>
        <select
          value={filterData.department_name}
          onChange={(e) => setFilterData({ ...filterData, department_name: e.target.value })}
          className="filter-select"
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept.department_name} value={dept.department_name}>{dept.department_name}</option>
          ))}
        </select>
        <select
          value={filterData.program_name}
          onChange={(e) => setFilterData({ ...filterData, program_name: e.target.value })}
          className="filter-select"
        >
          <option value="">Select Program</option>
          {programs.map((prog) => (
            <option key={prog.program_name} value={prog.program_name}>{prog.program_name}</option>
          ))}
        </select>
        <select
          value={filterData.batch_year}
          onChange={(e) => setFilterData({ ...filterData, batch_year: e.target.value })}
          className="filter-select"
        >
          <option value="">Select Batch Year</option>
          {batchYears.map((year) => (
            <option key={year.batch_year} value={year.batch_year}>{year.batch_year}</option>
          ))}
        </select>
        <select
          value={filterData.section_name}
          onChange={(e) => setFilterData({ ...filterData, section_name: e.target.value })}
          className="filter-select"
        >
          <option value="">Select Section</option>
          {sections.map((sec) => (
            <option key={sec.section_name} value={sec.section_name}>{sec.section_name}</option>
          ))}
        </select>
        <select
          value={filterData.subject_code}
          onChange={(e) => setFilterData({ ...filterData, subject_code: e.target.value })}
          className="filter-select"
        >
          <option value="">Select Subject</option>
          {subjects.map((subject) => (
            <option key={subject.subject_code} value={subject.subject_code}>
              {subject.subject_name} ({subject.subject_code})
            </option>
          ))}
        </select>
      </div>

      {message && <p className="message">{message}</p>}

      {students.length > 0 && (
        <>
          <h3>Student List</h3>
          <table className="student-table">
            <thead>
              <tr>
                <th>Sl.</th>
                <th>Present</th>
                <th>Name</th>
                <th>Roll</th>
                <th>Registration</th>
                <th>Program</th>
                <th>Section</th>
                <th>Subject</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.fingerprint_id}>
                  <td>{index + 1}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedStudents.has(student.fingerprint_id)}
                      readOnly
                    />
                  </td>
                  <td>{student.name}</td>
                  <td>{student.roll_no}</td>
                  <td>{student.reg_no}</td>
                  <td>{student.program_name}</td>
                  <td>{student.section_name}</td>
                  <td>{getSubjectName(filterData.subject_code)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            className="mark-attendance-btn"
            onClick={handleMarkAttendance}
            disabled={isVerifying}
          >
            {isVerifying ? 'Scanning...' : 'Mark Attendance'}
          </button>
        </>
      )}
    </div>
  );
}

export default TeacherStudents;