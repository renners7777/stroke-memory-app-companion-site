
import PropTypes from 'prop-types';
import { account } from '../lib/appwrite';

const Header = ({ loggedInUser, setLoggedInUser }) => {
  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      setLoggedInUser(null);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <header className="bg-white shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-indigo-600">StrokeSaver</h1>
          </div>
          <div>
            {loggedInUser && (
              <button
                onClick={handleLogout}
                className="bg-indigo-600 text-white rounded-md px-5 py-2 text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

Header.propTypes = {
  loggedInUser: PropTypes.object,
  setLoggedInUser: PropTypes.func.isRequired,
};

export default Header;
