import { useState, useEffect } from 'react'; 
import axios from 'axios';
import './AdminSchools.css';

function AdminSchools() {
  const [schools, setSchools] = useState([]);
  const [formData, setFormData] = useState({ school_name: '' });
  const [editingSchool, setEditingSchool] = useState(null);
  const [message, setMessage] = useState(null);
  const [isMounted, setIsMounted] = useState(true); // Track component mount state

  useEffect(() => {
    fetchSchools();

    // Cleanup on unmount to prevent state updates after unmount
    return () => {
      setIsMounted(false);
    };
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await axios.get('http://localhost:5000/schools');
      if (isMounted) {
        setSchools(response.data);
        setMessage(null);
      }
    } catch (err) {
      console.error('Error fetching schools:', err);
      if (isMounted) {
        setMessage('Failed to fetch schools: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/school', formData);
      console.log('Add school response:', response.data);
      if (isMounted) {
        setMessage('School added successfully!');
        fetchSchools();
        setFormData({ school_name: '' });
      }
    } catch (err) {
      console.error('Error adding school:', err);
      if (isMounted) {
        setMessage('Failed to add school: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await axios.post('http://localhost:5000/school/update', {
        old_school_name: editingSchool.old_school_name,
        school_name: editingSchool.school_name
      });
      console.log('Update school response:', response.data);
      if (isMounted) {
        setMessage('School updated successfully!');
        setEditingSchool(null);
        fetchSchools();
      }
    } catch (err) {
      console.error('Error updating school:', err);
      if (isMounted) {
        setMessage('Failed to update school: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  const handleDelete = async (school_name) => {
    try {
      const response = await axios.post('http://localhost:5000/school/delete', { school_name });
      console.log('Delete school response:', response.data);
      if (isMounted) {
        setMessage('School deleted successfully!');
        fetchSchools();
      }
    } catch (err) {
      console.error('Error deleting school:', err);
      if (isMounted) {
        setMessage('Failed to delete school: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  return (
    <div className="admin-schools">
      <h2>Manage Schools</h2>
      <form onSubmit={handleSubmit} className="school-form">
        <input
          placeholder="School Name"
          value={formData.school_name}
          onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
          required
          className="school-input"
        />
        <button type="submit" className="add-btn">Add School</button>
      </form>
      {message && <p className="message">{message}</p>}
      <h3>School List</h3>
      {schools.length > 0 ? (
        <table className="school-table">
          <thead>
            <tr>
              <th>Sl.</th>
              <th>School Name</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((school, index) => (
              <tr key={school.school_name}>
                <td>{index + 1}</td>
                <td>
                  {editingSchool && editingSchool.old_school_name === school.school_name ? (
                    <input
                      value={editingSchool.school_name}
                      onChange={(e) => setEditingSchool({ ...editingSchool, school_name: e.target.value })}
                      className="edit-input"
                    />
                  ) : (
                    school.school_name
                  )}
                </td>
                <td>
                  {editingSchool && editingSchool.old_school_name === school.school_name ? (
                    <button className="update-btn" onClick={handleUpdate}>Save</button>
                  ) : (
                    <button className="update-btn" onClick={() => setEditingSchool({ ...school, old_school_name: school.school_name })}>Edit</button>
                  )}
                </td>
                <td>
                  <button className="delete-btn" onClick={() => handleDelete(school.school_name)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="no-data">No schools found.</p>
      )}
    </div>
  );
}

export default AdminSchools;
