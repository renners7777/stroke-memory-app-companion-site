import { useState, useEffect } from 'react';
import { databases, ID, Query, Permission, Role } from '../lib/appwrite';
import PropTypes from 'prop-types';
import Messaging from './Messaging';

const PatientDashboard = ({ user }) => {
  const [reminders, setReminders] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [newJournalEntry, setNewJournalEntry] = useState('');
  const [error, setError] = useState(null);
  const [companion, setCompanion] = useState(null);

  // Fetch companion info
  useEffect(() => {
    const fetchCompanion = async () => {
      if (user.prefs.caregiver_id) {
          try {
              const response = await databases.getDocument(
                  '68b213e7001400dc7f21', // Database ID
                  'users',                // Correct Collection ID
                  user.prefs.caregiver_id
              );
              setCompanion(response);
          } catch(err) {
              console.error("Failed to fetch companion:", err);
              setError("Could not load your companion's details. Please ensure the user ID is correct.");
          }
      }
    };
    fetchCompanion();
  }, [user.prefs.caregiver_id]);

  // Fetch reminders and journal entries
  useEffect(() => {
    const fetchPatientData = async () => {
      setError(null);
      try {
        // Fetch reminders
        const reminderResponse = await databases.listDocuments(
          '68b213e7001400dc7f21', // Your database ID
          'reminders_table',      // Your reminders collection ID
          [Query.equal('userID', user.$id)]
        );
        setReminders(reminderResponse.documents);

        // Fetch journal entries
        const journalResponse = await databases.listDocuments(
          '68b213e7001400dc7f21', // Your database ID
          'journal_table',     // Your journal entries collection ID
          [Query.equal('userID', user.$id)]
        );
        setJournalEntries(journalResponse.documents);

      } catch (err) {
        console.error('Failed to fetch patient data:', err);
        setError('Failed to load your data. Please check collection permissions and ensure you are connected to a caregiver.');
      }
    };

    fetchPatientData();
  }, [user.$id]);

  const handleAddJournalEntry = async (e) => {
    e.preventDefault();
    if (!newJournalEntry.trim()) return;

    setError(null);
    try {
      await databases.createDocument(
        '68b213e7001400dc7f21',
        'journal_table',
        ID.unique(),
        {
          userID: user.$id,
          entry_text: newJournalEntry,
        },
        [
            Permission.read(Role.user(user.$id)),
            Permission.read(Role.user(user.prefs.caregiver_id)), // Allow caregiver to read
            Permission.update(Role.user(user.$id)),
            Permission.delete(Role.user(user.$id)),
        ]
      );
      setNewJournalEntry('');

      // Refresh journal entries
      const journalResponse = await databases.listDocuments(
        '68b213e7001400dc7f21', 
        'journal_table', 
        [Query.equal('userID', user.$id)]
      );
      setJournalEntries(journalResponse.documents);

    } catch (err) {
      console.error('Failed to add journal entry:', err);
      setError('Failed to add journal entry. Check collection-level permissions.');
    }
  };

  const handleToggleReminder = async (reminderId, currentStatus) => {
    setError(null);
    try {
      await databases.updateDocument(
        '68b213e7001400dc7f21', 
        'reminders_table', 
        reminderId, 
        { completed: !currentStatus }
      );

      // Refresh reminders list
      const reminderResponse = await databases.listDocuments(
        '68b213e7001400dc7f21', 
        'reminders_table', 
        [Query.equal('userID', user.$id)]
      );
      setReminders(reminderResponse.documents);

    } catch (err) {
      console.error('Failed to update reminder:', err);
      setError('Failed to update reminder status. Please check your permissions.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome, {user.name}!</h1>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content: Reminders and Journal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Reminders Section */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Reminders</h2>
                <div className="bg-white p-6 shadow-lg rounded-lg">
                    <ul className="space-y-4">
                    {reminders.length > 0 ? (
                        reminders.map(reminder => (
                        <li key={reminder.$id} className="flex items-center justify-between p-4 rounded-md bg-yellow-100">
                            <div>
                                <p className="font-medium">{reminder.reminder_text}</p>
                                <p className="text-sm text-gray-600">Due: {new Date(reminder.reminder_date).toLocaleString()}</p>
                            </div>
                            <button 
                                onClick={() => handleToggleReminder(reminder.$id, reminder.completed)}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${reminder.completed ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                                {reminder.completed ? 'Completed' : 'Mark as Complete'}
                            </button>
                        </li>
                        ))
                    ) : (
                        <p className="text-gray-500">No reminders from your companion yet.</p>
                    )}
                    </ul>
                </div>
            </div>

            {/* Journal Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Private Journal</h2>
              <div className="bg-white p-6 shadow-lg rounded-lg">
                <form onSubmit={handleAddJournalEntry} className="mb-6">
                    <textarea 
                        value={newJournalEntry}
                        onChange={(e) => setNewJournalEntry(e.target.value)}
                        rows="4"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="What's on your mind today?">
                    </textarea>
                    <button type="submit" className="mt-3 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Add Entry</button>
                </form>
                <ul className="space-y-4">
                    {journalEntries.length > 0 ? (
                        journalEntries.map(entry => (
                        <li key={entry.$id} className="p-4 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-500 mb-2">Logged on: {new Date(entry.$createdAt).toLocaleString()}</p>
                            <p>{entry.entry_text}</p>
                        </li>
                        ))
                    ) : (
                        <p className="text-gray-500">No entries yet.</p>
                    )}
                </ul>
              </div>
            </div>
          </div>

          {/* Side Content: Messaging */}
          <div className="lg:col-span-1">
            <Messaging user={user} companion={companion} />
          </div>

        </div>
      </div>
    </div>
  );
};

PatientDashboard.propTypes = {
  user: PropTypes.object.isRequired,
};

export default PatientDashboard;
