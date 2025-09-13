import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import CaregiverDashboard from './components/CaregiverDashboard';
import PatientDashboard from './components/PatientDashboard';
import { useState, useEffect } from 'react';
import { account, databases, Query } from './lib/appwrite';
import PropTypes from 'prop-types';
import './App.css';

// Helper component to render the correct dashboard based on user role
const DashboardRenderer = ({ userRole, user, logout, reminders, setReminders, journalEntries, setJournalEntries }) => {
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
        setJournalEntries={setJournalEntries}
      />
    );
  }

  if (userRole === 'patient') {
    return (
      <PatientDashboard 
        user={user}
        logout={logout}
        reminders={reminders}
        setReminders={setReminders} // <-- FIX: Pass setter to PatientDashboard
        journalEntries={journalEntries}
        setJournalEntries={setJournalEntries} // <-- FIX: Pass setter to PatientDashboard
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
  setJournalEntries: PropTypes.func,
};


const App = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setLoggedInUser(null);
      setUserRole(null); 
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Check for an existing session when the app loads
  useEffect(() => {
    const checkSession = async () => {
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

  // When a user logs in, determine their role and fetch initial data
  useEffect(() => {
    const fetchUserAndData = async () => {
      if (!loggedInUser) {
        setUserRole(null);
        setReminders([]);
        setJournalEntries([]);
        return;
      }

      try {
        // 1. Fetch the user's own document to determine their role.
        // This requires the document-level permission to be set correctly on creation.
        const userDoc = await databases.getDocument('68b213e7001400dc7f21', 'users', loggedInUser.$id);
        const role = userDoc.role;

        if (!role) {
          throw new Error("Role not found in user document.");
        }
        
        setUserRole(role);

        // 2. If the user is a patient, fetch their specific data.
        // (Caregivers fetch data for their selected patient inside their own dashboard).
        if (role === 'patient') {
          const [remindersResponse, journalResponse] = await Promise.all([
              databases.listDocuments('68b213e7001400dc7f21', 'reminders_table', [Query.equal('userID', loggedInUser.$id)]),
              databases.listDocuments('68b213e7001400dc7f21', 'journal_table', [Query.equal('userID', loggedInUser.$id)])
          ]);
          setReminders(remindersResponse.documents);
          setJournalEntries(journalResponse.documents);
        }

      } catch (error) {
        console.error('Failed to fetch user role or initial data:', error);
        setUserRole(null); // Reset on error to prevent inconsistent states
      }
    };
    
    fetchUserAndData();
  }, [loggedInUser]); // Dependency is solely on the loggedInUser object

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
                setJournalEntries={setJournalEntries}
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
