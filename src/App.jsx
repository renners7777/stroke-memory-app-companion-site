import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import CaregiverDashboard from './components/CaregiverDashboard';
import PatientDashboard from './components/PatientDashboard'; // Import new dashboard
import { useState, useEffect, useCallback } from 'react';
import { account, databases, Query } from './lib/appwrite';
import PropTypes from 'prop-types';
import './App.css';

// Helper component to render the correct dashboard based on user role
const DashboardRenderer = ({ userRole, user, logout, reminders, setReminders, journalEntries }) => {
  if (!userRole) {
    return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;
  }

  if (userRole === 'caregiver') {
    return (
      <CaregiverDashboard 
        user={user}
        logout={logout}
        reminders={reminders} // These will be for the selected patient, managed inside the component
        setReminders={setReminders} 
        journalEntries={journalEntries} // Same as above
      />
    );
  }

  if (userRole === 'patient') {
    return (
      <PatientDashboard 
        user={user}
        logout={logout}
        reminders={reminders} // These are the patient's own reminders
        journalEntries={journalEntries} // These are the patient's own journal entries
      />
    );
  }
    
  return <div>Error: Could not determine user role.</div>;
};

DashboardRenderer.propTypes = {
  userRole: PropTypes.string,
  user: PropTypes.object,
  logout: PropTypes.func,
  reminders: PropTypes.array,
  setReminders: PropTypes.func,
  journalEntries: PropTypes.array,
};


const App = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'caregiver' or 'patient'
  const [reminders, setReminders] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (userId, role) => {
    try {
      console.log(`Fetching initial data for ${role}:`, userId);
      // For a patient, fetch their own data. For a caregiver, this will fetch their (likely empty) data.
      // The CaregiverDashboard component is responsible for fetching data for the *selected* patient.
      const userReminders = await databases.listDocuments(
        '68b213e7001400dc7f21',
        'reminders_table',
        [Query.equal('userID', userId)]
      );
      setReminders(userReminders.documents);

      const entries = await databases.listDocuments(
        '68b213e7001400dc7f21',
        'journal_table',
        [Query.equal('userID', userId)]
      );
      setJournalEntries(entries.documents);
    } catch (error) {
      console.error('Data fetch failed:', error);
    }
  }, []);

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setLoggedInUser(null);
      setUserRole(null); // Reset role on logout
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Check for an existing session when the app loads
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Checking initial session...');
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

  // When a user logs in, determine their role and fetch their initial data
  useEffect(() => {
    const determineRoleAndFetchData = async () => {
      if (!loggedInUser) {
        setUserRole(null);
        setReminders([]);
        setJournalEntries([]);
        return;
      }

      console.log('User logged in, determining role...');
      try {
        // Check if this user is a companion in any relationship
        const response = await databases.listDocuments(
          '68b213e7001400dc7f21', // Database ID
          'user_relationships',     // Collection ID for relationships
          [Query.equal('companion_id', loggedInUser.$id)]
        );
        
        const role = response.documents.length > 0 ? 'caregiver' : 'patient';
        setUserRole(role);
        console.log('User role determined as:', role);
        
        // Fetch initial data relevant to the logged-in user
        fetchUserData(loggedInUser.$id, role);

      } catch (error) {
        console.error('Error determining user role:', error);
        // Default to patient role on error to avoid blocking the user
        setUserRole('patient');
        fetchUserData(loggedInUser.$id, 'patient');
      }
    };
    
    determineRoleAndFetchData();
  }, [loggedInUser, fetchUserData]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Router>
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
              <DashboardRenderer
                userRole={userRole}
                user={loggedInUser}
                logout={logout}
                reminders={reminders}
                setReminders={setReminders}
                journalEntries={journalEntries}
              />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;
