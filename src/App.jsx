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
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-white py-6 flex flex-col justify-center sm:py-12">
      {!loggedInUser ? (
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
            <div className="max-w-md mx-auto">
              <div className="divide-y divide-gray-200">
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">Stroke Memory App</h1>
                  <h2 className="text-xl text-center mb-8 text-gray-600">Caregiver Portal</h2>
                  <form className="space-y-6">
                    <div className="relative">
                      <input 
                        type="email" 
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600"
                      />
                      <label className="absolute left-0 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">
                        Email
                      </label>
                    </div>
                    <div className="relative">
                      <input 
                        type="password"
                        placeholder="Password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600"
                      />
                      <label className="absolute left-0 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">
                        Password
                      </label>
                    </div>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Name" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600"
                      />
                      <label className="absolute left-0 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">
                        Name
                      </label>
                    </div>
                    <div className="flex gap-4 mt-8">
                      <button
                        type="button"
                        onClick={() => login(email, password)}
                        className="bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 w-full transition-colors"
                      >
                        Login
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await account.create(ID.unique(), email, password, name);
                          login(email, password);
                        }}
                        className="bg-white text-blue-600 border-2 border-blue-600 rounded-md px-4 py-2 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 w-full transition-colors"
                      >
                        Register
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <CaregiverDashboard />
      )}
    </div>
  );
};

export default App;
