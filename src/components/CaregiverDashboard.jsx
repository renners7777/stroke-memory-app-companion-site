import { useState, useEffect } from 'react';
import { databases, ID, Query } from '../lib/appwrite';
import PropTypes from 'prop-types';
import Chat from './Chat';

const CaregiverDashboard = ({ user }) => {
  const [survivors, setSurvivors] = useState([]);
  const [selectedSurvivor, setSelectedSurvivor] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderDateTime, setNewReminderDateTime] = useState('');
  const [error, setError] = useState(null);
  const [shareableIdInput, setShareableIdInput] = useState('');

  useEffect(() => {
    const loadSurvivorsAndSelectFromUrl = async () => {
      try {
        const response = await databases.listDocuments(
          '68b213e7001400dc7f21',
          'users',
          [Query.equal('caregiver_id', user.$id)]
        );
        const fetchedSurvivors = response.documents;
        setSurvivors(fetchedSurvivors);

        const params = new URLSearchParams(window.location.search);
        const survivorIdFromUrl = params.get('survivor');
        if (survivorIdFromUrl && fetchedSurvivors.length > 0) {
          const survivorToSelect = fetchedSurvivors.find(p => p.$id === survivorIdFromUrl);
          if (survivorToSelect) {
            setSelectedSurvivor(survivorToSelect);
          }
        }
      } catch (err) {
        console.error('Failed to fetch survivors:', err);
        setError('Could not fetch your survivor list.');
      }
    };
    loadSurvivorsAndSelectFromUrl();
  }, [user.$id]);

  useEffect(() => {
    if (!selectedSurvivor) {
      setReminders([]);
      setJournalEntries([]);
      return;
    }

    const fetchData = async () => {
      setError(null);
      try {
        const commonQuery = [Query.equal('userID', selectedSurvivor.$id)];
        const reminderResponse = await databases.listDocuments(
          '68b213e7001400dc7f21',
          'reminders_table',
          commonQuery
        );
        setReminders(reminderResponse.documents);

        const journalResponse = await databases.listDocuments(
          '68b213e7001400dc7f21',
          'journal_table',
          [Query.equal('userID', selectedSurvivor.$id), Query.equal('isSharedWithCaregiver', true)]
        );
        setJournalEntries(journalResponse.documents);
      } catch (err) {
        console.error(`Failed to fetch data for ${selectedSurvivor.name}:`, err);
        setError(`Could not load data for ${selectedSurvivor.name}. Please check collection permissions.`);
      }
    };

    fetchData();
  }, [selectedSurvivor]);

  const handleSurvivorSelection = (survivor) => {
    setSelectedSurvivor(survivor);
    const url = new URL(window.location);
    if (survivor) {
      url.searchParams.set('survivor', survivor.$id);
    } else {
      url.searchParams.delete('survivor');
    }
    window.history.pushState({}, '', url);
  };

  const handleLinkSurvivor = async (e) => {
    e.preventDefault();
    setError(null);
    if (!shareableIdInput.trim()) {
      setError('Please enter a shareable ID.');
      return;
    }
    try {
      const survivorResponse = await databases.listDocuments(
        '68b213e7001400dc7f21',
        'users',
        [Query.equal('shareable_id', shareableIdInput.trim())]
      );

      if (survivorResponse.documents.length === 0) {
        setError('No survivor found with that ID.');
        return;
      }

      const survivorToLink = survivorResponse.documents[0];
      await databases.updateDocument(
        '68b213e7001400dc7f21',
        'users',
        survivorToLink.$id,
        { caregiver_id: user.$id }
      );

      setShareableIdInput('');
      // Re-fetch survivors to get the updated list
      const response = await databases.listDocuments(
        '68b213e7001400dc7f21',
        'users',
        [Query.equal('caregiver_id', user.$id)]
      );
      setSurvivors(response.documents);

    } catch (err) {
      console.error('Failed to link survivor:', err);
      setError(`Failed to link survivor: ${err.message}. Check collection permissions.`);
    }
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!newReminderTitle || !newReminderDateTime || !selectedSurvivor) return;

    setError(null);
    try {
      await databases.createDocument(
        '68b213e7001400dc7f21',
        'reminders_table',
        ID.unique(),
        {
          userID: selectedSurvivor.$id,
          title: newReminderTitle,
          dateTime: newReminderDateTime,
          status: 'pending',
        }
      );
      const reminderResponse = await databases.listDocuments(
        '68b213e7001400dc7f21', 'reminders_table', [Query.equal('userID', selectedSurvivor.$id)]
      );
      setReminders(reminderResponse.documents);
      setNewReminderTitle('');
      setNewReminderDateTime('');
      setShowAddReminder(false);
    } catch (err) {
      console.error('Failed to add reminder:', err);
      setError(`Failed to add reminder: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Companion Dashboard</h1>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-6 shadow-lg rounded-lg">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Your Survivors</h2>
              <ul className="space-y-3">
                {survivors.length > 0 ? (
                  survivors.map(survivor => (
                    <li key={survivor.$id}>
                      <button onClick={() => handleSurvivorSelection(survivor)} className={`w-full text-left px-4 py-3 rounded-md transition-colors ${selectedSurvivor?.$id === survivor.$id ? 'bg-indigo-500 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>
                        {survivor.name}
                      </button>
                    </li>
                  ))
                ) : (
                  <p className="text-slate-500">No survivors linked yet.</p>
                )}
              </ul>
            </div>

            <div className="bg-white p-6 shadow-lg rounded-lg">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Link to a New Survivor</h2>
                <form onSubmit={handleLinkSurvivor} className="space-y-4">
                    <div>
                        <label htmlFor="shareableIdInput" className="block text-sm font-medium text-slate-700">Survivor's Shareable ID</label>
                        <input id="shareableIdInput" type="text" value={shareableIdInput} onChange={e => setShareableIdInput(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                    <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Link Survivor</button>
                </form>
            </div>

          </div>

          <div className="lg:col-span-2">
            {selectedSurvivor ? (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">Reminders for {selectedSurvivor.name}</h2>
                  <div className="bg-white p-6 shadow-lg rounded-lg">
                    <ul className="space-y-4 mb-6">
                      {reminders.length > 0 ? (
                        reminders.map(reminder => (
                          <li key={reminder.$id} className={`p-4 rounded-md ${reminder.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                            <p className="font-medium">{reminder.title}</p>
                            <p className="text-sm text-slate-600">Due: {new Date(reminder.dateTime).toLocaleString()}</p>
                            <p className={`text-sm font-semibold ${reminder.status === 'completed' ? 'text-green-700' : 'text-yellow-700'}`}>
                              Status: {reminder.status === 'completed' ? 'Completed' : 'Pending'}
                            </p>
                          </li>
                        ))
                      ) : (
                        <p className="text-slate-500">No reminders set for {selectedSurvivor.name}.</p>
                      )}
                    </ul>
                    <button onClick={() => setShowAddReminder(!showAddReminder)} className="text-indigo-600 hover:text-indigo-800 font-medium">
                      {showAddReminder ? 'Cancel' : 'Add New Reminder'}
                    </button>
                    {showAddReminder && (
                      <div className="mt-4">
                        <form onSubmit={handleAddReminder} className="space-y-4">
                          <div>
                            <label htmlFor="reminderTitle" className="block text-sm font-medium text-slate-700">Reminder Title</label>
                            <textarea id="reminderTitle" value={newReminderTitle} onChange={e => setNewReminderTitle(e.target.value)} rows="3" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                          </div>
                          <div>
                            <label htmlFor="reminderDate" className="block text-sm font-medium text-slate-700">Date and Time</label>
                            <input type="datetime-local" id="reminderDate" value={newReminderDateTime} onChange={e => setNewReminderDateTime(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                          </div>
                          <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Add Reminder</button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Journal Entries from {selectedSurvivor.name}</h2>
                     <div className="bg-white p-6 shadow-lg rounded-lg">
                        <ul className="space-y-4">
                        {journalEntries.length > 0 ? (
                            journalEntries.map(entry => (
                            <li key={entry.$id} className="p-4 bg-slate-50 rounded-md">
                                <p className="text-sm text-slate-500 mb-2">Logged on: {new Date(entry.dateCreated).toLocaleString()}</p>
                                <h3 className="font-semibold mb-1">{entry.title}</h3>
                                <p>{entry.content}</p>
                            </li>
                            ))
                        ) : (
                            <p className="text-slate-500">No journal entries from {selectedSurvivor.name} yet.</p>
                        )}
                        </ul>
                    </div>
                </div>

                <div>
                    <Chat user={user} selectedUser={selectedSurvivor} />
                </div>

              </div>
            ) : (
              <div className="bg-white p-6 shadow-lg rounded-lg text-center">
                <p className="text-slate-500">Select or link to a survivor to view their details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

CaregiverDashboard.propTypes = {
  user: PropTypes.object.isRequired,
};

export default CaregiverDashboard;
