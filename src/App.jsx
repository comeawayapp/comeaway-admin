import React, { useContext, useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import "./App.css";
import Login from "./pages/login/Login";
import SetPassword from "./pages/setPassword/SetPassword";
import Home from "./components/Home";
import { AuthProvider, AuthContext } from "./context/authContext";

function App() {
  const { isAuthenticated } = useContext(AuthContext);
  const [isInitialized, setIsInitialized] = useState(false);

  // Add useEffect to handle authentication status
  useEffect(() => {
    // Simulate initialization process
    setIsInitialized(true); // Mark as initialized after checking authentication
    // console.log("Authentication status changed:", isAuthenticated);
  }, [isAuthenticated]);

  if (!isInitialized) {
    // Show a loading state until initialization is complete
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Public: invited team members land here from the set-password email */}
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/accept-invite" element={<SetPassword />} />
        <Route
          path="/*"
          element={isAuthenticated ? <Home /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
