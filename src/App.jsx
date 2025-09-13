import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import CaregiverDashboard from './components/CaregiverDashboard';
import PatientDashboard from './components/PatientDashboard';
import Header from './components/Header'; // Import the new Header
import { useState, useEffect } from 'react';
import { account } from './lib/appwrite';
import PropTypes from 'prop-types';
import './App.css';

// Helper to render the correct dashboard based on user role
const DashboardRenderer = ({ user }) => {
  if (!user || !user.role) {
    return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;
  }

  if (user.role === 'caregiver') {
    return <CaregiverDashboard user={user} />;
  }

  if (user.role === 'patient') {
    return <PatientDashboard user={user} />;
  }

  return <div>Error: Could not determine user role.</div>;
};

DashboardRenderer.propTypes = {
  user: PropTypes.object,
};

const App = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      try {
        const user = await account.get();
        setLoggedInUser(user);
      } catch (error) {
        setLoggedInUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Router>
      {/* The Header is now part of the main layout */}
      <Header loggedInUser={loggedInUser} setLoggedInUser={setLoggedInUser} />
      
      <main>
        <Routes>
          {/* Home route is always available */}
          <Route path="/" element={<Home />} />

          {/* Login route only accessible when logged out */}
          <Route 
            path="/login" 
            element={!loggedInUser ? <Login setLoggedInUser={setLoggedInUser} /> : <Navigate to="/dashboard" replace />}
          />

          {/* Dashboard is protected and only accessible when logged in */}
          <Route 
            path="/dashboard" 
            element={
              loggedInUser ? (
                <DashboardRenderer user={loggedInUser} />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />

          {/* Redirect any other path to the home page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </Router>
  );
};

export default App;
