import { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPrograms.css';

function AdminPrograms() {
  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({ department_name: '', program_name: '' });
  const [editingProgram, setEditingProgram] = useState(null);
  const [message, setMessage] = useState(null);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    fetchDepartments();
    fetchPrograms();
    return () => setIsMounted(false);
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('http://localhost:5000/departments');
      if (isMounted) setDepartments(response.data);
    } catch (err) {
      if (isMounted) setMessage('Failed to fetch departments: ' + (err.response?.data?.error || err.message));
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await axios.get('http://localhost:5000/programs');
      if (isMounted) setPrograms(response.data);
    } catch (err) {
      if (isMounted) {
        setMessage(
          `Failed to fetch programs: ${err.response?.status} - ${
            err.response?.statusText || err.message
          }`
        );
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/program', formData);
      if (isMounted) {
        setMessage('Program added successfully!');
        fetchPrograms();
        setFormData({ ...formData, program_name: '' });
      }
    } catch (err) {
      if (isMounted) setMessage('Failed to add program: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdate = async () => {
    try {
      await axios.post('http://localhost:5000/program/update', {
        old_program_name: editingProgram.old_program_name,
        program_name: editingProgram.program_name,
        department_name: editingProgram.department_name
      });
      if (isMounted) {
        setMessage('Program updated successfully!');
        setEditingProgram(null);
        fetchPrograms();
      }
    } catch (err) {
      if (isMounted) setMessage('Failed to update program: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (program_name, department_name) => {
    try {
      await axios.post('http://localhost:5000/program/delete', { program_name, department_name });
      if (isMounted) {
        setMessage('Program deleted successfully!');
        fetchPrograms();
      }
    } catch (err) {
      if (isMounted) setMessage('Failed to delete program: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="admin-programs">
      <h2>Manage Programs</h2>
      <form onSubmit={handleSubmit} className="prog-form">
        <select
          value={formData.department_name}
          onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
          required
          className="prog-select"
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept.department_name} value={dept.department_name}>{dept.department_name}</option>
          ))}
        </select>
        <input
          placeholder="Program Name"
          value={formData.program_name}
          onChange={(e) => setFormData({ ...formData, program_name: e.target.value })}
          required
          className="prog-input"
        />
        <button type="submit" className="prog-add-btn">Add Program</button>
      </form>
      {message && <p className="prog-message">{message}</p>}
      <h3>Program List</h3>
      {programs.length > 0 ? (
        <table className="prog-table">
          <thead>
            <tr>
              <th>Sl.</th>
              <th>Department Name</th>
              <th>Program Name</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((prog, index) => (
              <tr key={`${prog.department_name}-${prog.program_name}`}>
                <td>{index + 1}</td>
                <td>{prog.department_name}</td>
                <td>
                  {editingProgram && editingProgram.old_program_name === prog.program_name ? (
                    <input
                      value={editingProgram.program_name}
                      onChange={(e) => setEditingProgram({ ...editingProgram, program_name: e.target.value })}
                      className="prog-edit-input"
                    />
                  ) : (
                    prog.program_name
                  )}
                </td>
                <td>
                  {editingProgram && editingProgram.old_program_name === prog.program_name ? (
                    <button className="prog-update-btn" onClick={handleUpdate}>Save</button>
                  ) : (
                    <button className="prog-update-btn" onClick={() => setEditingProgram({ ...prog, old_program_name: prog.program_name })}>Edit</button>
                  )}
                </td>
                <td>
                  <button className="prog-delete-btn" onClick={() => handleDelete(prog.program_name, prog.department_name)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="prog-no-data">No programs found.</p>
      )}
    </div>
  );
}

export default AdminPrograms;