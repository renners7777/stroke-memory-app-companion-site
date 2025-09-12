import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { databases, Query } from '../lib/appwrite';
import Messaging from './Messaging';

const PatientDashboard = ({ user, logout, reminders, journalEntries }) => {
  const [userShareableId, setUserShareableId] = useState('');
  const [companion, setCompanion] = useState(null);

  useEffect(() => {
    // Fetch the user's own shareable ID to display it
    const fetchUserShareableId = async () => {
      try {
        const userDoc = await databases.getDocument('68b213e7001400dc7f21', 'users', user.$id);
        setUserShareableId(userDoc.shareable_id);
      } catch (err) {
        console.error('Error fetching shareable ID:', err);
      }
    };

    // Find the companion associated with this patient
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

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Welcome, {user.name}</h1>
          <button
            onClick={logout}
            className="bg-red-500 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: Shareable ID & Reminders */}
          <div className="md:col-span-1 space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold text-gray-800 mb-2">My Shareable ID</h3>
              <p className="text-sm text-gray-600 mb-3">Share this ID with a companion to connect.</p>
              <div className="bg-gray-100 p-2 rounded-md flex items-center justify-between">
                <span className="font-mono text-gray-800">{userShareableId}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(userShareableId)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-bold text-gray-900 mb-4">My Reminders</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {reminders.length > 0 ? reminders.map(reminder => (
                  <div key={reminder.$id} className="border-l-4 border-green-500 pl-3">
                    <p className="font-semibold text-gray-800 text-sm">{reminder.title}</p>
                    <p className="text-xs text-gray-600">{new Date(reminder.dateTime).toLocaleString()}</p>
                  </div>
                )) : (
                  <p className="text-gray-500 text-center py-4">You have no upcoming reminders.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Journal & Chat */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-bold text-gray-900 mb-4">My Journal</h2>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {journalEntries.length > 0 ? journalEntries.map(entry => (
                    <div key={entry.$id} className="border p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800">{entry.title}</h3>
                      <p className="text-sm text-gray-600">{entry.content}</p>
                    </div>
                  )) : (
                    <p className="text-gray-500">No journal entries yet.</p>
                  )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              {companion ? (
                <>
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Chat with {companion.name}</h2>
                  <Messaging loggedInUser={user} selectedUser={companion} />
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>You are not connected with a companion yet.</p>
                  <p className="text-sm mt-2">Share your ID to start chatting.</p>
                </div>
              )}
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
  reminders: PropTypes.array.isRequired,
  journalEntries: PropTypes.array.isRequired,
};

export default PatientDashboard;
