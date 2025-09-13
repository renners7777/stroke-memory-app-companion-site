import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { databases, Query } from '../lib/appwrite';
import Journal from './Journal';
import Reminders from './Reminders';
import Messaging from './Messaging';

const PatientDashboard = ({ user, logout }) => {
  const [userShareableId, setUserShareableId] = useState('');
  const [companion, setCompanion] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);

  useEffect(() => {
    // Fetch the user's shareable ID
    const fetchUserShareableId = async () => {
      try {
        const userDoc = await databases.getDocument('68b213e7001400dc7f21', 'users', user.$id);
        setUserShareableId(userDoc.shareable_id);
      } catch (err) {
        console.error('Error fetching user shareable ID:', err);
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

  useEffect(() => {
    if (!user) return;

    const fetchReminders = async () => {
        try {
            const response = await databases.listDocuments('68b213e7001400dc7f21', 'reminders_table', [Query.equal('userID', user.$id)]);
            setReminders(response.documents);
        } catch (error) {
            console.error("Failed to fetch reminders:", error);
        }
    };

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
          </div>

          {/* Center and Right columns for data */}
          <div className="md:col-span-2 space-y-8">
            <Reminders reminders={reminders} />
            <Journal journalEntries={journalEntries} setJournalEntries={setJournalEntries} user={user} />
            <div className="bg-white p-6 rounded-lg shadow-md">
              {companion ? (
                <>
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Chat with {companion.name}</h2>
                  <Messaging user={user} companion={companion} />
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
};

export default PatientDashboard;
