import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

  // On initial app load, check if there's an active session.
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Checking initial session...');
        const user = await account.get();
        setLoggedInUser(user);
      } catch (error) {
        setLoggedInUser(null);
      }
    };
    checkSession();
  }, []);

  // When login state changes, fetch or clear data.
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

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/login" 
          element={
            !loggedInUser ? (
              <Login setLoggedInUser={setLoggedInUser} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            loggedInUser ? (
              <CaregiverDashboard 
                user={loggedInUser}
                setLoggedInUser={setLoggedInUser}
                userProgress={userProgress}
                reminders={reminders}
                journalEntries={journalEntries}
              />
            ) : (
              <Navigate to="/login" replace />
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
