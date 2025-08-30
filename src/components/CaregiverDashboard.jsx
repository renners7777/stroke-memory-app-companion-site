import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { account } from '../lib/appwrite';

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

const CaregiverDashboard = ({ user, setLoggedInUser, userProgress, reminders, journalEntries }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      setLoggedInUser(null);
      navigate('/'); // Redirect to home page
    } catch (error) {
      console.error('Failed to logout:', error);
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
  setLoggedInUser: PropTypes.func.isRequired,
  userProgress: PropTypes.array,
  reminders: PropTypes.array.isRequired,
  journalEntries: PropTypes.array.isRequired
};

export default CaregiverDashboard;
