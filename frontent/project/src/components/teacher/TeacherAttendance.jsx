import { useState, useEffect } from 'react';
import './TeacherAttendance.css';

function TeacherAttendance() {
  const [formData, setFormData] = useState({
    department_name: '',
    program_name: '',
    batch_year: '',
    section_name: '',
    subject_code: '',
    filter_type: 'overall',
    month_year: '',
    date: ''
  });
  const [options, setOptions] = useState({
    departments: [],
    programs: [],
    batch_years: [],
    sections: [],
    subjects: []
  });
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to continue');
          return;
        }

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };

        const [departmentsRes, sectionsRes, batchYearsRes] = await Promise.all([
          fetch('http://localhost:5000/departments', { headers }),
          fetch('http://localhost:5000/sections', { headers }),
          fetch('http://localhost:5000/batch_years', { headers })
        ]);

        if (!departmentsRes.ok || !sectionsRes.ok || !batchYearsRes.ok) {
          throw new Error('Failed to fetch options');
        }

        const [departmentsData, sectionsData, batchYearsData] = await Promise.all([
          departmentsRes.json(),
          sectionsRes.json(),
          batchYearsRes.json()
        ]);

        setOptions(prev => ({
          ...prev,
          departments: departmentsData || [],
          sections: sectionsData || [],
          batch_years: batchYearsData || []
        }));
      } catch (err) {
        setError('Failed to load options: ' + err.message);
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    if (formData.department_name) {
      const fetchProgramsAndSubjects = async () => {
        try {
          const token = localStorage.getItem('token');
          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          };

          const [programsRes, subjectsRes] = await Promise.all([
            fetch(`http://localhost:5000/programs?department_name=${encodeURIComponent(formData.department_name)}`, { headers }),
            fetch(`http://localhost:5000/subjects?department_name=${encodeURIComponent(formData.department_name)}`, { headers })
          ]);

          if (!programsRes.ok || !subjectsRes.ok) {
            throw new Error('Failed to fetch programs or subjects');
          }

          const [programsData, subjectsData] = await Promise.all([
            programsRes.json(),
            subjectsRes.json()
          ]);

          setOptions(prev => ({
            ...prev,
            programs: programsData || [],
            subjects: subjectsData || []
          }));
        } catch (err) {
          setError('Failed to load programs or subjects: ' + err.message);
        }
      };

      fetchProgramsAndSubjects();
    } else {
      setOptions(prev => ({
        ...prev,
        programs: [],
        subjects: []
      }));
    }
  }, [formData.department_name]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'department_name' ? { program_name: '', subject_code: '' } : {}),
      ...(name === 'program_name' ? { subject_code: '' } : {}),
      ...(name === 'filter_type' && value !== 'monthly' ? { month_year: '' } : {}),
      ...(name === 'filter_type' && value !== 'datewise' ? { date: '' } : {})
    }));
    setError('');
    setAttendanceList([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAttendanceList([]);

    // Validate filter-specific fields
    if (formData.filter_type === 'monthly' && !formData.month_year) {
      setError('Please select a month and year for monthly filter');
      setLoading(false);
      return;
    }
    if (formData.filter_type === 'datewise' && !formData.date) {
      setError('Please select a date for datewise filter');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to continue');
        setLoading(false);
        return;
      }

      const payload = { ...formData };
      if (formData.filter_type === 'monthly' && formData.month_year) {
        try {
          const [year, monthNum] = formData.month_year.split('-');
          if (!year || !monthNum || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            throw new Error('Invalid month or year selected');
          }
          const months = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
          payload.month = months[parseInt(monthNum) - 1];
          payload.year = year;
          delete payload.month_year;
        } catch (err) {
          setError('Error processing month and year: ' + err.message);
          setLoading(false);
          return;
        }
      }

      const response = await fetch('http://localhost:5000/attendance/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        setAttendanceList(data.attendance_list || []);
        if (data.attendance_list.length === 0) {
          setError('No attendance records found for the selected criteria');
        }
      } else {
        setError(data.error || 'Failed to fetch attendance');
      }
    } catch (err) {
      setError('An error occurred while fetching attendance: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="teacher-attendance">
      <h2>Attendance List</h2>
      <form onSubmit={handleSubmit} className="attendance-form">
        <div className="form-group">
          <label>Department</label>
          <select
            name="department_name"
            value={formData.department_name}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Department</option>
            {options.departments.map(dept => (
              <option key={dept.department_name} value={dept.department_name}>
                {dept.department_name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Program</label>
          <select
            name="program_name"
            value={formData.program_name}
            onChange={handleInputChange}
            required
            disabled={!formData.department_name}
          >
            <option value="">Select Program</option>
            {options.programs.map(prog => (
              <option key={prog.program_name} value={prog.program_name}>
                {prog.program_name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Batch Year</label>
          <select
            name="batch_year"
            value={formData.batch_year}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Batch Year</option>
            {options.batch_years.map(by => (
              <option key={by.batch_year} value={by.batch_year}>
                {by.batch_year}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Section</label>
          <select
            name="section_name"
            value={formData.section_name}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Section</option>
            {options.sections.map(sec => (
              <option key={sec.section_name} value={sec.section_name}>
                {sec.section_name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Subject</label>
          <select
            name="subject_code"
            value={formData.subject_code}
            onChange={handleInputChange}
            required
            disabled={!formData.department_name}
          >
            <option value="">Select Subject</option>
            {options.subjects.map(sub => (
              <option key={sub.subject_code} value={sub.subject_code}>
                {sub.subject_name} ({sub.subject_code})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Filter Type</label>
          <select
            name="filter_type"
            value={formData.filter_type}
            onChange={handleInputChange}
            required
          >
            <option value="overall">Overall</option>
            <option value="monthly">Monthly</option>
            <option value="datewise">Datewise</option>
          </select>
        </div>

        {formData.filter_type === 'monthly' && (
          <div className="form-group">
            <label>Month and Year</label>
            <input
              type="month"
              name="month_year"
              value={formData.month_year}
              onChange={handleInputChange}
              required
            />
          </div>
        )}

        {formData.filter_type === 'datewise' && (
          <div className="form-group">
            <label>Select Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Fetch Attendance'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {attendanceList.length > 0 && (
        <div className="attendance-table">
          <h3>Attendance Records</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Roll No</th>
                <th>Reg Number</th>
                <th>Section</th>
                <th>Subject</th>
                <th>Total Classes</th>
                <th>Total Present</th>
                <th>Total Absent</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {attendanceList.map((record, index) => (
                <tr key={index}>
                  <td>{record.name}</td>
                  <td>{record.roll_no}</td>
                  <td>{record.reg_no}</td>
                  <td>{record.section_name}</td>
                  <td>{record.subject_name} ({record.subject_code})</td>
                  <td>{record.total_classes}</td>
                  <td>{record.present_classes}</td>
                  <td>{record.absent_classes}</td>
                  <td>{record.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TeacherAttendance;