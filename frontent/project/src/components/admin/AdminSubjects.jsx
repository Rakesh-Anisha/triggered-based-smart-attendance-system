import { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminSubjects.css';

function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [schools, setSchools] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({ school_name: '', department_name: '', subject_name: '', subject_code: '' });
  const [editingSubject, setEditingSubject] = useState(null);
  const [originalSubjectCode, setOriginalSubjectCode] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchSchools();
    fetchDepartments();
    fetchSubjects();
  }, [formData.school_name, formData.department_name]);

  const fetchSchools = async () => {
    try {
      const response = await axios.get('http://localhost:5000/schools');
      setSchools(response.data);
    } catch (err) {
      setMessage('Failed to fetch schools: ' + err.message);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('http://localhost:5000/departments', {
        params: { school_name: formData.school_name }
      });
      setDepartments(response.data);
    } catch (err) {
      setMessage('Failed to fetch departments: ' + err.message);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get('http://localhost:5000/subjects', {
        params: { department_name: formData.department_name }
      });
      setSubjects(response.data);
    } catch (err) {
      setMessage('Failed to fetch subjects: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/subject', formData);
      setMessage('Subject added successfully!');
      fetchSubjects();
      setFormData({ ...formData, subject_name: '', subject_code: '' });
    } catch (err) {
      setMessage('Failed to add subject: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdate = async () => {
    if (!editingSubject || !originalSubjectCode) return;

    console.log("Updating:", editingSubject, "Original Code:", originalSubjectCode); // Debugging log

    try {
      const response = await axios.post('http://localhost:5000/subject/update', {
        old_subject_code: originalSubjectCode,
        subject_name: editingSubject.subject_name,
        subject_code: editingSubject.subject_code,
      });

      console.log("Update Response:", response.data); // Debugging log

      setMessage('Subject updated successfully!');
      setEditingSubject(null);
      setOriginalSubjectCode(null);
      fetchSubjects(); // Refresh data
    } catch (err) {
      console.error("Update Error:", err.response?.data || err.message);
      setMessage('Failed to update subject: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (subject_code) => {
    try {
      await axios.post('http://localhost:5000/subject/delete', { subject_code });
      setMessage('Subject deleted successfully!');
      fetchSubjects();
    } catch (err) {
      setMessage('Failed to delete subject: ' + err.message);
    }
  };

  return (
    <div className="admin-subjects">
      <h2>Manage Subjects</h2>
      <form onSubmit={handleSubmit} className="subj-form">
        <select
          value={formData.school_name}
          onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
          required
          className="subj-select"
        >
          <option value="">Select School</option>
          {schools.map((school) => (
            <option key={school.school_name} value={school.school_name}>{school.school_name}</option>
          ))}
        </select>
        <select
          value={formData.department_name}
          onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
          required
          className="subj-select"
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept.department_name} value={dept.department_name}>{dept.department_name}</option>
          ))}
        </select>
        <input
          placeholder="Subject Name"
          value={formData.subject_name}
          onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
          required
          className="subj-input"
        />
        <input
          placeholder="Subject Code"
          value={formData.subject_code}
          onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })}
          required
          className="subj-input"
        />
        <button type="submit" className="subj-add-btn">Add Subject</button>
      </form>
      {message && <p className="subj-message">{message}</p>}
      <h3>Subject List</h3>
      {subjects.length > 0 ? (
        <table className="subj-table">
          <thead>
            <tr>
              <th>Sl.</th>
              <th>School Name</th>
              <th>Department Name</th>
              <th>Subject Name</th>
              <th>Subject Code</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject, index) => (
              <tr key={subject.subject_code}>
                <td>{index + 1}</td>
                <td>{subject.school_name}</td>
                <td>{subject.department_name}</td>
                <td>
                  {editingSubject && originalSubjectCode === subject.subject_code ? (
                    <input
                      value={editingSubject.subject_name}
                      onChange={(e) => setEditingSubject({ ...editingSubject, subject_name: e.target.value })}
                      className="subj-edit-input"
                    />
                  ) : (
                    subject.subject_name
                  )}
                </td>
                <td>
                  {editingSubject && originalSubjectCode === subject.subject_code ? (
                    <input
                      value={editingSubject.subject_code}
                      onChange={(e) => setEditingSubject({ ...editingSubject, subject_code: e.target.value })}
                      className="subj-edit-input"
                    />
                  ) : (
                    subject.subject_code
                  )}
                </td>
                <td>
                  {editingSubject && originalSubjectCode === subject.subject_code ? (
                    <button className="subj-update-btn" onClick={handleUpdate}>Save</button>
                  ) : (
                    <button 
                      className="subj-update-btn" 
                      onClick={() => { 
                        setEditingSubject({ ...subject }); // Make a copy to avoid direct state mutations
                        setOriginalSubjectCode(subject.subject_code); 
                      }}
                    >
                      Edit
                    </button>
                  )}
                </td>
                <td>
                  <button className="subj-delete-btn" onClick={() => handleDelete(subject.subject_code)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="subj-no-data">No subjects found.</p>
      )}
    </div>
  );
}

export default AdminSubjects;