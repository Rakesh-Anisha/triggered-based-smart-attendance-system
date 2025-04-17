import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

function UserProfile({ userProfile, setUserProfile }) {
  const navigate = useNavigate();
  const [editableProfile, setEditableProfile] = useState({ ...userProfile });

  useEffect(() => {
    setEditableProfile({ ...userProfile });
  }, [userProfile]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5000/user/profile/update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editableProfile.name,
          email: editableProfile.email,
          address: editableProfile.address,
          dob: editableProfile.dob
        })
      });
      const data = await response.json();
      alert(data.message);
      setUserProfile({ ...editableProfile });
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div className="user-profile-page">
      <h2>User Profile</h2>
      <form onSubmit={handleUpdate}>
        <input
          type="text"
          value={editableProfile.name}
          onChange={(e) => setEditableProfile({ ...editableProfile, name: e.target.value })}
          placeholder="Name"
        />
        <input
          type="email"
          value={editableProfile.email}
          onChange={(e) => setEditableProfile({ ...editableProfile, email: e.target.value })}
          placeholder="Email"
        />
        <input
          type="text"
          value={editableProfile.address}
          onChange={(e) => setEditableProfile({ ...editableProfile, address: e.target.value })}
          placeholder="Address"
        />
        <input
          type="date"
          value={editableProfile.dob}
          onChange={(e) => setEditableProfile({ ...editableProfile, dob: e.target.value })}
          placeholder="Date of Birth"
        />
        <button type="submit">Save Changes</button>
        <button type="button" onClick={() => navigate(-1)}>Back</button>
      </form>
    </div>
  );
}

export default UserProfile;