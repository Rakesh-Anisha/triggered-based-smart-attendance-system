import { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminTeachers.css';

function AdminTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    employee_id: '',
    name: '',
    school_name: '',
    department_name: ''
  });
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchSchools();
    fetchTeachers();
  }, []);

  useEffect(() => {
    console.log('Departments state updated:', departments);
  }, [departments]);

  const fetchSchools = async () => {
    try {
      const response = await axios.get('http://localhost:5000/schools');
      console.log('Schools response:', response.data);
      if (response.data.length === 0) {
        setMessage('No schools found. Please add schools first.');
        setSchools([]);
      } else {
        setSchools(response.data.map(school => school.school_name));
        setMessage(null);
      }
    } catch (err) {
      console.error('Error fetching schools:', err.response ? err.response.data : err.message);
      setMessage('Failed to fetch schools: ' + (err.response?.data?.error || err.message));
      setSchools([]);
    }
  };

  const fetchDepartments = async (schoolName) => {
    if (!schoolName) {
      console.log('No school selected, clearing departments');
      setDepartments([]);
      setMessage('Please select a school to load departments.');
      return;
    }
    try {
      console.log(`Fetching departments for: ${schoolName}`);
      const response = await axios.get('http://localhost:5000/departments', {
        params: { school_name: schoolName }
      });
      console.log('Raw response:', response.data);
      const deptNames = response.data.map(dept => dept.department_name);
      console.log('Mapped departments:', deptNames);
      setDepartments([...deptNames]);
      console.log('Departments state set to:', deptNames);
      if (deptNames.length === 0) {
        setMessage(`No departments found for ${schoolName}. Please add departments first.`);
      } else {
        setMessage(null);
      }
    } catch (err) {
      console.error('Error fetching departments:', err.response ? err.response.data : err.message);
      setDepartments([]);
      setMessage('Failed to fetch departments: ' + (err.response?.data?.error || err.message));
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/teachers');
      console.log('Teachers response:', response.data);
      setTeachers(response.data);
      setMessage(null);
    } catch (err) {
      console.error('Error fetching teachers:', err.response ? err.response.data : err.message);
      setMessage('Failed to fetch teachers: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.school_name) {
      setMessage('Please select a school');
      return;
    }
    if (!formData.department_name) {
      setMessage('Please select a department');
      return;
    }
    try {
      await axios.post('http://localhost:5000/teacher', formData);
      setMessage('Teacher added successfully!');
      fetchTeachers();
      setFormData({
        employee_id: '',
        name: '',
        school_name: '',
        department_name: ''
      });
      setDepartments([]);
    } catch (err) {
      console.error('Error adding teacher:', err.response ? err.response.data : err.message);
      setMessage('Failed to add teacher: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdate = async () => {
    try {
      await axios.post('http://localhost:5000/teacher/update', editingTeacher);
      setMessage('Teacher updated successfully!');
      setEditingTeacher(null);
      fetchTeachers();
    } catch (err) {
      console.error('Error updating teacher:', err.response ? err.response.data : err.message);
      setMessage('Failed to update teacher: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (employee_id) => {
    try {
      await axios.post('http://localhost:5000/teacher/delete', { employee_id });
      setMessage('Teacher deleted successfully!');
      fetchTeachers();
    } catch (err) {
      console.error('Error deleting teacher:', err.response ? err.response.data : err.message);
      setMessage('Failed to delete teacher: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="admin-teachers">
      <h2>Manage Teachers</h2>
      <form onSubmit={handleSubmit} className="teach-form">
        <input
          placeholder="Employee ID"
          value={formData.employee_id}
          onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
          required
          className="teach-input"
        />
        <input
          placeholder="Teacher Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="teach-input"
        />
        <select
          value={formData.school_name}
          onChange={(e) => {
            const selectedSchool = e.target.value;
            console.log('Selected school:', selectedSchool);
            setFormData({ ...formData, school_name: selectedSchool, department_name: '' });
            fetchDepartments(selectedSchool);
          }}
          required
          className="teach-select"
        >
          <option value="">Select School</option>
          {schools.map((school) => (
            <option key={school} value={school}>
              {school}
            </option>
          ))}
        </select>
        <select
          value={formData.department_name}
          onChange={(e) => {
            console.log('Selected department:', e.target.value);
            setFormData({ ...formData, department_name: e.target.value });
          }}
          required
          className="teach-select"
          disabled={!formData.school_name}
        >
          <option value="">Select Department</option>
          {departments.length > 0 ? (
            departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))
          ) : (
            <option value="" disabled>No departments available</option>
          )}
        </select>
        <button type="submit" className="teach-add-btn">Add Teacher</button>
      </form>
      {message && <p className="teach-message">{message}</p>}
      <h3>Teacher List</h3>
      {teachers.length > 0 ? (
        <table className="teach-table">
          <thead>
            <tr>
              <th>Sl.</th>
              <th>Employee ID</th>
              <th>Name</th>
              <th>School</th>
              <th>Department</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher, index) => (
              <tr key={teacher.employee_id}>
                <td>{index + 1}</td>
                <td>{teacher.employee_id}</td>
                <td>
                  {editingTeacher && editingTeacher.employee_id === teacher.employee_id ? (
                    <input
                      value={editingTeacher.name}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                      className="teach-edit-input"
                    />
                  ) : (
                    teacher.name
                  )}
                </td>
                <td>{teacher.school_name}</td>
                <td>{teacher.department_name}</td>
                <td>
                  {editingTeacher && editingTeacher.employee_id === teacher.employee_id ? (
                    <button className="teach-update-btn" onClick={handleUpdate}>Save</button>
                  ) : (
                    <button className="teach-update-btn" onClick={() => setEditingTeacher(teacher)}>Edit</button>
                  )}
                </td>
                <td>
                  <button className="teach-delete-btn" onClick={() => handleDelete(teacher.employee_id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="teach-no-data">No teachers found.</p>
      )}
    </div>
  );
}

export default AdminTeachers;