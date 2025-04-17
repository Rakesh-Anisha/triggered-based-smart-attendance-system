// src/auth.js
export const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const expirationTime = localStorage.getItem('tokenExpiration');
  
    if (!token || !expirationTime) {
      return false;
    }
  
    const currentTime = new Date().getTime();
    if (currentTime > parseInt(expirationTime)) {
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiration');
      return false;
    }
  
    return true;
  };
  
  export const getToken = () => {
    if (isAuthenticated()) {
      return localStorage.getItem('token');
    }
    return null;
  };
  
  export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiration');
  };