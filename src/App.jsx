import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import CaregiverDashboard from './components/CaregiverDashboard';
import { useState, useEffect, useCallback } from 'react';
import { account, tables, Query } from './lib/appwrite';
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
      
      const progress = await tables.listDocuments(
        '68b213e7001400dc7f21',
        'progress_table',
        [Query.equal('userId', userId)]
      );
      console.log('Progress data:', progress.documents);
      setUserProgress(progress.documents);

      const userReminders = await tables.listDocuments(
        '68b213e7001400dc7f21',
        'reminders_table',
        [Query.equal('userId', userId)]
      );
      setReminders(userReminders.documents);

      const entries = await tables.listDocuments(
        '68b213e7001400dc7f21',
        'journal_table',
        [Query.equal('userId', userId)]
      );
      setJournalEntries(entries.documents);
    } catch (error) {
      console.error('Data fetch failed:', error);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      console.log('Checking authentication...');
      const user = await account.get();
      console.log('User found:', user);
      setLoggedInUser(user);
      if (user) {
        await fetchUserData(user.$id);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setLoggedInUser(null);
    }
  }, [fetchUserData]);

  useEffect(() => {
    // Check if user is already logged in
    checkAuth();
  }, [checkAuth]);

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
