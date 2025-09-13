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
        setReminders={setReminders}
        journalEntries={journalEntries}
        setJournalEntries={setJournalEntries}
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

  useEffect(() => {
    const fetchUserAndData = async () => {
      if (!loggedInUser) {
        setUserRole(null);
        setReminders([]);
        setJournalEntries([]);
        return;
      }

      try {
        const response = await databases.listDocuments(
          '68b213e7001400dc7f21', // Database ID
          'users', // Collection ID
          [Query.equal('$id', loggedInUser.$id)]
        );

        if (response.documents.length === 0) {
          throw new Error('User document not found for the logged in user.');
        }

        const userDoc = response.documents[0];
        const role = userDoc.role;
        
        if (!role) {
          throw new Error("Role not found in user document.");
        }
        
        setUserRole(role);

        if (role === 'patient') {
          const [remindersResponse, journalResponse] = await Promise.all([
              databases.listDocuments('68b213e7001400dc7f21', 'reminders_table', [Query.equal('userID', loggedInUser.$id)]),
              databases.listDocuments('68b213e7001400dc7f21', 'journal_table', [Query.equal('userID', loggedInUser.$id)])
          ]);
          setReminders(remindersResponse.documents);
          setJournalEntries(journalResponse.documents);
        }

      } catch (error) {
        // *** DIAGNOSTIC STEP ***
        // The most important step. Log the full error to the console.
        console.error('--- DIAGNOSTIC ERROR ---');
        console.error('Failed to fetch user role or initial data:', error);
        setUserRole(null); // Reset on error
      }
    };
    
    fetchUserAndData();
  }, [loggedInUser]);

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
