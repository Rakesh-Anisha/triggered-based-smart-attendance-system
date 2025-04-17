import { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminTagSubjectsWithStudents.css';

function AdminTagSubjectsWithStudents() {
  const [schools, setSchools] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [sections, setSections] = useState([]);
  const [batchYears, setBatchYears] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedBatchYear, setSelectedBatchYear] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [message, setMessage] = useState('');
  const [isSubjectsOpen, setIsSubjectsOpen] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      fetchDepartments(selectedSchool);
    } else {
      resetDependentStates();
    }
  }, [selectedSchool]);

  useEffect(() => {
    if (selectedDepartment) {
      fetchPrograms(selectedDepartment);
      fetchSubjects(selectedDepartment);
    } else {
      resetDependentStates(['programs', 'subjects', 'sections', 'batchYears', 'students']);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedProgram) {
      fetchSections();
    } else {
      resetDependentStates(['sections', 'batchYears', 'students']);
    }
  }, [selectedProgram]);

  useEffect(() => {
    if (selectedSection) {
      fetchBatchYears();
    } else {
      resetDependentStates(['batchYears', 'students']);
    }
  }, [selectedSection]);

  useEffect(() => {
    if (selectedBatchYear && selectedSection && selectedProgram && selectedDepartment && selectedSchool) {
      fetchStudents();
    } else {
      setStudents([]);
    }
  }, [selectedBatchYear, selectedSection, selectedProgram, selectedDepartment, selectedSchool]);

  const fetchSchools = async () => {
    try {
      const response = await axios.get('http://localhost:5000/schools');
      setSchools(response.data || []);
    } catch (err) {
      setMessage('Failed to fetch schools: ' + err.message);
      console.error('Fetch schools error:', err);
    }
  };

  const fetchDepartments = async (schoolName) => {
    try {
      const response = await axios.get('http://localhost:5000/departments', {
        params: { school_name: schoolName },
      });
      setDepartments(response.data || []);
    } catch (err) {
      setMessage('Failed to fetch departments: ' + err.message);
      console.error('Fetch departments error:', err);
    }
  };

  const fetchPrograms = async (departmentName) => {
    try {
      const response = await axios.get('http://localhost:5000/programs', {
        params: { department_name: departmentName },
      });
      setPrograms(response.data || []);
    } catch (err) {
      setMessage('Failed to fetch programs: ' + err.message);
      console.error('Fetch programs error:', err);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await axios.get('http://localhost:5000/sections');
      setSections(response.data || []);
    } catch (err) {
      setMessage('Failed to fetch sections: ' + err.message);
      console.error('Fetch sections error:', err);
    }
  };

  const fetchBatchYears = async () => {
    try {
      console.log('Fetching batch years...');
      const response = await axios.get('http://localhost:5000/batch_years');
      console.log('Batch years response:', response.data);
      const batchYearsData = Array.isArray(response.data) ? response.data.map(item => item.batch_year || item) : [];
      setBatchYears(batchYearsData);
    } catch (err) {
      setMessage('Failed to fetch batch years: ' + err.message);
      console.error('Fetch batch years error:', err);
      setBatchYears([]);
    }
  };

  const fetchSubjects = async (departmentName) => {
    try {
      const response = await axios.get('http://localhost:5000/subjects', {
        params: { department_name: departmentName },
      });
      setSubjects(response.data || []);
    } catch (err) {
      setMessage('Failed to fetch subjects: ' + err.message);
      console.error('Fetch subjects error:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.post('http://localhost:5000/students/filter', {
        school_name: selectedSchool,
        department_name: selectedDepartment,
        program_name: selectedProgram,
        section_name: selectedSection,
        batch_year: selectedBatchYear,
      });
      setStudents(response.data.students || []);
    } catch (err) {
      setMessage('Failed to fetch students: ' + err.message);
      console.error('Fetch students error:', err);
      setStudents([]);
    }
  };

  const handleTagSubjects = async () => {
    try {
      if (selectedStudents.length === 0) {
        setMessage('Please select at least one student.');
        return;
      }
      if (selectedSubjects.length === 0) {
        setMessage('Please select at least one subject.');
        return;
      }

      await axios.post('http://localhost:5000/tag-subjects-with-students', {
        students: selectedStudents,
        subjects: selectedSubjects,
      });
      setMessage('Subjects tagged successfully!');
      setSelectedSubjects([]);
      setSelectedStudents([]);
    } catch (err) {
      console.error('Error tagging subjects:', err);
      setMessage('Failed to tag subjects: ' + err.message);
    }
  };

  const handleUpdateStudent = async (student) => {
    try {
      await axios.post('http://localhost:5000/update', {
        fingerprint_id: student.fingerprint_id,
        name: student.name,
        roll_no: student.roll_no,
        reg_no: student.reg_no,
        section_name: selectedSection,
        department_name: selectedDepartment,
        program_name: selectedProgram,
        school_name: selectedSchool,
        batch_year: selectedBatchYear,
      });
      setMessage('Student updated successfully!');
      fetchStudents();
    } catch (err) {
      setMessage('Failed to update student: ' + err.message);
    }
  };

  const handleDeleteStudent = async (fingerprintId) => {
    try {
      await axios.post('http://localhost:5000/delete', {
        fingerprint_id: fingerprintId,
      });
      setMessage('Student deleted successfully!');
      setSelectedStudents((prev) => prev.filter((id) => id !== fingerprintId));
      fetchStudents();
    } catch (err) {
      setMessage('Failed to delete student: ' + err.message);
    }
  };

  const handleSubjectChange = (subjectCode) => {
    setSelectedSubjects((prevSelected) =>
      prevSelected.includes(subjectCode)
        ? prevSelected.filter((code) => code !== subjectCode)
        : [...prevSelected, subjectCode]
    );
  };

  const handleStudentSelect = (fingerprintId) => {
    setSelectedStudents((prevSelected) =>
      prevSelected.includes(fingerprintId)
        ? prevSelected.filter((id) => id !== fingerprintId)
        : [...prevSelected, fingerprintId]
    );
  };

  const resetDependentStates = (statesToReset = ['departments', 'programs', 'subjects', 'sections', 'batchYears', 'students']) => {
    statesToReset.forEach(state => {
      switch (state) {
        case 'departments': setDepartments([]); break;
        case 'programs': setPrograms([]); break;
        case 'subjects': setSubjects([]); break;
        case 'sections': setSections([]); break;
        case 'batchYears': setBatchYears([]); break;
        case 'students': setStudents([]); break;
        default: break;
      }
    });
    setSelectedDepartment('');
    setSelectedProgram('');
    setSelectedSection('');
    setSelectedBatchYear('');
  };

  return (
    <div className="admin-tag-subjects">
      <h2>Tag Subjects to Students</h2>
      {message && <p className="tag-message">{message}</p>}
       <center>
      <div className="tag-form-group">
        <label>School</label>
        <select value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)} className="tag-select">
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
        <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="tag-select">
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept.department_name} value={dept.department_name}>
              {dept.department_name}
            </option>
          ))}
        </select>
      </div>

      <div className="tag-form-group">
        <label>Program</label>
        <select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)} className="tag-select">
          <option value="">Select Program</option>
          {programs.map((program) => (
            <option key={program.program_name} value={program.program_name}>
              {program.program_name}
            </option>
          ))}
        </select>
      </div>

      <div className="tag-form-group">
        <label>Section</label>
        <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="tag-select">
          <option value="">Select Section</option>
          {sections.map((section) => (
            <option key={section.section_name} value={section.section_name}>
              {section.section_name}
            </option>
          ))}
        </select>
      </div>

      <div className="tag-form-group">
        <label>Batch Year</label>
        <select value={selectedBatchYear} onChange={(e) => setSelectedBatchYear(e.target.value)} className="tag-select">
          <option value="">Select Batch Year</option>
          {batchYears.map((batch) => (
            <option key={batch} value={batch}>
              {batch}
            </option>
          ))}
        </select>
      </div>

      <div className="tag-form-group">
        <label>Subjects</label>
        <div className="tag-multiple-select-menu">
          <div className="tag-select-header" onClick={() => setIsSubjectsOpen(!isSubjectsOpen)}>
            <span>Select Subjects</span>
            <span>{selectedSubjects.length} Selected</span>
          </div>
          {isSubjectsOpen && (
            <div className="tag-options-container">
              {subjects.map((subject) => (
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
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="tag-form-group">
        <label>Students</label>
        <div className="tag-student-table">
          <table className="tag-table">
            <thead>
              <tr>
                <th>Sl.</th>
                <th>Name</th>
                <th>Roll No</th>
                <th>Reg No</th>
                <th>Section</th>
                <th>Department</th>
                <th>Program</th>
                <th>Select</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((student, index) => (
                  <tr key={student.fingerprint_id}>
                    <td>{index + 1}</td>
                    <td>{student.name || 'N/A'}</td>
                    <td>{student.roll_no || 'N/A'}</td>
                    <td>{student.reg_no || 'N/A'}</td>
                    <td>{student.section_name || 'N/A'}</td>
                    <td>{student.department_name || 'N/A'}</td>
                    <td>{student.program_name || 'N/A'}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.fingerprint_id)}
                        onChange={() => handleStudentSelect(student.fingerprint_id)}
                      />
                    </td>
                    <td>
                      <button
                        className="tag-update-btn"
                        onClick={() => handleUpdateStudent(student)}
                      >
                        Edit
                      </button>
                    </td>
                    <td>
                      <button
                        className="tag-delete-btn"
                        onClick={() => handleDeleteStudent(student.fingerprint_id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10">No students found</td>
                </tr>
              )}
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

export default AdminTagSubjectsWithStudents;