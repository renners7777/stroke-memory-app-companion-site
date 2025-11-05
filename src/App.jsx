import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import CaregiverDashboard from './components/CaregiverDashboard';
import SurvivorDashboard from './components/SurvivorDashboard';
import Header from './components/Header';
import { useState, useEffect } from 'react';
import { account, databases } from './lib/appwrite'; // Import databases
import PropTypes from 'prop-types';
import './App.css';

// Helper to render the correct dashboard based on user role
const DashboardRenderer = ({ user }) => {
  // This check is now the key. It waits for the full user profile.
  if (!user || !user.role) {
    return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;
  }

  if (user.role === 'companion') {
    return <CaregiverDashboard user={user} />;
  }

  if (user.role === 'survivor') {
    return <SurvivorDashboard user={user} />;
  }

  return <div>Error: Could not determine user role.</div>;
};

DashboardRenderer.propTypes = {
  user: PropTypes.object,
};

const App = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // This effect now fetches the complete user profile
  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      try {
        // 1. Check for an active session and get the basic user
        const user = await account.get();
        
        // 2. Fetch the full user document from the database
        const fullUserProfile = await databases.getDocument(
          '68b213e7001400dc7f21', // Database ID
          'users',               // Users collection ID
          user.$id             // User ID from the session
        );
        
        // 3. Set the complete user object in state
        setLoggedInUser(fullUserProfile);

      } catch (error) {
        // If there's no session or the user doc isn't found, stay logged out
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
      <Header loggedInUser={loggedInUser} setLoggedInUser={setLoggedInUser} />
      
      <main>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route 
            path="/login" 
            element={!loggedInUser ? <Login setLoggedInUser={setLoggedInUser} /> : <Navigate to="/dashboard" replace />}
          />

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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </Router>
  );
};

export default App;
