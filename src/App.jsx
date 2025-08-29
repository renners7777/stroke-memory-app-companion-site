import { useState, useEffect } from 'react';
import { account, databases, ID, Query } from './lib/appwrite';
import { useCallback } from 'react';

const App = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userProgress, setUserProgress] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);

  const checkAuth = useCallback(async () => {
    try {
      const user = await account.get();
      setLoggedInUser(user);
      if (user) {
        await fetchUserData(user.$id);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
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

  const fetchUserData = useCallback(async (userId) => {
    try {
      // Fetch progress data
      const progress = await databases.listDocuments(
        '68b213e7001400dc7f21',
        'progress_table',  // Updated from progress_collection
        [Query.equal('userId', userId)]
      );
      setUserProgress(progress.documents);

      // Fetch reminders
      const userReminders = await databases.listDocuments(
        '68b213e7001400dc7f21',
        'reminders_table',  // Updated from reminders_collection
        [Query.equal('userId', userId)]
      );
      setReminders(userReminders.documents);

      // Fetch journal entries
      const entries = await databases.listDocuments(
        '68b213e7001400dc7f21',
        'journal_table',  // Updated from journal_collection
        [Query.equal('userId', userId)]
      );
      setJournalEntries(entries.documents);
    } catch (error) {
      console.error('Data fetch failed:', error);
    }
  }, []);

  const CaregiverDashboard = () => (
    <div className="dashboard">
      <h2>Caregiver Dashboard</h2>
      
      <section className="progress-summary">
        <h3>Progress Summary</h3>
        {userProgress && userProgress.map(progress => (
          <div key={progress.$id}>
            {/* Display progress metrics */}
          </div>
        ))}
      </section>

      <section className="reminders">
        <h3>Upcoming Reminders</h3>
        {reminders.map(reminder => (
          <div key={reminder.$id}>
            {/* Display reminder details */}
          </div>
        ))}
      </section>

      <section className="journal">
        <h3>Recent Journal Entries</h3>
        {journalEntries.map(entry => (
          <div key={entry.$id}>
            {/* Display journal entry */}
          </div>
        ))}
      </section>
    </div>
  );

  return (
    <div className="app-container">
      {!loggedInUser ? (
        <div className="auth-form">
          <h1>Stroke Memory App - Caregiver Portal</h1>
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
        <div>
          <nav>
            <span>Welcome, {loggedInUser.name}</span>
            <button
              type="button"
              onClick={async () => {
                await account.deleteSession('current');
                setLoggedInUser(null);
                setUserProgress(null);
                setReminders([]);
                setJournalEntries([]);
              }}
            >
              Logout
            </button>
          </nav>
          <CaregiverDashboard />
        </div>
      )}
    </div>
  );
};

export default App;
