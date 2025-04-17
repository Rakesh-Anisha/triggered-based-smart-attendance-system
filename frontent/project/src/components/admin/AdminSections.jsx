import { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminSections.css';

function AdminSections() {
  const [sections, setSections] = useState([]);
  const [formData, setFormData] = useState({ section_name: '' });
  const [editingSection, setEditingSection] = useState(null);
  const [message, setMessage] = useState(null);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    fetchSections();
    return () => setIsMounted(false);
  }, []);

  const fetchSections = async () => {
    try {
      const response = await axios.get('http://localhost:5000/sections');
      if (isMounted) setSections(response.data);
    } catch (err) {
      if (isMounted) setMessage('Failed to fetch sections: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/section', formData);
      if (isMounted) {
        setMessage('Section added successfully!');
        fetchSections();
        setFormData({ section_name: '' });
      }
    } catch (err) {
      if (isMounted) setMessage('Failed to add section: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdate = async () => {
    try {
      await axios.post('http://localhost:5000/section/update', {
        old_section_name: editingSection.old_section_name,
        section_name: editingSection.section_name
      });
      if (isMounted) {
        setMessage('Section updated successfully!');
        setEditingSection(null);
        fetchSections();
      }
    } catch (err) {
      if (isMounted) setMessage('Failed to update section: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (section_name) => {
    try {
      await axios.post('http://localhost:5000/section/delete', { section_name });
      if (isMounted) {
        setMessage('Section deleted successfully!');
        fetchSections();
      }
    } catch (err) {
      if (isMounted) setMessage('Failed to delete section: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="admin-sections">
      <h2>Manage Sections</h2>
      <form onSubmit={handleSubmit} className="sect-form">
        <input
          placeholder="Section Name"
          value={formData.section_name}
          onChange={(e) => setFormData({ ...formData, section_name: e.target.value })}
          required
          className="sect-input"
        />
        <button type="submit" className="sect-add-btn">Add Section</button>
      </form>
      {message && <p className="sect-message">{message}</p>}
      <h3>Section List</h3>
      {sections.length > 0 ? (
        <table className="sect-table">
          <thead>
            <tr>
              <th>Sl.</th>
              <th>Section Name</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section, index) => (
              <tr key={section.section_name}>
                <td>{index + 1}</td>
                <td>
                  {editingSection && editingSection.old_section_name === section.section_name ? (
                    <input
                      value={editingSection.section_name}
                      onChange={(e) => setEditingSection({ ...editingSection, section_name: e.target.value })}
                      className="sect-edit-input"
                    />
                  ) : (
                    section.section_name
                  )}
                </td>
                <td>
                  {editingSection && editingSection.old_section_name === section.section_name ? (
                    <button className="sect-update-btn" onClick={handleUpdate}>Save</button>
                  ) : (
                    <button className="sect-update-btn" onClick={() => setEditingSection({ ...section, old_section_name: section.section_name })}>Edit</button>
                  )}
                </td>
                <td>
                  <button className="sect-delete-btn" onClick={() => handleDelete(section.section_name)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="sect-no-data">No sections found.</p>
      )}
    </div>
  );
}

export default AdminSections;