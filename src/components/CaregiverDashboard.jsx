import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { account, databases, Query, ID, Permission, Role } from '../lib/appwrite';
import Messaging from './Messaging';

// A smaller, reusable card for displaying stats
const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-4 rounded-lg shadow-md flex items-center">
    <div className="bg-blue-100 p-3 rounded-full mr-4">{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.node.isRequired,
};

const CaregiverDashboard = ({ user, logout, userProgress, reminders, setReminders, journalEntries }) => {
  const [associatedUsers, setAssociatedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUserShareableId, setNewUserShareableId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderDate, setNewReminderDate] = useState('');

  // --- Data Fetching ---
  useEffect(() => {
    // Fetch users associated with the current user (caregiver)
    const fetchAssociatedUsers = async () => {
      try {
        const response = await databases.listDocuments(
          '68b213e7001400dc7f21',
          'user_relationships',
          [Query.equal('companion_id', user.$id)]
        );

        const patientIds = response.documents.map((doc) => doc.patient_id);
        if (patientIds.length > 0) {
          const userPromises = patientIds.map(id => databases.getDocument('68b213e7001400dc7f21', 'users', id));
          const users = await Promise.all(userPromises);
          setAssociatedUsers(users);
          // Automatically select the first user if none is selected
          if (users.length > 0 && !selectedUser) {
            setSelectedUser(users[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching associated users:', err);
      }
    };

    fetchAssociatedUsers();
  }, [user.$id, selectedUser]); // Reruns when user changes

  // --- Event Handlers ---
  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newUserShareableId.trim()) {
      setError('Please enter a shareable ID.');
      return;
    }

    try {
      const userList = await databases.listDocuments(
        '68b213e7001400dc7f21',
        'users',
        [Query.equal('shareable_id', newUserShareableId)]
      );

      if (userList.documents.length === 0) {
        setError('No patient found with this ID. Please ask the patient to share their ID from their dashboard.');
        return;
      }

      const userToAdd = userList.documents[0];

      // Prevent adding the same user twice
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
        // Permissions ensure only the companion can see this relationship
        [Permission.read(Role.user(user.$id))]
      );

      setSuccess(`Successfully connected with ${userToAdd.name}.`);
      setNewUserShareableId('');
      setAssociatedUsers(prev => [...prev, userToAdd]); // Optimistically update UI
      setSelectedUser(userToAdd); // Switch to the newly added user

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
        '68b213e7001400dc7f21', // Database ID
        'reminders_table',    // Reminders collection ID
        ID.unique(),
        {
          title: newReminderTitle,
          dateTime: newReminderDate,
          userID: selectedUser.$id, // Associate reminder with the selected patient
        },
        [
          Permission.read(Role.user(selectedUser.$id)), // Patient can read
          Permission.read(Role.user(user.$id)),       // Caregiver can read
          Permission.update(Role.user(user.$id)),      // Caregiver can update
          Permission.delete(Role.user(user.$id)),      // Caregiver can delete
        ]
      );

      setReminders(prev => [...prev, newReminder]); // Optimistically update UI
      setNewReminderTitle('');
      setNewReminderDate('');
    } catch (error) {
      console.error('Error creating reminder:', error);
      alert('Failed to create reminder.');
    }
  };

  const latestProgress = userProgress?.[0];

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Welcome, {user.name}</h1>
          </div>
          <button
            onClick={logout}
            className="bg-red-500 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: User Management & Communication */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* User Connection Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Connect with a Patient</h2>
              <p className="text-sm text-gray-600 mb-2">Enter the patient's Shareable ID below to connect your accounts and view their progress.</p>
              
              <form onSubmit={handleAddUser} className="flex items-start space-x-2">
                <div className="flex-grow">
                  <input
                    type="text"
                    placeholder="Patient's Shareable ID"
                    value={newUserShareableId}
                    onChange={(e) => setNewUserShareableId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm font-medium"
                >
                  Add
                </button>
              </form>
              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
              {success && <p className="text-green-500 text-xs mt-2">{success}</p>}
            </div>

            {/* User Selection & Messaging */}
            {associatedUsers.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Chat with {selectedUser?.name || 'a Patient'}</h2>
                <select
                  onChange={(e) => {
                    const userToSelect = associatedUsers.find(u => u.$id === e.target.value);
                    setSelectedUser(userToSelect);
                  }}
                  value={selectedUser?.$id || ''}
                  className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {associatedUsers.map(u => (
                    <option key={u.$id} value={u.$id}>{u.name}</option>
                  ))}
                </select>

                {selectedUser && <div className="mt-4"><Messaging loggedInUser={user} selectedUser={selectedUser} /></div>}
              </div>
            )}
          </div>

          {/* Right Column: Patient Data */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <StatCard 
                title="Memory Score" 
                value={latestProgress ? `${latestProgress.memoryScore}%` : 'N/A'}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
              />
              <StatCard 
                title="Cognition Score" 
                value={latestProgress ? `${latestProgress.cognitionScore}%` : 'N/A'}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l.707-.707M12 21v-1m-6.364-1.636l.707-.707m12.728 0l-.707.707" /></svg>}
              />
              <StatCard 
                title="Reminders" 
                value={reminders.length}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
              />
            </div>

            {/* Data Sections */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <section className="xl:col-span-2 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Journal Entries</h2>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {journalEntries.length > 0 ? journalEntries.map(entry => (
                    <div key={entry.$id} className="border p-4 rounded-lg hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-gray-800">{entry.title}</h3>
                        <span className="text-xs text-gray-500">{new Date(entry.dateCreated).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-600">{entry.content}</p>
                    </div>
                  )) : (
                    <p className="text-gray-500 text-center py-4">No journal entries from the selected patient yet.</p>
                  )}
                </div>
              </section>

              <section className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Reminders for {selectedUser?.name}</h2>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {reminders.length > 0 ? reminders.map(reminder => (
                    <div key={reminder.$id} className="border-l-4 border-blue-500 pl-3">
                      <p className="font-semibold text-gray-800 text-sm">{reminder.title}</p>
                      <p className="text-xs text-gray-600">{new Date(reminder.dateTime).toLocaleString()}</p>
                    </div>
                  )) : (
                    <p className="text-gray-500 text-center py-4">No upcoming reminders.</p>
                  )}
                </div>
                {selectedUser && (
                  <form onSubmit={handleAddReminder} className="mt-4 pt-4 border-t space-y-2">
                    <input 
                      type="text"
                      placeholder="New reminder title"
                      value={newReminderTitle}
                      onChange={(e) => setNewReminderTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <input 
                      type="datetime-local"
                      value={newReminderDate}
                      onChange={(e) => setNewReminderDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm font-medium"
                    >
                      Add Reminder
                    </button>
                  </form>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

CaregiverDashboard.propTypes = {
  user: PropTypes.object.isRequired,
  logout: PropTypes.func.isRequired,
  userProgress: PropTypes.array,
  reminders: PropTypes.array.isRequired,
  setReminders: PropTypes.func.isRequired,
  journalEntries: PropTypes.array.isRequired
};

export default CaregiverDashboard;
