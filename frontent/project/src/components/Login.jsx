// import { useState, useEffect } from 'react'; // Add useEffect
// import { useNavigate } from 'react-router-dom';
// import './Login.css'; // Import the CSS file

// // Assuming auth.js is in the same directory or adjust the import path
// import { isAuthenticated } from './auth';

// const Login = () => {
//  const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false); // Prevent multiple submissions
  
//   const navigate = useNavigate();

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     if (isSubmitting) return; // Prevent multiple submissions
//     setIsSubmitting(true);
//     setError('');

//     try {
//      const response = await fetch('http://localhost:5000/login', {
//         method: 'POST',
//          headers: { 'Content-Type': 'application/json' },         body: JSON.stringify({ email, password }),       });
//       const data = await response.json();       console.log('Login response:', data);

//       if (response.ok) {
//          const token = data.token;
//         localStorage.setItem('token', token);

//          const decodedToken = JSON.parse(atob(token.split('.')[1]));
//          const userRole = decodedToken.role;
//         const expirationTime = decodedToken.exp * 1000;

//          if (!userRole) {
//            setError('User role not found in token');
//            localStorage.removeItem('token');
//            setIsSubmitting(false);
//            return;
//          }

//          localStorage.setItem('tokenExpiration', expirationTime);
//          console.log('Role:', userRole, 'Expiration:', expirationTime);

//          navigate(`/${userRole}`, { replace: true });
//          console.log(`Navigating to /${userRole}`);
//        } else {
//          setError(data.error || 'Login failed');
//          setIsSubmitting(false);
//        }
//     } catch (error) {
//        console.error('Login error:', error);
//        setError('An error occurred during login');
//        setIsSubmitting(false);     }
//    };

//    // Debug navigation result
//    useEffect(() => {
//      if (isAuthenticated() && window.location.pathname === '/login') {
//        const token = localStorage.getItem('token');
//        const decodedToken = JSON.parse(atob(token.split('.')[1]));
//        const userRole = decodedToken.role;
//       navigate(`/${userRole}`, { replace: true });
//       console.log('Redirecting from /login to', `/${userRole}`);
//     }
//    }, [navigate]);

//    return (
//      <div className="login-container">
//        <form onSubmit={handleLogin} className="login-form">
//          <h2>Login</h2>
//          {error && <p className="error-message">{error}</p>}
        
//         <div className="input-container">
//           <input
//             type="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             placeholder="Email"
//             className="input-field"
//             required
//           />
//          </div>
//                  <div className="input-container">
//           <input
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             placeholder="Password"
//             className="input-field"
//             required
//            />
//         </div>

//          <button type="submit" disabled={isSubmitting} className="submit-button">
//            {isSubmitting ? 'Logging in...' : 'Login'}
//          </button>
//        </form>
//      </div>
//   );
// };

// export default Login;





// // import { useState, useEffect } from 'react';
// // import { useNavigate } from 'react-router-dom';
// // import './Login.css';

// // const isAuthenticated = () => {
// //     const token = localStorage.getItem('token');
// //     const expirationTime = localStorage.getItem('tokenExpiration');
// //     if (!token || !expirationTime) return false;
// //     return new Date().getTime() < parseInt(expirationTime);
// // };

// // const Login = () => {
// //     const [registrationNumber, setRegistrationNumber] = useState('');
// //     const [password, setPassword] = useState('');
// //     const [error, setError] = useState('');
// //     const [isSubmitting, setIsSubmitting] = useState(false);
    
// //     const navigate = useNavigate();

// //     const handleLogin = async (e) => {
// //         e.preventDefault();
// //         if (isSubmitting) return;
// //         setIsSubmitting(true);
// //         setError('');

// //         try {
// //             const response = await fetch('http://localhost:5000/login', {
// //                 method: 'POST',
// //                 headers: { 'Content-Type': 'application/json' },
// //                 body: JSON.stringify({ registration_number: registrationNumber, password }),
// //             });
// //             const data = await response.json();

// //             if (response.ok) {
// //                 const token = data.token;
// //                 localStorage.setItem('token', token);

// //                 const decodedToken = JSON.parse(atob(token.split('.')[1]));
// //                 const userRole = decodedToken.role;
// //                 const expirationTime = decodedToken.exp * 1000;

// //                 if (!userRole) {
// //                     setError('User role not found in token');
// //                     localStorage.removeItem('token');
// //                     setIsSubmitting(false);
// //                     return;
// //                 }

// //                 localStorage.setItem('tokenExpiration', expirationTime);
// //                 navigate(`/${userRole}`, { replace: true });
// //             } else {
// //                 setError(data.error || 'Login failed');
// //                 setIsSubmitting(false);
// //             }
// //         } catch (error) {
// //             console.error('Login error:', error);
// //             setError('An error occurred during login');
// //             setIsSubmitting(false);
// //         }
// //     };

// //     useEffect(() => {
// //         if (isAuthenticated() && window.location.pathname === '/login') {
// //             const token = localStorage.getItem('token');
// //             const decodedToken = JSON.parse(atob(token.split('.')[1]));
// //             const userRole = decodedToken.role;
// //             navigate(`/${userRole}`, { replace: true });
// //         }
// //     }, [navigate]);

// //     return (
// //         <div className="login-container">
// //             <form onSubmit={handleLogin} className="login-form">
// //                 <h2>Login</h2>
// //                 {error && <p className="error-message">{error}</p>}
                
// //                 <div className="input-container">
// //                     <input
// //                         type="text"
// //                         value={registrationNumber}
// //                         onChange={(e) => setRegistrationNumber(e.target.value)}
// //                         placeholder="Registration Number"
// //                         className="input-field"
// //                         required
// //                     />
// //                 </div>
                
// //                 <div className="input-container">
// //                     <input
// //                         type="password"
// //                         value={password}
// //                         onChange={(e) => setPassword(e.target.value)}
// //                         placeholder="Password"
// //                         className="input-field"
// //                         required
// //                     />
// //                 </div>

// //                 <button type="submit" disabled={isSubmitting} className="submit-button">
// //                     {isSubmitting ? 'Logging in...' : 'Login'}
// //                 </button>
// //             </form>
// //         </div>
// //     );
// // };

// // export default Login;




import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { isAuthenticated } from './auth';

const Login = () => {
  const [registration_number, setRegistrationNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_number, password }),
      });
      const data = await response.json();
      console.log('Login response:', data);

      if (response.ok) {
        const token = data.token;
        localStorage.setItem('token', token);

        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const userRole = decodedToken.role;
        const expirationTime = decodedToken.exp * 1000;

        if (!userRole) {
          setError('User role not found in token');
          localStorage.removeItem('token');
          setIsSubmitting(false);
          return;
        }

        localStorage.setItem('tokenExpiration', expirationTime);
        console.log('Role:', userRole, 'Expiration:', expirationTime);

        navigate(`/${userRole}`, { replace: true });
        console.log(`Navigating to /${userRole}`);
      } else {
        setError(data.error || 'Login failed');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login');
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated() && window.location.pathname === '/login') {
      const token = localStorage.getItem('token');
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      const userRole = decodedToken.role;
      navigate(`/${userRole}`, { replace: true });
      console.log('Redirecting from /login to', `/${userRole}`);
    }
  }, [navigate]);

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>Login</h2>
        {error && <p className="error-message">{error}</p>}
        
        <div className="input-container">
          <input
            type="text"
            value={registration_number}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            placeholder="ID"
            className="input-field"
            required
          />
        </div>
        <div className="input-container">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="input-field"
            required
          />
        </div>

        <button type="submit" disabled={isSubmitting} className="submit-button">
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;