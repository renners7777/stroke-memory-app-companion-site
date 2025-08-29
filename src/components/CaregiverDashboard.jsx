import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { account } from '../lib/appwrite';

const CaregiverDashboard = ({ user, setLoggedInUser, userProgress, reminders, journalEntries }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      setLoggedInUser(null);
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Failed to logout:', error);
      // You could add an alert or a toast notification here for the user
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white shadow-sm rounded-lg p-6 mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Welcome, {user.name}</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white rounded-md px-4 py-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors"
          >
            Logout
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Progress Section */}
          <section className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Progress Overview</h2>
            <div className="space-y-4">
              {userProgress && userProgress.map(progress => (
                <div key={progress.$id} className="border-b pb-2">
                  <p className="text-gray-600">Date: {new Date(progress.date).toLocaleDateString()}</p>
                  <p>Memory Score: {progress.memoryScore}</p>
                  <p>Cognition Score: {progress.cognitionScore}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Reminders Section */}
          <section className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Upcoming Reminders</h2>
            <div className="space-y-4">
              {reminders.map(reminder => (
                <div key={reminder.$id} className="border-b pb-2">
                  <p className="font-medium">{reminder.title}</p>
                  <p className="text-gray-600">{new Date(reminder.dateTime).toLocaleString()}</p>
                  <p className="text-sm">{reminder.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Journal Entries Section */}
          <section className="bg-white p-6 rounded-lg shadow-sm md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Recent Journal Entries</h2>
            <div className="space-y-4">
              {journalEntries.map(entry => (
                <div key={entry.$id} className="border-b pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{entry.title}</h3>
                    <span className="text-sm text-gray-500">
                      {new Date(entry.dateCreated).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{entry.content}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

CaregiverDashboard.propTypes = {
  user: PropTypes.object.isRequired,
  setLoggedInUser: PropTypes.func.isRequired,
  userProgress: PropTypes.array,
  reminders: PropTypes.array.isRequired,
  journalEntries: PropTypes.array.isRequired
};

export default CaregiverDashboard;