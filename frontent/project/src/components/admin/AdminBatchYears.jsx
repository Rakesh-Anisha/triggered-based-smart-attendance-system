import { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminBatchYears.css';

function AdminBatchYears() {
  const [batchYears, setBatchYears] = useState([]);
  const [formData, setFormData] = useState({ batch_year: '' });
  const [editingBatchYear, setEditingBatchYear] = useState(null);
  const [originalBatchYear, setOriginalBatchYear] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchBatchYears();
  }, []);

  const fetchBatchYears = async () => {
    try {
      const response = await axios.get('http://localhost:5000/batch_years');
      setBatchYears(response.data);
    } catch (err) {
      setMessage('Failed to fetch batch years: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/batch_year', formData);
      setMessage('Batch year added successfully!');
      fetchBatchYears();
      setFormData({ batch_year: '' });
    } catch (err) {
      setMessage('Failed to add batch year: ' + err.message);
    }
  };

  const handleUpdate = async () => {
    try {
      await axios.post('http://localhost:5000/batch_year/update', {
        old_batch_year: originalBatchYear,
        batch_year: editingBatchYear.batch_year
      });
      setMessage('Batch year updated successfully!');
      setEditingBatchYear(null);
      setOriginalBatchYear(null);
      fetchBatchYears();
    } catch (err) {
      setMessage('Failed to update batch year: ' + err.message);
    }
  };

  const handleDelete = async (batch_year) => {
    try {
      await axios.post('http://localhost:5000/batch_year/delete', { batch_year });
      setMessage('Batch year deleted successfully!');
      fetchBatchYears();
    } catch (err) {
      setMessage('Failed to delete batch year: ' + err.message);
    }
  };

  return (
    <div className="admin-batch-years">
      <h2>Manage Batch Years</h2>
      <form onSubmit={handleSubmit} className="batch-form">
        <input
          placeholder="Batch Year"
          value={formData.batch_year}
          onChange={(e) => setFormData({ ...formData, batch_year: e.target.value })}
          required
          className="batch-input"
        />
        <button type="submit" className="batch-add-btn">Add Batch Year</button>
      </form>
      {message && <p className="batch-message">{message}</p>}
      <h3>Batch Year List</h3>
      {batchYears.length > 0 ? (
        <table className="batch-table">
          <thead>
            <tr>
              <th>Sl.</th>
              <th>Batch Year</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {batchYears.map((year, index) => (
              <tr key={year.batch_year}>
                <td>{index + 1}</td>
                <td>
                  {editingBatchYear && originalBatchYear === year.batch_year ? (
                    <input
                      value={editingBatchYear.batch_year}
                      onChange={(e) => setEditingBatchYear({ ...editingBatchYear, batch_year: e.target.value })}
                      className="batch-edit-input"
                    />
                  ) : (
                    year.batch_year
                  )}
                </td>
                <td>
                  {editingBatchYear && originalBatchYear === year.batch_year ? (
                    <button className="batch-update-btn" onClick={handleUpdate}>Save</button>
                  ) : (
                    <button className="batch-update-btn" onClick={() => { setEditingBatchYear(year); setOriginalBatchYear(year.batch_year); }}>Edit</button>
                  )}
                </td>
                <td>
                  <button className="batch-delete-btn" onClick={() => handleDelete(year.batch_year)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="batch-no-data">No batch years found.</p>
      )}
    </div>
  );
}

export default AdminBatchYears;