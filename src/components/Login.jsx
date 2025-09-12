import { useState } from 'react';
import { account, ID, databases, Permission, Role } from '../lib/appwrite';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const Login = ({ setLoggedInUser }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'patient', // Default role
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // --- Demo accounts for Hackathon testing ---
  const demoUsers = [
    { name: 'Catherine (Companion)', email: 'catherine@demo.com', password: 'password123', role: 'caregiver' },
    { name: 'John (Patient)', email: 'john@demo.com', password: 'password123', role: 'patient' },
    { name: 'Jane (Patient)', email: 'jane@demo.com', password: 'password123', role: 'patient' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  async function login(email, password) {
    try {
      setError('');
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      setLoggedInUser(user);
      navigate('/dashboard');
    } catch (e) {
      console.error('Login failed:', e);
      setError(e.message || 'Login failed. Please check your credentials.');
    }
  }

  async function register(email, password, name, role) {
    let newUser;
    try {
      setError('');
      if (!email || !password || !name || !role) {
        setError('All fields, including role, are required for registration.');
        return;
      }

      // 1. Create the authentication account.
      newUser = await account.create(ID.unique(), email, password, name);
      const userId = newUser.$id;

      // 2. Log the new user in to establish a session.
      await account.createEmailPasswordSession(email, password);

      // 3. Create the user's document in the database.
      const shareableId = Math.random().toString(36).substring(2, 8).toUpperCase();
      await databases.createDocument(
        '68b213e7001400dc7f21', // Database ID
        'users',              // Users collection ID
        userId,               // Use the new user's ID for the document ID
        {
          name: name,
          email: email,
          shareable_id: shareableId,
          role: role,
        },
        [
          Permission.read(Role.users()),      // Any logged in user can search for other users.
          Permission.update(Role.user(userId)), // Only the user themselves can update their own profile.
        ]
      );

      // 4. Update the app's state to trigger the dashboard.
      setLoggedInUser(await account.get());
      
      // 5. Navigate to the dashboard.
      navigate('/dashboard');

    } catch (e) {
      console.error('Registration error:', e);
      if (e.code === 409) {
        setError('User with this email already exists. Please sign in.');
      } else {
        console.error('An auth account was created but database setup failed.');
        setError(e.message || 'Registration failed.');
      }
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

  const useDemoAccount = (user) => {
    setFormData({
      email: user.email,
      password: user.password,
      name: user.name.split(' (')[0], // Extract first name
      role: user.role
    });
    setError(''); // Clear any previous errors
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-slate-900">Stroke Recovery Hub</h1>
          <p className="mt-2 text-md text-slate-600">
            {isRegistering ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        <div className="bg-white p-8 shadow-xl rounded-lg">
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
                    <option value="patient">I am a Patient</option>
                    <option value="caregiver">I am a Companion / Caregiver</option>
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

        {/* Demo Accounts Section */}
        <div className="mt-8 w-full max-w-md">
            <div className="bg-white p-6 shadow-xl rounded-lg">
                <h3 className="text-lg font-bold text-slate-800 text-center mb-4">Demo Accounts</h3>
                <p className="text-center text-sm text-slate-600 mb-4">First time? Use these to register with the correct role. Otherwise, just sign in.</p>
                <div className="space-y-3">
                    {demoUsers.map(user => (
                        <div key={user.email} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-slate-700">{user.name}</p>
                                <p className="text-xs text-slate-500">{user.email} / pw: {user.password}</p>
                            </div>
                            <button onClick={() => useDemoAccount(user)} className="px-3 py-1 text-sm font-medium text-white bg-indigo-500 rounded-md hover:bg-indigo-600 focus:outline-none">
                                Use
                            </button>
                        </div>
                    ))}
                </div>
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
