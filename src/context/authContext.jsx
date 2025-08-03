// import jwtDecode from 'jwt-decode';
import { jwtDecode } from 'jwt-decode';
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  //console.log(isAuthenticated, accessToken, user, isInitialized);
  

  useEffect(() => {
    // Check localStorage for existing user session
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const storedAccessToken = localStorage.getItem('accessToken');

    if (storedUser && storedAccessToken) {
      try {
        const decodedToken = jwtDecode(storedAccessToken);
        const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
        if (decodedToken.exp < currentTime) {
          console.warn("Stored token expired. Clearing local storage.");
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
        } else {
          setUser(storedUser);
          setAccessToken(storedAccessToken);
          setIsAuthenticated(true);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Failed to decode stored token", error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      }
    } else {
      setIsInitialized(true);
    }
  }, []);

  const login = (token, user) => {
    setAccessToken(token);
    setUser(user);
    setIsAuthenticated(true);

    // Store token and user in localStorage
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAccessToken(null);
    setUser(null);

    // Clear localStorage on logout
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ accessToken, isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};