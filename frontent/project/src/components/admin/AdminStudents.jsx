import { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminStudents.css';

function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showStudentList, setShowStudentList] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/students');
      setStudents(response.data);
      setMessage(null);
    } catch (err) {
      setMessage('Failed to fetch students: ' + err.message);
      console.error('Failed to fetch students:', err);
    }
  };

  const handleDelete = async (fingerprint_id) => {
    try {
      await axios.post('http://localhost:5000/delete', { fingerprint_id });
      setMessage('Student deleted successfully!');
      fetchStudents();
    } catch (err) {
      setMessage('Failed to delete student: ' + err.message);
      console.error('Failed to delete student:', err);
    }
  };

  const handleUpdateStudent = (student) => {
    setEditingStudent({ ...student });
    setMessage(null);
  };

  const handleSaveUpdate = async () => {
    try {
      await axios.post('http://localhost:5000/update', editingStudent);
      setMessage('Student updated successfully!');
      setEditingStudent(null);
      fetchStudents();
    } catch (err) {
      setMessage('Failed to update student: ' + err.message);
      console.error('Failed to update student:', err);
    }
  };

  const departments = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering'];
  const programs = ['B.Tech', 'M.Tech', 'B.Sc', 'M.Sc'];
  const sections = ['A', 'B', 'C', 'D'];

  return (
    <div className="admin-students">
      <h2>Manage Students</h2>
      <div className="stud-button-group">
        <button
          className="stud-toggle-btn"
          onClick={() => {
            setShowStudentList(!showStudentList);
            setMessage(null);
          }}
        >
          {showStudentList ? 'Hide Student List' : 'View Student List'}
        </button>
      </div>

      {/* Message Display */}
      {message && <p className="stud-message">{message}</p>}

      {showStudentList && (
        <div>
          <h3>Student List</h3>
          {students.length > 0 ? (
            <table className="stud-table">
              <thead>
                <tr>
                  <th>Sl.</th>
                  <th>Name</th>
                  <th>Roll</th>
                  <th>Registration</th>
                  <th>Section</th>
                  <th>Department</th>
                  <th>Program</th>
                  <th>Edit</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={student.fingerprint_id}>
                    <td>{index + 1}</td>
                    <td>
                      {editingStudent && editingStudent.fingerprint_id === student.fingerprint_id ? (
                        <input
                          value={editingStudent.name}
                          onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                          className="stud-edit-input"
                        />
                      ) : (
                        student.name
                      )}
                    </td>
                    <td>
                      {editingStudent && editingStudent.fingerprint_id === student.fingerprint_id ? (
                        <input
                          value={editingStudent.roll_no}
                          onChange={(e) => setEditingStudent({ ...editingStudent, roll_no: e.target.value })}
                          className="stud-edit-input"
                        />
                      ) : (
                        student.roll_no
                      )}
                    </td>
                    <td>
                      {editingStudent && editingStudent.fingerprint_id === student.fingerprint_id ? (
                        <input
                          value={editingStudent.reg_no}
                          onChange={(e) => setEditingStudent({ ...editingStudent, reg_no: e.target.value })}
                          className="stud-edit-input"
                        />
                      ) : (
                        student.reg_no
                      )}
                    </td>
                    <td>
                      {editingStudent && editingStudent.fingerprint_id === student.fingerprint_id ? (
                        <select
                          value={editingStudent.section}
                          onChange={(e) => setEditingStudent({ ...editingStudent, section: e.target.value })}
                          className="stud-edit-select"
                        >
                          <option value="">Select Section</option>
                          {sections.map((sec) => (
                            <option key={sec} value={sec}>{sec}</option>
                          ))}
                        </select>
                      ) : (
                        student.section
                      )}
                    </td>
                    <td>
                      {editingStudent && editingStudent.fingerprint_id === student.fingerprint_id ? (
                        <select
                          value={editingStudent.department}
                          onChange={(e) => setEditingStudent({ ...editingStudent, department: e.target.value })}
                          className="stud-edit-select"
                        >
                          <option value="">Select Department</option>
                          {departments.map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      ) : (
                        student.department
                      )}
                    </td>
                    <td>
                      {editingStudent && editingStudent.fingerprint_id === student.fingerprint_id ? (
                        <select
                          value={editingStudent.program}
                          onChange={(e) => setEditingStudent({ ...editingStudent, program: e.target.value })}
                          className="stud-edit-select"
                        >
                          <option value="">Select Program</option>
                          {programs.map((prog) => (
                            <option key={prog} value={prog}>{prog}</option>
                          ))}
                        </select>
                      ) : (
                        student.program
                      )}
                    </td>
                    <td>
                      {editingStudent && editingStudent.fingerprint_id === student.fingerprint_id ? (
                        <button className="stud-update-btn" onClick={handleSaveUpdate}>Save</button>
                      ) : (
                        <button className="stud-update-btn" onClick={() => handleUpdateStudent(student)}>Edit</button>
                      )}
                    </td>
                    <td>
                      <button className="stud-delete-btn" onClick={() => handleDelete(student.fingerprint_id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="stud-no-data">No students found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminStudents;