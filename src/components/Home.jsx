import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-600 mb-8">
            Welcome to the Stroke Memory Companion Site
          </h1>
          
          <p className="text-xl text-gray-700 mb-8">
            Supporting caregivers in their journey of helping stroke survivors maintain cognitive health
          </p>

          <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Why Use Our Companion Site?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Monitor Progress</h3>
                <p className="text-gray-600">Track your loved one&apos;s cognitive improvement and memory exercises in real-time</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Manage Reminders</h3>
                <p className="text-gray-600">Set and track important appointments, medications, and daily activities</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-2">Stay Connected</h3>
                <p className="text-gray-600">Access journal entries and maintain communication with your loved one</p>
              </div>
            </div>
          </div>

          <Link 
            to="/login" 
            className="inline-block bg-blue-600 text-white rounded-md px-8 py-3 text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Get Started →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;