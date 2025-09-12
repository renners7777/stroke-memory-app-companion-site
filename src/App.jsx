import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import CaregiverDashboard from './components/CaregiverDashboard';
import { useState, useEffect, useCallback } from 'react';
import { account, databases, Query } from './lib/appwrite';
import PropTypes from 'prop-types';
import './App.css';

const App = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state

  const fetchUserData = useCallback(async (userId) => {
    try {
      console.log('Fetching data for user:', userId);
      const progress = await databases.listDocuments(
        '68b213e7001400dc7f21',
        'progress_table',
        [Query.equal('userID', userId)]
      );
      setUserProgress(progress.documents);

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

  // Centralized logout function
  const logout = async () => {
    try {
      await account.deleteSession('current');
      setLoggedInUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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

  useEffect(() => {
    if (loggedInUser) {
      console.log('User logged in, fetching data...');
      fetchUserData(loggedInUser.$id);
    } else {
      console.log('User logged out, clearing data...');
      setUserProgress(null);
      setReminders([]);
      setJournalEntries([]);
    }
  }, [loggedInUser, fetchUserData]);

  if (loading) {
    return <div>Loading...</div>; // Show a loading indicator while checking session
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
              <CaregiverDashboard 
                user={loggedInUser}
                logout={logout} // Pass the centralized logout function
                userProgress={userProgress}
                reminders={reminders}
                setReminders={setReminders} // Pass the setter function down
                journalEntries={journalEntries}
              />
            ) : (
              <Navigate to="/" replace /> // On logout, redirect to HOME page
            )
          } 
        />
      </Routes>
    </Router>
  );
};

App.propTypes = {
  children: PropTypes.node
};

export default App;
