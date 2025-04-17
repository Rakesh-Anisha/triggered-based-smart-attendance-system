import { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDepartments.css';

function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [schools, setSchools] = useState([]);
  const [formData, setFormData] = useState({ school_name: '', department_name: '' });
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [message, setMessage] = useState(null);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    fetchSchools();
    fetchDepartments();
    return () => setIsMounted(false);
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await axios.get('http://localhost:5000/schools');
      if (isMounted) setSchools(response.data);
    } catch (err) {
      if (isMounted) setMessage('Failed to fetch schools: ' + (err.response?.data?.error || err.message));
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('http://localhost:5000/departments');
      if (isMounted) setDepartments(response.data);
    } catch (err) {
      if (isMounted) setMessage('Failed to fetch departments: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/department', formData);
      if (isMounted) {
        setMessage('Department added successfully!');
        fetchDepartments();
        setFormData({ ...formData, department_name: '' });
      }
    } catch (err) {
      if (isMounted) setMessage('Failed to add department: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdate = async () => {
    try {
      await axios.post('http://localhost:5000/department/update', {
        old_department_name: editingDepartment.old_department_name,
        department_name: editingDepartment.department_name,
        school_name: editingDepartment.school_name
      });
      if (isMounted) {
        setMessage('Department updated successfully!');
        setEditingDepartment(null);
        fetchDepartments();
      }
    } catch (err) {
      if (isMounted) setMessage('Failed to update department: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (department_name, school_name) => {
    try {
      await axios.post('http://localhost:5000/department/delete', { department_name, school_name });
      if (isMounted) {
        setMessage('Department deleted successfully!');
        fetchDepartments();
      }
    } catch (err) {
      if (isMounted) setMessage('Failed to delete department: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="admin-departments">
      <h2>Manage Departments</h2>
      <form onSubmit={handleSubmit} className="dept-form">
        <select
          value={formData.school_name}
          onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
          required
          className="dept-select"
        >
          <option value="">Select School</option>
          {schools.map((school) => (
            <option key={school.school_name} value={school.school_name}>{school.school_name}</option>
          ))}
        </select>
        <input
          placeholder="Department Name"
          value={formData.department_name}
          onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
          required
          className="dept-input"
        />
        <button type="submit" className="dept-add-btn">Add Department</button>
      </form>
      {message && <p className="dept-message">{message}</p>}
      <h3>Department List</h3>
      {departments.length > 0 ? (
        <table className="dept-table">
          <thead>
            <tr>
              <th>Sl.</th>
              <th>School Name</th>
              <th>Department Name</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept, index) => (
              <tr key={dept.department_name}>
                <td>{index + 1}</td>
                <td>{dept.school_name}</td>
                <td>
                  {editingDepartment && editingDepartment.old_department_name === dept.department_name ? (
                    <input
                      value={editingDepartment.department_name}
                      onChange={(e) => setEditingDepartment({ ...editingDepartment, department_name: e.target.value })}
                      className="dept-edit-input"
                    />
                  ) : (
                    dept.department_name
                  )}
                </td>
                <td>
                  {editingDepartment && editingDepartment.old_department_name === dept.department_name ? (
                    <button className="dept-update-btn" onClick={handleUpdate}>Save</button>
                  ) : (
                    <button className="dept-update-btn" onClick={() => setEditingDepartment({ ...dept, old_department_name: dept.department_name })}>Edit</button>
                  )}
                </td>
                <td>
                  <button className="dept-delete-btn" onClick={() => handleDelete(dept.department_name, dept.school_name)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="dept-no-data">No departments found.</p>
      )}
    </div>
  );
}

export default AdminDepartments;