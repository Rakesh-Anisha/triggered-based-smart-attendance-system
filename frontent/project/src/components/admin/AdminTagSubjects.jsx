import { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminTagSubjects.css';

function AdminTagSubjects() {
  const [schools, setSchools] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [message, setMessage] = useState('');
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [isSubjectsOpen, setIsSubjectsOpen] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      fetchDepartments(selectedSchool);
    }
  }, [selectedSchool]);

  useEffect(() => {
    if (selectedDepartment) {
      fetchSubjects(selectedDepartment);
      fetchTeachers(selectedDepartment);
    }
  }, [selectedDepartment]);

  const fetchSchools = async () => {
    try {
      const response = await axios.get('http://localhost:5000/schools');
      setSchools(response.data);
    } catch (err) {
      setMessage('Failed to fetch schools: ' + err.message);
    }
  };

  const fetchDepartments = async (schoolName) => {
    try {
      const response = await axios.get('http://localhost:5000/departments', { params: { school_name: schoolName } });
      setDepartments(response.data);
    } catch (err) {
      setMessage('Failed to fetch departments: ' + err.message);
    }
  };

  const fetchSubjects = async (departmentName) => {
    try {
      setLoadingSubjects(true);
      const response = await axios.get('http://localhost:5000/subjects', { params: { department_name: departmentName } });
      if (response.data && response.data.length > 0) {
        setSubjects(response.data);
      } else {
        setMessage('No subjects found for the selected department.');
      }
      setLoadingSubjects(false);
    } catch (err) {
      setMessage('Failed to fetch subjects: ' + err.message);
      setLoadingSubjects(false);
    }
  };

  const fetchTeachers = async (departmentName) => {
    try {
      const response = await axios.get('http://localhost:5000/teachers', { params: { department_name: departmentName } });
      setTeachers(response.data);
    } catch (err) {
      setMessage('Failed to fetch teachers: ' + err.message);
    }
  };

  const handleTagSubjects = async () => {
    try {
      if (selectedTeachers.length === 0) {
        setMessage('Please select at least one teacher.');
        return;
      }
      if (selectedSubjects.length === 0) {
        setMessage('Please select at least one subject.');
        return;
      }

      console.log('Sending data:', { teachers: selectedTeachers, subjects: selectedSubjects });
      for (const teacher of selectedTeachers) {
        const teacherData = { teacher_id: teacher, subjects: selectedSubjects };
        console.log('Posting to:', 'http://localhost:5000/teacher/tag-subjects', teacherData);
        const response = await axios.post('http://localhost:5000/teacher/tag-subjects', teacherData);
        console.log('Response:', response.data);
      }
      setMessage('Subjects tagged successfully!');
    } catch (err) {
      console.error('Error tagging subjects:', err);
      setMessage('Failed to tag subjects: ' + err.message);
    }
  };

  const handleSubjectChange = (subjectCode) => {
    setSelectedSubjects((prevSelected) =>
      prevSelected.includes(subjectCode)
        ? prevSelected.filter((code) => code !== subjectCode)
        : [...prevSelected, subjectCode]
    );
  };

  const handleTeacherSelect = (teacherId) => {
    setSelectedTeachers((prevSelected) =>
      prevSelected.includes(teacherId)
        ? prevSelected.filter((id) => id !== teacherId)
        : [...prevSelected, teacherId]
    );
  };

  return (
    <div className="admin-tag-subjects">
      <h2>Tag Subjects to Teachers</h2>
      {message && <p className="tag-message">{message}</p>}
       <center>
      <div className="tag-form-group">
        <label>School</label>
        <select value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)}>
          <option value="">Select School</option>
          {schools.map((school) => (
            <option key={school.school_name} value={school.school_name}>
              {school.school_name}
            </option>
          ))}
        </select>
      </div>

      <div className="tag-form-group">
        <label>Department</label>
        <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept.department_name} value={dept.department_name}>
              {dept.department_name}
            </option>
          ))}
        </select>
      </div>

      <div className="tag-form-group">
        <label>Subjects</label>
        {loadingSubjects ? (
          <p>Loading subjects...</p>
        ) : (
          <div className="tag-multi-select">
            <div className="tag-select-header" onClick={() => setIsSubjectsOpen(!isSubjectsOpen)}>
              <span>Select Subjects</span>
              <span>{selectedSubjects.length} Selected</span>
            </div>
            {isSubjectsOpen && (
              <div className="tag-options-container">
                {subjects.length > 0 ? (
                  subjects.map((subject) => (
                    <div key={subject.subject_code} className="tag-option">
                      <input
                        type="checkbox"
                        id={subject.subject_code}
                        value={subject.subject_code}
                        checked={selectedSubjects.includes(subject.subject_code)}
                        onChange={() => handleSubjectChange(subject.subject_code)}
                      />
                      <label htmlFor={subject.subject_code}>{subject.subject_name}</label>
                    </div>
                  ))
                ) : (
                  <div className="tag-option">No subjects available</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="tag-form-group">
        <label>Teachers List</label>
        
        <div className="tag-teacher-table">
          <table>
            <thead>
              <tr>
                <th>Sl.</th>
                <th>Name</th>
                <th>ID</th>
                <th>Dept</th>
                <th>Role</th>
                <th>Select</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher, index) => (
                <tr key={teacher.employee_id}>
                  <td>{index + 1}</td>
                  <td>{teacher.name}</td>
                  <td>{teacher.employee_id}</td>
                  <td>{teacher.department_name}</td>
                  <td>{teacher.role || 'Teacher'}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedTeachers.includes(teacher.employee_id)}
                      onChange={() => handleTeacherSelect(teacher.employee_id)}
                    />
                  </td>
                  <td><button className="tag-update-btn">Edit</button></td>
                  <td><button className="tag-delete-btn">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </center>

      <button onClick={handleTagSubjects} className="tag-submit-btn">
        Tag Subjects
      </button>
    </div>
    
  );
}

export default AdminTagSubjects;