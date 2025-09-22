import PropTypes from 'prop-types';
import { account } from '../lib/appwrite';
import { Link, useNavigate } from 'react-router-dom';

const Header = ({ loggedInUser, setLoggedInUser }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      setLoggedInUser(null);
      // Explicitly navigate to the login page after logout
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <header className="bg-white shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-3 cursor-pointer">
            <img src="/Stroke Survivor App Logo HeartMind Connect.png" alt="HeartMind Connect Logo" className="h-8 w-auto" />
            <h1 className="text-xl font-bold text-indigo-600">HeartMind Connect</h1>
          </Link>
          <div>
            {loggedInUser ? (
              <button
                onClick={handleLogout}
                className="bg-indigo-600 text-white rounded-md px-5 py-2 text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <Link to="/login">
                <button className="bg-indigo-600 text-white rounded-md px-5 py-2 text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                  Sign In
                </button>
              </Link>
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
