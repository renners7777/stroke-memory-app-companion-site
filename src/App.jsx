import { useState, useEffect, useCallback } from 'react';
import { account, databases, ID, Query } from './lib/appwrite';
import './App.css';

const App = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userProgress, setUserProgress] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);

  // Move fetchUserData definition before checkAuth
  const fetchUserData = useCallback(async (userId) => {
    try {
      console.log('Fetching data for user:', userId);
      
      const progress = await databases.listDocuments(
        '68b213e7001400dc7f21',
        'progress_table',
        [Query.equal('userId', userId)]
      );
      console.log('Progress data:', progress.documents);
      setUserProgress(progress.documents);

      const userReminders = await databases.listDocuments(
        '68b213e7001400dc7f21',
        'reminders_table',
        [Query.equal('userId', userId)]
      );
      setReminders(userReminders.documents);

      const entries = await databases.listDocuments(
        '68b213e7001400dc7f21',
        'journal_table',
        [Query.equal('userId', userId)]
      );
      setJournalEntries(entries.documents);
    } catch (error) {
      console.error('Data fetch failed:', error);
    }
  }, []);

  // Then define checkAuth
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

  async function login(email, password) {
    try {
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      setLoggedInUser(user);
      await fetchUserData(user.$id);
    } catch (error) {
      console.error('Login failed:', error);
    }
  }

  const CaregiverDashboard = () => (
    <div className="dashboard">
      <h2>Caregiver Dashboard</h2>
      
      <section className="progress-summary">
        <h3>Progress Summary</h3>
        {userProgress && userProgress.map(progress => (
          <div key={progress.$id}>
            <p>Date: {new Date(progress.date).toLocaleDateString()}</p>
            <p>Memory Score: {progress.memoryScore}</p>
            <p>Cognition Score: {progress.cognitionScore}</p>
          </div>
        ))}
      </section>

      <section className="reminders">
        <h3>Upcoming Reminders</h3>
        {reminders.map(reminder => (
          <div key={reminder.$id}>
            <p>Title: {reminder.title}</p>
            <p>Due: {new Date(reminder.dateTime).toLocaleString()}</p>
            <p>Status: {reminder.status}</p>
          </div>
        ))}
      </section>

      <section className="journal">
        <h3>Recent Journal Entries</h3>
        {journalEntries.map(entry => (
          <div key={entry.$id}>
            <p>Title: {entry.title}</p>
            <p>Date: {new Date(entry.dateCreated).toLocaleDateString()}</p>
            <p>Content: {entry.content}</p>
          </div>
        ))}
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {!loggedInUser ? (
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">Stroke Memory App - Caregiver Portal</h1>
          <form>
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
            <input 
              type="text" 
              placeholder="Name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />

            <button type="button" onClick={() => login(email, password)}>
              Login
            </button>

            <button
              type="button"
              onClick={async () => {
                await account.create(ID.unique(), email, password, name);
                login(email, password);
              }}
            >
              Register
            </button>
          </form>
        </div>
      ) : (
        <CaregiverDashboard />
      )}
    </div>
  );
};

export default App;
