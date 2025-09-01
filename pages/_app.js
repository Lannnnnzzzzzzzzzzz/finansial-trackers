import '../styles/globals.css';
import { useState } from 'react';
import Sidebar from '../components/Sidebar.jsx'
import Footer from '../components/Footer.jsx'




function MyApp({ Component, pageProps }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Hidden on mobile by default */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition duration-300 ease-in-out md:translate-x-0 md:static md:inset-0`}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Mobile Header */}
          <div className="md:hidden bg-gray-800 p-4 flex items-center justify-between">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            <h1 className="text-xl font-bold">Catatan Keuangan</h1>
            <div></div> {/* Spacer for alignment */}
          </div>
          
          {/* Page Content */}
          <div className="p-4 md:p-6">
            <Component {...pageProps} />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default MyApp;
