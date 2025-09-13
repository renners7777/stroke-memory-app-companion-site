import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { databases, ID, Permission, Role, Query } from '../lib/appwrite';
import Chat from './Chat';

const CaregiverDashboard = ({ user, logout }) => {
  const [associatedUsers, setAssociatedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUserShareableId, setNewUserShareableId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [reminders, setReminders] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderDate, setNewReminderDate] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch initial list of connected patients
  useEffect(() => {
    const fetchAssociatedUsers = async () => {
      try {
        setLoading(true);
        const relationships = await databases.listDocuments(
          '68b213e7001400dc7f21', 
          'user_relationships',
          [Query.equal('companion_id', user.$id)]
        );

        if (relationships.documents.length > 0) {
          const patientIds = relationships.documents.map(rel => rel.patient_id);
          const patientDocs = await databases.listDocuments(
            '68b213e7001400dc7f21',
            'users',
            [Query.equal('$id', patientIds)]
          );
          setAssociatedUsers(patientDocs.documents);
          if (patientDocs.documents.length > 0) {
            setSelectedUser(patientDocs.documents[0]);
          }
        }
      } catch (err) {
        // If the collection doesn't exist, it's not a critical error on load.
        if (err.code !== 404) {
          console.error('Failed to fetch associated users:', err);
          setError('Could not load your patient list.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAssociatedUsers();
  }, [user.$id]);

  // When the selected patient changes, fetch their data
  useEffect(() => {
    const fetchDataForSelectedUser = async () => {
      if (!selectedUser) {
        setReminders([]);
        setJournalEntries([]);
        return;
      }

      try {
        const [remindersList, journalsList] = await Promise.all([
          databases.listDocuments('68b213e7001400dc7f21', 'reminders_table', [Query.equal('userID', selectedUser.$id)]),
          databases.listDocuments('68b213e7001400dc7f21', 'journal_table', [Query.equal('userID', selectedUser.$id)])
        ]);
        setReminders(remindersList.documents);
        setJournalEntries(journalsList.documents);
      } catch (err) {
        console.error(`Failed to fetch data for ${selectedUser.name}:`, err);
        setError(`Could not load data for ${selectedUser.name}.`);
      }
    };

    fetchDataForSelectedUser();
  }, [selectedUser]);

  const handleAddUser = async () => {
    setError('');
    setSuccess('');
    if (!newUserShareableId) return;

    try {
      const userList = await databases.listDocuments(
        '68b213e7001400dc7f21',
        'users',
        [
          Query.equal('shareable_id', newUserShareableId),
          Query.equal('role', 'patient')
        ]
      );

      if (userList.documents.length === 0) {
        setError('No patient found with this ID. Please ask the patient to share their ID from their dashboard.');
        return;
      }

      const userToAdd = userList.documents[0];

      if (associatedUsers.some(u => u.$id === userToAdd.$id)) {
        setError(`${userToAdd.name} is already in your list.`);
        return;
      }

      await databases.createDocument(
        '68b213e7001400dc7f21',
        'user_relationships',
        ID.unique(),
        {
          companion_id: user.$id,
          patient_id: userToAdd.$id
        },
        [
          Permission.read(Role.user(user.$id)),
          Permission.write(Role.user(user.$id)),
          Permission.read(Role.user(userToAdd.$id)),
          Permission.write(Role.user(userToAdd.$id))
        ]
      );
      
      setSuccess(`Successfully connected with ${userToAdd.name}.`);
      setNewUserShareableId('');
      const newAssociatedUsers = [...associatedUsers, userToAdd];
      setAssociatedUsers(newAssociatedUsers);
      setSelectedUser(userToAdd);

    } catch (err) {
      console.error('Error adding user:', err);
      setError('Failed to add user. Please check the ID and try again.');
    }
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!newReminderTitle || !newReminderDate || !selectedUser) {
      alert('Please fill in all fields and select a user.');
      return;
    }
    try {
      const newReminder = await databases.createDocument(
        '68b213e7001400dc7f21',
        'reminders_table',
        ID.unique(),
        {
          userID: selectedUser.$id,
          title: newReminderTitle,
          time: newReminderDate,
        },
        [
          Permission.read(Role.user(selectedUser.$id)),
          Permission.read(Role.user(user.$id)),
          Permission.write(Role.user(selectedUser.$id)),
          Permission.write(Role.user(user.$id)),
        ]
      );
      setReminders(prev => [...prev, newReminder]);
      setNewReminderTitle('');
      setNewReminderDate('');
    } catch (error) {
      console.error('Failed to add reminder:', error);
      alert('Failed to add reminder. Please try again.');
    }
  };

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


  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading patient data...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Companion Dashboard</h1>
          <div className="flex items-center">
            <span className="mr-4 text-slate-600">Welcome, {user.name}</span>
            <button onClick={logout} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Patient List and Add Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 shadow-lg rounded-lg">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Manage Patients</h2>
              <div className="space-y-2 mb-4">
                {associatedUsers.length > 0 ? (
                  associatedUsers.map(u => (
                    <div key={u.$id} onClick={() => setSelectedUser(u)} className={`p-3 rounded-md cursor-pointer ${selectedUser?.$id === u.$id ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 hover:bg-slate-200'}`}>
                      {u.name}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">You are not connected with any patients yet.</p>
                )}
              </div>
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={newUserShareableId}
                  onChange={(e) => setNewUserShareableId(e.target.value)}
                  placeholder="Enter patient\'s Shareable ID" 
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <button onClick={handleAddUser} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Connect to Patient
                </button>
                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                {success && <p className="text-sm text-green-600 mt-2">{success}</p>}
              </div>
            </div>

            {selectedUser && (
              <div className="bg-white p-6 shadow-lg rounded-lg">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Add Reminder for {selectedUser.name}</h3>
                <form onSubmit={handleAddReminder} className="space-y-4">
                  <div>
                    <label htmlFor="reminderTitle" className="block text-sm font-medium text-slate-700">Reminder Title</label>
                    <input type="text" id="reminderTitle" value={newReminderTitle} onChange={e => setNewReminderTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  </div>
                  <div>
                    <label htmlFor="reminderDate" className="block text-sm font-medium text-slate-700">Time</label>
                    <input type="datetime-local" id="reminderDate" value={newReminderDate} onChange={e => setNewReminderDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  </div>
                  <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Add Reminder</button>
                </form>
              </div>
            )}
          </div>

          {/* Right Column: Selected Patient Data */}
          <div className="lg:col-span-2 space-y-6">
            {selectedUser ? (
              <>
                <div className="bg-white p-6 shadow-lg rounded-lg">
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">Viewing Dashboard for: {selectedUser.name}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Reminders Section */}
                    <div>
                      <h3 className="font-medium text-slate-800 mb-3">Medication Reminders</h3>
                      <ul className="space-y-2">
                        {reminders.map(r => (
                          <li key={r.$id} onClick={() => toggleReminder(r.$id, r.is_completed)} className={`p-3 rounded-md cursor-pointer flex justify-between items-center ${r.is_completed ? 'bg-green-100 text-slate-500 line-through' : 'bg-yellow-100'}`}>
                            <span>{r.title}</span>
                            <span className="text-sm">{new Date(r.time).toLocaleString()}</span>
                          </li>
                        ))}
                        {reminders.length === 0 && <p className="text-sm text-slate-500">No reminders set.</p>}
                      </ul>
                    </div>

                    {/* Journal Section */}
                    <div>
                      <h3 className="font-medium text-slate-800 mb-3">Journal Entries</h3>
                      <ul className="space-y-4">
                        {journalEntries.map(j => (
                          <li key={j.$id} className="p-3 bg-slate-50 rounded-md border border-slate-200">
                            <p className="text-sm text-slate-700">{j.content}</p>
                            <p className="text-xs text-slate-400 mt-2">{new Date(j.$createdAt).toLocaleString()}</p>
                          </li>
                        ))}
                        {journalEntries.length === 0 && <p className="text-sm text-slate-500">No journal entries yet.</p>}
                      </ul>
                    </div>

                  </div>
                </div>
                {/* Chat Component */}
                <Chat user={user} selectedUser={selectedUser} />
              </>
            ) : (
              <div className="bg-white p-10 shadow-lg rounded-lg text-center">
                <h2 className="text-xl font-semibold text-slate-800">Select a Patient</h2>
                <p className="mt-2 text-slate-500">Choose a patient from your list on the left to view their dashboard, or add a new patient using their shareable ID.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

CaregiverDashboard.propTypes = {
  user: PropTypes.object.isRequired,
  logout: PropTypes.func.isRequired,
};

export default CaregiverDashboard;
