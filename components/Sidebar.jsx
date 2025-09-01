import { useRouter } from 'next/router';

const Sidebar = ({ onClose }) => {
  const router = useRouter();
  
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/transactions', label: 'Transaksi', icon: '💸' },
    { path: '/reports', label: 'Laporan', icon: '📈' },
    { path: '/ai-assistant', label: 'AI Assistant', icon: '🤖' },
  ];

  const handleNavigation = (path) => {
    router.push(path);
    // Close sidebar on mobile after navigation
    if (onClose) onClose();
  };

  return (
    <div className="w-64 bg-gray-800 p-4 h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Catatan Keuangan</h1>
      </div>
      
      <nav className="flex-1">
        <ul>
          {menuItems.map((item) => (
            <li key={item.path} className="mb-2">
              <button
                onClick={() => handleNavigation(item.path)}
                className={`flex items-center p-2 rounded-lg w-full text-left ${
                  router.pathname === item.path
                    ? 'bg-blue-600'
                    : 'hover:bg-gray-700'
                }`}
              >
                <span className="mr-2 text-xl">{item.icon}</span>
                <span className="text-lg">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Mobile close button */}
      {onClose && (
        <div className="md:hidden mt-auto pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full p-2 rounded-lg bg-gray-700 hover:bg-gray-600"
          >
            Tutup
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
