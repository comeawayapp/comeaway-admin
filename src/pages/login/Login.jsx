import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import companyname from '../../assets/companyname.png';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthContext, STAFF_ROLES } from '../../context/authContext';
import { login } from '../../utils/API_SERVICE';

function Login() {
  const navigate = useNavigate();
  const { login: authLogin } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const response = await login(email, password);
      if (!STAFF_ROLES.includes(response.user.role)) {
        toast.error('Access Denied: Only team members can log in');
        return;
      }
      toast.success('Login Successful');
      authLogin(response.token, response.user); // Assuming the response contains token and user data
      // console.log(response.token, response.user);
      
      setTimeout(() => {
        navigate('/');
      }, 1000); // Delay navigation to allow the toast to show
    } catch (error) {
      toast.error('Invalid email or password');
    }
  };

  return (
    <>
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-brand">
            <img src={companyname} alt="ComeAway" className="h-9" />
          </div>
          <h1 className="auth-title">Admin Sign In</h1>
          <p className="auth-subtitle">
            Sign in with your ComeAway team account to continue.
          </p>

          <form className="auth-form" onSubmit={handleSignIn}>
            <div className="mb-4">
              <label className="auth-label" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="auth-input"
                placeholder="you@comeaway.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="mb-6">
              <label className="auth-label" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="auth-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="auth-submit">
              Sign In
            </button>
          </form>

          <p className="auth-footnote">
            Access is limited to Owner, Admin and Content Manager accounts.
          </p>
        </div>
      </div>
      <ToastContainer position="top-right" theme="dark" />
    </>
  );
}

export default Login;
