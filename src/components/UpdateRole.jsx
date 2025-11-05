import { useState } from 'react';
import { databases } from '../lib/appwrite';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const UpdateRole = ({ loggedInUser, setLoggedInUser }) => {
  const [newRole, setNewRole] = useState('survivor');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRoleChange = (e) => {
    setNewRole(e.target.value);
  };

  const handleUpdateRole = async () => {
    if (!loggedInUser) {
      setError('You must be logged in to update your role.');
      return;
    }

    try {
      const updatedUser = await databases.updateDocument(
        '68b213e7001400dc7f21', // Database ID from your backend
        'users', // Collection ID
        loggedInUser.$id,
        { role: newRole }
      );
      setLoggedInUser(updatedUser);
      setSuccess('Your role has been updated successfully! Redirecting you to the dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (e) {
      console.error('Role update failed:', e);
      setError('Failed to update role. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Update Your Role</h2>
        <p className="text-center text-slate-600 mb-6">To continue, please select your primary role in our community. This will help us tailor your experience.</p>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

        <div className="space-y-4">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-slate-700">Choose Your Role</label>
            <select 
              id="role" 
              name="role" 
              value={newRole} 
              onChange={handleRoleChange} 
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="survivor">Survivor</option>
              <option value="companion">Companion / Caregiver</option>
            </select>
          </div>
          <button 
            onClick={handleUpdateRole} 
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Update Role and Continue
          </button>
        </div>
      </div>
    </div>
  );
};

UpdateRole.propTypes = {
  loggedInUser: PropTypes.object,
  setLoggedInUser: PropTypes.func.isRequired
};

export default UpdateRole;
