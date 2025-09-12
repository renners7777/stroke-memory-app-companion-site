import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import CaregiverDashboard from './components/CaregiverDashboard';
import PatientDashboard from './components/PatientDashboard';
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
        reminders={reminders}
        setReminders={setReminders} 
        journalEntries={journalEntries}
      />
    );
  }

  if (userRole === 'patient') {
    return (
      <PatientDashboard 
        user={user}
        logout={logout}
        reminders={reminders}
        journalEntries={journalEntries}
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

  // This function is now only for patients, as caregivers fetch patient data separately.
  const fetchPatientData = useCallback(async (userId) => {
    try {
      console.log('Fetching data for patient:', userId);
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

  // When a user logs in, fetch their role from the 'users' table and their data
  useEffect(() => {
    const fetchRoleAndData = async () => {
      if (!loggedInUser) {
        setUserRole(null);
        setReminders([]);
        setJournalEntries([]);
        return;
      }

      console.log('User logged in, fetching role from database...');
      try {
        // Fetch the user's document from the 'users' collection
        const userDoc = await databases.getDocument(
          '68b213e7001400dc7f21', // Database ID
          'users',              // Users collection ID
          loggedInUser.$id      // User's document ID
        );
        
        const role = userDoc.role;
        if (role) {
          setUserRole(role);
          console.log('User role set from database:', role);
          // If the user is a patient, fetch their initial data.
          // A caregiver's dashboard handles its own data fetching based on the selected patient.
          if (role === 'patient') {
            fetchPatientData(loggedInUser.$id);
          }
        } else {
           throw new Error('Role not found in user document.');
        }

      } catch (error) {
        console.error('Error fetching user role:', error);
        // Fallback or error handling
        setUserRole(null);
      }
    };
    
    fetchRoleAndData();
  }, [loggedInUser, fetchPatientData]);

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
