import { useState, useEffect } from 'react';
import { databases, ID, Query } from '../lib/appwrite';
import PropTypes from 'prop-types';
import Chat from './Chat';

const CaregiverDashboard = ({ user }) => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminderTitle, setNewReminderTitle] = useState(''); // Renamed state for clarity
  const [newReminderDate, setNewReminderDate] = useState('');
  const [error, setError] = useState(null);
  const [shareableIdInput, setShareableIdInput] = useState('');

  const fetchPatients = async () => {
    try {
      const response = await databases.listDocuments(
        '68b213e7001400dc7f21',
        'users',
        [Query.equal('caregiver_id', user.$id)]
      );
      setPatients(response.documents);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
      setError('Could not fetch your patient list.');
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [user.$id]);

  useEffect(() => {
    if (!selectedPatient) {
      setReminders([]);
      setJournalEntries([]);
      return;
    }

    const fetchData = async () => {
      setError(null);
      try {
        const commonQuery = [Query.equal('userID', selectedPatient.$id)];
        const reminderResponse = await databases.listDocuments(
          '68b213e7001400dc7f21',
          'reminders_table',
          commonQuery
        );
        setReminders(reminderResponse.documents);

        const journalResponse = await databases.listDocuments(
          '68b213e7001400dc7f21',
          'journal_table',
          commonQuery
        );
        setJournalEntries(journalResponse.documents);
      } catch (err) {
        console.error(`Failed to fetch data for ${selectedPatient.name}:`, err);
        setError(`Could not load data for ${selectedPatient.name}. Please check collection permissions.`);
      }
    };

    fetchData();
  }, [selectedPatient]);

  const handleLinkPatient = async (e) => {
    e.preventDefault();
    setError(null);
    if (!shareableIdInput.trim()) {
      setError('Please enter a shareable ID.');
      return;
    }
    try {
      const patientResponse = await databases.listDocuments(
        '68b213e7001400dc7f21',
        'users',
        [Query.equal('shareable_id', shareableIdInput.trim())]
      );

      if (patientResponse.documents.length === 0) {
        setError('No patient found with that ID.');
        return;
      }

      const patientToLink = patientResponse.documents[0];
      await databases.updateDocument(
        '68b213e7001400dc7f21',
        'users',
        patientToLink.$id,
        { caregiver_id: user.$id }
      );

      setShareableIdInput('');
      await fetchPatients();
    } catch (err) {
      console.error('Failed to link patient:', err);
      setError(`Failed to link patient: ${err.message}. Check collection permissions.`);
    }
  };

  // Corrected reminder creation to use 'title' attribute
  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!newReminderTitle || !newReminderDate || !selectedPatient) return;

    setError(null);
    try {
      await databases.createDocument(
        '68b213e7001400dc7f21',
        'reminders_table',
        ID.unique(),
        {
          userID: selectedPatient.$id,
          creatorID: user.$id,
          title: newReminderTitle, // Corrected attribute
          reminder_date: newReminderDate,
          completed: false,
        }
      );
      const reminderResponse = await databases.listDocuments(
        '68b213e7001400dc7f21', 'reminders_table', [Query.equal('userID', selectedPatient.$id)]
      );
      setReminders(reminderResponse.documents);
      setNewReminderTitle('');
      setNewReminderDate('');
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
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Your Patients</h2>
              <ul className="space-y-3">
                {patients.length > 0 ? (
                  patients.map(patient => (
                    <li key={patient.$id}>
                      <button onClick={() => setSelectedPatient(patient)} className={`w-full text-left px-4 py-3 rounded-md transition-colors ${selectedPatient?.$id === patient.$id ? 'bg-indigo-500 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>
                        {patient.name}
                      </button>
                    </li>
                  ))
                ) : (
                  <p className="text-slate-500">No patients linked yet.</p>
                )}
              </ul>
            </div>

            <div className="bg-white p-6 shadow-lg rounded-lg">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Link to a New Patient</h2>
                <form onSubmit={handleLinkPatient} className="space-y-4">
                    <div>
                        <label htmlFor="shareableIdInput" className="block text-sm font-medium text-slate-700">Patient's Shareable ID</label>
                        <input id="shareableIdInput" type="text" value={shareableIdInput} onChange={e => setShareableIdInput(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                    <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Link Patient</button>
                </form>
            </div>

          </div>

          <div className="lg:col-span-2">
            {selectedPatient ? (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">Reminders for {selectedPatient.name}</h2>
                  <div className="bg-white p-6 shadow-lg rounded-lg">
                    <ul className="space-y-4 mb-6">
                      {reminders.length > 0 ? (
                        reminders.map(reminder => (
                          <li key={reminder.$id} className={`p-4 rounded-md ${reminder.completed ? 'bg-green-100' : 'bg-yellow-100'}`}>
                            <p className="font-medium">{reminder.title}</p> {/* Corrected attribute */}
                            <p className="text-sm text-slate-600">Due: {new Date(reminder.reminder_date).toLocaleString()}</p>
                            <p className={`text-sm font-semibold ${reminder.completed ? 'text-green-700' : 'text-yellow-700'}`}>
                              Status: {reminder.completed ? 'Completed' : 'Pending'}
                            </p>
                          </li>
                        ))
                      ) : (
                        <p className="text-slate-500">No reminders set for {selectedPatient.name}.</p>
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
                            <input type="datetime-local" id="reminderDate" value={newReminderDate} onChange={e => setNewReminderDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                          </div>
                          <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Add Reminder</button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Journal Entries from {selectedPatient.name}</h2>
                     <div className="bg-white p-6 shadow-lg rounded-lg">
                        <ul className="space-y-4">
                        {journalEntries.length > 0 ? (
                            journalEntries.map(entry => (
                            <li key={entry.$id} className="p-4 bg-slate-50 rounded-md">
                                <p className="text-sm text-slate-500 mb-2">Logged on: {new Date(entry.$createdAt).toLocaleString()}</p>
                                <p>{entry.entry_text}</p>
                            </li>
                            ))
                        ) : (
                            <p className="text-slate-500">No journal entries from {selectedPatient.name} yet.</p>
                        )}
                        </ul>
                    </div>
                </div>

                <div>
                    <Chat user={user} selectedUser={selectedPatient} />
                </div>

              </div>
            ) : (
              <div className="bg-white p-6 shadow-lg rounded-lg text-center">
                <p className="text-slate-500">Select or link to a patient to view their details.</p>
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
