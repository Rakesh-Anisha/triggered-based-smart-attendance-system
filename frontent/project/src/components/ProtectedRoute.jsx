// import { Navigate } from 'react-router-dom';
// import { isAuthenticated } from './auth';

// const ProtectedRoute = ({ element, allowedRole }) => {
//   const token = localStorage.getItem('token');
//   console.log('ProtectedRoute - Token:', token);

//   if (!isAuthenticated()) {
//     console.log('Not authenticated, redirecting to /login');
//     return <Navigate to="/login" replace />;
//   }

//   let userRole = 'student'; // Default role
//   if (token) {
//     try {
//       const decodedToken = JSON.parse(atob(token.split('.')[1]));
//       userRole = decodedToken.role || 'student';
//       console.log('ProtectedRoute - Role:', userRole);
//     } catch (e) {
//       console.error('Error decoding token:', e);
//       return <Navigate to="/login" replace />;
//     }
//   }

//   if (allowedRole && userRole !== allowedRole) {
//     console.log(`Role mismatch: ${userRole} != ${allowedRole}, redirecting to /${userRole}`);
//     return <Navigate to={`/${userRole}`} replace />;
//   }

//   return element;
// };

// export default ProtectedRoute;




import { Navigate } from 'react-router-dom';
import { isAuthenticated } from './auth';

const ProtectedRoute = ({ element, allowedRole }) => {
  const token = localStorage.getItem('token');
  console.log('ProtectedRoute - Token:', token);

  if (!isAuthenticated()) {
    console.log('Not authenticated, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  let userRole = 'student'; // Default role
  if (token) {
    try {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      userRole = decodedToken.role || 'student';
      console.log('ProtectedRoute - Role:', userRole);
    } catch (e) {
      console.error('Error decoding token:', e);
      return <Navigate to="/login" replace />;
    }
  }

  if (allowedRole && userRole !== allowedRole) {
    console.log(`Role mismatch: ${userRole} != ${allowedRole}, redirecting to /${userRole}`);
    return <Navigate to={`/${userRole}`} replace />;
  }

  return element;
};

export default ProtectedRoute;