import { useState } from 'react';
import { account, ID } from '../lib/appwrite';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const Login = ({ setLoggedInUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function login(email, password) {
    try {
      setError('');
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      setLoggedInUser(user);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      setError('Login failed. Please check your credentials.');
    }
  }

  async function register(email, password, name) {
    try {
      setError('');
      if (!email || !password || !name) {
        setError('All fields are required');
        return;
      }
      
      console.log('Attempting registration with:', { email, name }); // Debug log
      const user = await account.create(ID.unique(), email, password, name);
      console.log('Registration successful:', user); // Debug log
      
      // If registration successful, attempt login
      await login(email, password);
    } catch (error) {
      console.error('Registration error:', error);
      if (error.code === 409) {
        setError('User already exists with this email');
      } else if (error.code === 400) {
        setError('Invalid email or password format');
      } else {
        setError(`Registration failed: ${error.message}`);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-white flex items-center justify-center">
      <div className="relative py-3 w-full max-w-xl mx-auto px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">Stroke Memory App</h1>
                <h2 className="text-xl text-center mb-8 text-gray-600">Caregiver Portal</h2>
                {error && (
                  <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm mb-4">
                    {error}
                  </div>
                )}
                <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                  <div className="relative">
                    <input 
                      type="email" 
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600"
                      required
                    />
                    <label className="absolute left-0 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">
                      Email
                    </label>
                  </div>
                  <div className="relative">
                    <input 
                      type="password"
                      placeholder="Password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600"
                      required
                    />
                    <label className="absolute left-0 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Name" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600"
                      required
                    />
                    <label className="absolute left-0 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">
                      Name
                    </label>
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button
                      type="button"
                      onClick={() => login(email, password)}
                      className="bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 w-full transition-colors"
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => register(email, password, name)}
                      className="bg-white text-blue-600 border-2 border-blue-600 rounded-md px-4 py-2 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 w-full transition-colors"
                    >
                      Register
                    </button>
                  </div>
                </form>
              </div>
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