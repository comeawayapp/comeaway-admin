/* eslint-disable no-unused-vars */
// import jwtDecode from 'jwt-decode';
import { jwtDecode } from 'jwt-decode';
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

// Staff roles returned by the API. `null` means the account is a regular
// customer and has no business being in the admin panel.
export const STAFF_ROLES = ['owner', 'admin', 'content_manager'];

export const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  content_manager: 'Content Manager',
};

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

  const role = user?.role ?? null;
  const isOwner = role === 'owner';
  const isAdmin = role === 'admin';
  const isContentManager = role === 'content_manager';
  // Owner and Admin can both invite; only the Owner can list/remove members.
  const canInviteTeam = isOwner || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        isAuthenticated,
        user,
        role,
        isOwner,
        isAdmin,
        isContentManager,
        canInviteTeam,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};