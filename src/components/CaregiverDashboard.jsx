import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { account, databases, Query, ID } from '../lib/appwrite';
import Messaging from './Messaging'; // Make sure to import the Messaging component

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4">
    <div className="bg-blue-100 p-3 rounded-full">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.node.isRequired,
};

const CaregiverDashboard = ({ user, logout, userProgress, reminders, journalEntries }) => {
  const [associatedUsers, setAssociatedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUserShareableId, setNewUserShareableId] = useState('');
  const [userShareableId, setUserShareableId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAssociatedUsers = async () => {
    try {
      // Fetch the relationships from the user_relationships collection
      const response = await databases.listDocuments(
        '68b213e7001400dc7f21', // Your database ID
        'user_relationships', // Your user_relationships collection ID
        [Query.equal('companion_id', user.$id)]
      );

      // Get the user IDs of the associated patients
      const patientIds = response.documents.map((doc) => doc.patient_id);

      if (patientIds.length > 0) {
        // Fetch the user details for each patient
        const userPromises = patientIds.map(id => databases.getDocument('68b213e7001400dc7f21', 'users', id));
        const users = await Promise.all(userPromises);
        setAssociatedUsers(users);
        if(users.length > 0 && !selectedUser) {
          setSelectedUser(users[0]); // Select the first user by default
        }
      }
    } catch (error) {
      console.error('Error fetching associated users:', error);
    }
  };

  useEffect(() => {
    const fetchUserShareableId = async () => {
      try {
        const userDoc = await databases.getDocument('68b213e7001400dc7f21', 'users', user.$id);
        setUserShareableId(userDoc.shareable_id);
      } catch (error) {
        console.error('Error fetching user shareable ID:', error);
      }
    };

    fetchUserShareableId();
    fetchAssociatedUsers();
  }, [user.$id, selectedUser]);

  const handleLogout = async () => {
    await logout();
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
        // Find the user by shareable_id
        const userList = await databases.listDocuments(
            '68b213e7001400dc7f21', // Your database ID
            'users', // Your users collection ID
            [Query.equal('shareable_id', newUserShareableId)]
        );

        if (userList.documents.length === 0) {
            setError('No user found with this ID.');
            return;
        }

        const userToAdd = userList.documents[0];

        // Create the relationship
        await databases.createDocument(
            '68b213e7001400dc7f21', // Your database ID
            'user_relationships', // Your user_relationships collection ID
            ID.unique(),
            {
                companion_id: user.$id,
                patient_id: userToAdd.$id
            }
        );

        setSuccess(`Successfully added ${userToAdd.name}.`);
        setNewUserShareableId('');
        fetchAssociatedUsers(); // Refresh the list of associated users
    } catch (error) {
        console.error('Error adding user:', error);
        setError('Failed to add user. Please try again.');
    }
  };

  const latestProgress = userProgress?.[0];
  const upcomingRemindersCount = reminders.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-500 text-white rounded-full p-2">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422A12.083 12.083 0 0112 21a12.083 12.083 0 01-6.16-10.422L12 14z" /></svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
          </div>
          <button
            onClick={handleLogout}
            className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* User selection dropdown */}
        <div className="mb-4">
          <label htmlFor="user-select" className="block text-sm font-medium text-gray-700">Select a user to chat with:</label>
          <select
            id="user-select"
            onChange={(e) => {
              const userId = e.target.value;
              const userToSelect = associatedUsers.find(u => u.$id === userId);
              setSelectedUser(userToSelect);
            }}
            value={selectedUser?.$id || ''}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {associatedUsers.map(u => (
              <option key={u.$id} value={u.$id}>{u.name}</option>
            ))}
          </select>
        </div>
        
        {/* Messaging component */}
        {selectedUser && <Messaging loggedInUser={user} selectedUser={selectedUser} />}

        {/* Shareable ID Display (Corrected Text) */}
        <div className="mb-8 bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Your Shareable ID</h2>
          {/* Updated text */}
          <p className="text-gray-600 mb-4">Share this ID with the stroke survivor to connect your accounts.</p>
          <div className="bg-gray-100 p-3 rounded-md flex items-center justify-between">
            <span className="font-mono text-lg text-gray-800">{userShareableId}</span>
            <button
              onClick={() => navigator.clipboard.writeText(userShareableId)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Copy ID
            </button>
          </div>
        </div>

        {/* Add User Form */}
        <div className="mb-8 bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Add User</h2>
          <form onSubmit={handleAddUser} className="space-y-4">
            {error && <p className="text-red-500">{error}</p>}
            {success && <p className="text-green-500">{success}</p>}
            <div className="mb-4">
              <label htmlFor="user-shareable-id" className="block text-sm font-medium text-gray-700">User's Shareable ID</label>
              <input
                type="text"
                id="user-shareable-id"
                value={newUserShareableId}
                onChange={(e) => setNewUserShareableId(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add User
            </button>
          </form>
        </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Latest Memory Score" 
            value={latestProgress ? `${latestProgress.memoryScore}%` : 'N/A'}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
          />
          <StatCard 
            title="Latest Cognition Score" 
            value={latestProgress ? `${latestProgress.cognitionScore}%` : 'N/A'}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l.707-.707M12 21v-1m-6.364-1.636l.707-.707m12.728 0l-.707.707" /></svg>}
          />
          <StatCard 
            title="Upcoming Reminders" 
            value={upcomingRemindersCount}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Journal Entries Section (takes 2/3 width) */}
          <section className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Journal Entries</h2>
            <div className="space-y-4">
              {journalEntries.length > 0 ? journalEntries.map(entry => (
                <div key={entry.$id} className="border rounded-lg p-4 transition hover:shadow-lg">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-gray-800">{entry.title}</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {new Date(entry.dateCreated).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{entry.content.substring(0, 150)}{entry.content.length > 150 && '...'}</p>
                </div>
              )) : (
                <p className="text-gray-500">No journal entries yet.</p>
              )}
            </div>
          </section>

          {/* Reminders Section (takes 1/3 width) */}
          <section className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Upcoming Reminders</h2>
            <div className="space-y-4">
              {reminders.length > 0 ? reminders.map(reminder => (
                <div key={reminder.$id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="font-semibold text-gray-800">{reminder.title}</p>
                  <p className="text-sm text-gray-600">{new Date(reminder.dateTime).toLocaleString([], { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              )) : (
                 <p className="text-gray-500">No upcoming reminders.</p>
              )}
            </div>
          </section>
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
  journalEntries: PropTypes.array.isRequired
};

export default CaregiverDashboard;
