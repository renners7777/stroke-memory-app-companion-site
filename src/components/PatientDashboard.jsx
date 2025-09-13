import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { databases, ID, Query } from '../lib/appwrite';
import Messaging from './Messaging';

// PatientDashboard component
const PatientDashboard = ({ user, logout }) => {
  const [userShareableId, setUserShareableId] = useState('');
  const [companion, setCompanion] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [newJournalEntry, setNewJournalEntry] = useState('');

  // Effect to fetch initial data on component mount
  useEffect(() => {
    // Fetches the user's shareable ID
    const fetchUserShareableId = async () => {
      try {
        const userDoc = await databases.getDocument('68b213e7001400dc7f21', 'users', user.$id);
        setUserShareableId(userDoc.shareable_id);
      } catch (err) {
        console.error('Error fetching user shareable ID:', err);
      }
    };

    // Fetches the companion associated with the patient
    const fetchCompanion = async () => {
      try {
        const response = await databases.listDocuments(
          '68b213e7001400dc7f21',
          'user_relationships',
          [Query.equal('patient_id', user.$id)]
        );

        if (response.documents.length > 0) {
          const companionId = response.documents[0].companion_id;
          const companionDoc = await databases.getDocument('68b213e7001400dc7f21', 'users', companionId);
          setCompanion(companionDoc);
        }
      } catch (err) {
        console.error('Error fetching companion:', err);
      }
    };

    fetchUserShareableId();
    fetchCompanion();
  }, [user.$id]);

  // Effect to fetch reminders and journal entries
  useEffect(() => {
    if (!user) return;

    // Fetches reminders
    const fetchReminders = async () => {
      try {
        const response = await databases.listDocuments('68b213e7001400dc7f21', 'reminders_table', [Query.equal('userID', user.$id)]);
        setReminders(response.documents);
      } catch (error) {
        console.error("Failed to fetch reminders:", error);
      }
    };

    // Fetches journal entries
    const fetchJournals = async () => {
      try {
        const response = await databases.listDocuments('68b213e7001400dc7f21', 'journal_table', [Query.equal('userID', user.$id)]);
        setJournalEntries(response.documents);
      } catch (error) {
        console.error("Failed to fetch journal entries:", error);
      }
    };

    fetchReminders();
    fetchJournals();
  }, [user]);

  // Toggles the completion status of a reminder
  const toggleReminder = async (reminderId, isCompleted) => {
    try {
      const updatedReminder = await databases.updateDocument(
        '68b213e7001400dc7f21',
        'reminders_table',
        reminderId,
        { is_completed: !isCompleted }
      );
      setReminders(prev => prev.map(r => r.$id === reminderId ? updatedReminder : r));
    } catch (error) {
      console.error('Failed to update reminder:', error);
      alert('Failed to update reminder status.');
    }
  };

  // Handles the submission of a new journal entry
  const handleJournalSubmit = async (e) => {
    e.preventDefault();
    if (!newJournalEntry.trim()) return;

    try {
      const newEntry = await databases.createDocument(
        '68b213e7001400dc7f21',
        'journal_table',
        ID.unique(),
        {
          userID: user.$id,
          content: newJournalEntry,
        }
      );
      setJournalEntries(prev => [newEntry, ...prev]);
      setNewJournalEntry('');
    } catch (error) {
      console.error('Failed to add journal entry:', error);
      alert('Failed to add journal entry. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Patient Dashboard</h1>
          <div className="flex items-center">
            <span className="mr-4 text-gray-600">Welcome, {user.name}</span>
            <button onClick={logout} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">Logout</button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left column for Shareable ID */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Your Shareable ID</h2>
              <p className="text-sm text-gray-600 mb-4">Your companion can use this ID to connect to your dashboard.</p>
              <div className="bg-gray-100 p-3 rounded-md text-center">
                <p className="text-xl font-mono text-gray-800 tracking-wider">{userShareableId}</p>
              </div>
            </div>
            {/* Messaging Component */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                {companion ? (
                    <Messaging user={user} companion={companion} />
                ) : (
                    <div className="text-center text-gray-500 py-4">
                        <p>You are not connected with a companion yet. Share your ID to start chatting.</p>
                    </div>
                )}
            </div>
          </div>

          {/* Right columns for data */}
          <div className="md:col-span-2 space-y-8">
            {/* Reminders Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Your Reminders</h2>
              <ul className="space-y-3">
                {reminders.length > 0 ? reminders.map(r => (
                  <li key={r.$id} onClick={() => toggleReminder(r.$id, r.is_completed)} className={`p-4 rounded-md cursor-pointer flex justify-between items-center transition-colors ${r.is_completed ? 'bg-green-100 text-gray-500 line-through' : 'bg-yellow-100 hover:bg-yellow-200'}`}>
                    <span>{r.title}</span>
                    <span className="text-sm">{new Date(r.time).toLocaleString()}</span>
                  </li>
                )) : <p className="text-sm text-gray-500">No reminders set.</p>}
              </ul>
            </div>
            {/* Journal Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Your Journal</h2>
              <form onSubmit={handleJournalSubmit} className="mb-6">
                <textarea
                  value={newJournalEntry}
                  onChange={(e) => setNewJournalEntry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  rows="4"
                  placeholder="How are you feeling today?"
                ></textarea>
                <button type="submit" className="mt-3 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Add Entry
                </button>
              </form>
              <ul className="space-y-4">
                {journalEntries.length > 0 ? journalEntries.map(j => (
                  <li key={j.$id} className="p-4 bg-gray-50 rounded-md border border-gray-200">
                    <p className="text-sm text-gray-800">{j.content}</p>
                    <p className="text-xs text-gray-500 mt-2 text-right">{new Date(j.$createdAt).toLocaleString()}</p>
                  </li>
                )) : <p className="text-sm text-gray-500">No journal entries yet.</p>}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

PatientDashboard.propTypes = {
  user: PropTypes.object.isRequired,
  logout: PropTypes.func.isRequired,
};

export default PatientDashboard;
