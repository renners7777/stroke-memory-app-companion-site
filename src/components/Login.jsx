import { useState } from 'react';
import { account, ID } from '../lib/appwrite';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const Login = ({ setLoggedInUser }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
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
      setLoggedInUser(user);
      navigate('/dashboard');
    } catch (e) {
      console.error('Login failed:', e);
      setError(e.message || 'Login failed. Please check your credentials.');
    }
  }

  async function register(email, password, name) {
    try {
      setError('');
      if (!email || !password || !name) {
        setError('All fields are required for registration.');
        return;
      }
      
      await account.create(ID.unique(), email, password, name);
      
      // If registration successful, log the user in
      await login(email, password);
    } catch (e) {
      console.error('Registration error:', e);
      if (e.code === 409) {
        setError('User with this email already exists.');
      } else {
        setError(e.message || 'Registration failed.');
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password, name } = formData;

    if (isRegistering) {
      await register(email, password, name);
    } else {
      await login(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-white flex items-center justify-center">
      <div className="relative py-3 w-full max-w-xl mx-auto px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h1 className="text-3xl font-bold text-center mb-4 text-blue-600">Stroke Memory App</h1>
                <h2 className="text-xl text-center mb-8 text-gray-600">
                  {isRegistering ? 'Create Your Caregiver Account' : 'Caregiver Portal Login'}
                </h2>
                {error && (
                  <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm mb-4">
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="relative">
                    <input 
                      id="email"
                      name="email"
                      type="email" 
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600"
                      required
                    />
                    <label htmlFor="email" className="absolute left-0 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">
                      Email
                    </label>
                  </div>
                  <div className="relative">
                    <input 
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Password" 
                      value={formData.password}
                      onChange={handleInputChange}
                      className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600"
                      required
                    />
                    <label htmlFor="password" className="absolute left-0 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">
                      Password
                    </label>
                  </div>
                  {isRegistering && (
                    <div className="relative">
                      <input 
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Name" 
                        value={formData.name}
                        onChange={handleInputChange}
                        className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-blue-600"
                        required
                      />
                      <label htmlFor="name" className="absolute left-0 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">
                        Name
                      </label>
                    </div>
                  )}
                  <div className="relative">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 w-full transition-colors"
                    >
                      {isRegistering ? 'Register' : 'Login'}
                    </button>
                  </div>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(!isRegistering);
                        setError('');
                        setFormData({ email: '', password: '', name: '' });
                      }}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
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