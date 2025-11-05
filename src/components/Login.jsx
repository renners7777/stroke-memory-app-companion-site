import { useState } from 'react';
import { account, ID, databases } from '../lib/appwrite';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const Login = ({ setLoggedInUser }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'survivor', // Default role
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  async function login(email, password) {
    try {
      setError('');
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();

      try {
        const fullUserProfile = await databases.getDocument(
          '68b213e7001400dc7f21',
          'users',
          user.$id
        );
        setLoggedInUser(fullUserProfile);
        navigate('/dashboard');
      } catch (docError) {
        if (docError.code === 404) {
          setError('Your user profile is missing. Please register again.');
          await account.deleteSession('current');
          setLoggedInUser(null);
        } else {
          throw docError;
        }
      }
    } catch (e) {
      console.error('Login failed:', e);
      setError(e.message || 'Login failed. Please check your credentials.');
    }
  }

  // Final, corrected register function
  async function register(email, password, name, role) {
    try {
      setError('');
      if (!email || !password || !name || !role) {
        setError('All fields are required for registration.');
        return;
      }

      // 1. Create the authentication account. This also logs the user in.
      const newUser = await account.create(ID.unique(), email, password, name);

      // 2. Create the user document in the database.
      // The permissions parameter has been removed, as it was causing the error.
      // The document will inherit the permissions from the 'users' collection.
      const shareableId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newUserDocument = await databases.createDocument(
        '68b213e7001400dc7f21', // Database ID
        'users',              // Users collection ID
        newUser.$id,          // Use the new user's ID for the document ID
        {
          name: name,
          email: email,
          shareable_id: shareableId,
          role: role,
        }
      );
      
      // 3. The user is already logged in. Set the user state and navigate.
      setLoggedInUser(newUserDocument);
      navigate('/dashboard');

    } catch (e) {
      console.error('Registration error:', e);
      const defaultMessage = 'An unexpected error occurred. Please check the backend permissions and try again.';
      setError(`Registration Failed: ${e.message || defaultMessage}`);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password, name, role } = formData;

    if (isRegistering) {
      await register(email, password, name, role);
    } else {
      await login(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 shadow-xl rounded-lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">
              {isRegistering ? 'Create Your Account' : 'Sign In'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            {isRegistering && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700">Full Name</label>
                  <input id="name" name="name" type="text" required value={formData.name} onChange={handleInputChange} className="mt-1 appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-slate-700">Your Role</label>
                  <select id="role" name="role" value={formData.role} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    <option value="survivor">I am a Survivor</option>
                    <option value="companion">I am a Companion / Caregiver</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email address</label>
              <input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleInputChange} className="mt-1 appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
              <input id="password" name="password" type="password" required value={formData.password} onChange={handleInputChange} className="mt-1 appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>

            <div>
              <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                {isRegistering ? 'Create Account' : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button type="button" onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="text-sm text-indigo-600 hover:text-indigo-500">
              {isRegistering ? 'Already have an account? Sign in' : 'No account? Create one'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

Login.propTypes = {
  setLoggedInUser: PropTypes.func.isRequired
};

export default Login;
