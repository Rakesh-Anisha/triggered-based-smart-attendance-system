import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = async () => {
      const token = localStorage.getItem('token');
      console.log('Token before logout:', token);

      if (token) {
        try {
          const response = await fetch('http://localhost:5000/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!response.ok) throw new Error('Logout failed');
          console.log('Logout request successful');
        } catch (error) {
          console.error('Logout error:', error);
        }
      }

      localStorage.removeItem('token');
      console.log('Token after logout:', localStorage.getItem('token'));

      navigate('/', { replace: true });
      console.log('Navigated to /');

      setTimeout(() => {
        console.log('Current path:', window.location.pathname);
      }, 500);
    };

    handleLogout();
  }, [navigate]);

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h2>Logging Out...</h2>
      <p>You are being logged out. Redirecting to homepage...</p>
    </div>
  );
};

export default Logout;






