import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch('http://localhost:5000/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="landing-page">
      <h1>Welcome To Triggered Based Attendance Management System</h1>
      <p>This is the Student Dashboard.</p>
      <button onClick={handleLogout} className="logout-btn">Logout</button>
    </div>
  );
}

export default LandingPage;