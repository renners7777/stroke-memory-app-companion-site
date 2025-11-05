import { Link } from 'react-router-dom';

const Feature = ({ icon, title, description }) => (
  <div className="bg-white p-6 rounded-lg shadow-md transition hover:shadow-xl hover:-translate-y-1">
    <div className="flex items-center space-x-4 mb-4">
      <div className="bg-indigo-100 p-3 rounded-full">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
    </div>
    <p className="text-slate-600">{description}</p>
  </div>
);

const Home = () => {
  return (
    <div className="bg-slate-50 text-slate-800 p-5">
      {/* Hero Section */}
      <main>
        <div className="py-20 sm:py-28 text-center bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight">
              A Digital Companion for <span className="text-indigo-600">Stroke Recovery</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg sm:text-xl text-slate-600">
              Empowering caregivers to support stroke survivors with tools for cognitive health, progress tracking, and daily management.
            </p>
            <div className="mt-10">
              <Link
                to="/login"
                className="bg-indigo-600 text-white rounded-md px-5 py-2 text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-slate-900">Key Features for Caregivers</h2>
              <p className="mt-2 text-md text-slate-600">Everything you need to support your loved one, in one place.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Feature
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l.707-.707M12 21v-1m-6.364-1.636l.707-.707m12.728 0l-.707.707" /></svg>}
                title="Monitor Cognitive Health"
                description="Track memory and cognition scores from the app to see tangible progress over time."
              />
              <Feature
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                title="Manage Daily Activities"
                description="Set and receive notifications for medication, appointments, and other important tasks."
              />
              <Feature
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                title="Shared Journaling"
                description="Read journal entries from your loved one to stay connected with their thoughts and feelings."
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Stroke Recovery Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
