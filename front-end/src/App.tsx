import './App.css'
import Drawer from './components/Drawer'
import MobileNavigation from './components/MobileNavigation'
import Tasks from './components/Tasks'
import useStore from './hooks/AppContext'
import useDeviceDetection from './hooks/useDeviceDetection'

function App() {
  const { currentPage } = useStore();
  const { isMobile, isTablet, isDesktop } = useDeviceDetection();

  const renderCurrentPage = () => {
    const mobilePageClasses = isMobile ? "px-2" : "";
    
    switch (currentPage) {
      case 'Tasks':
        return <Tasks isMobile={isMobile} />;
      case 'Dashboard':
        return (
          <div className={`text-center w-full max-w-4xl ${mobilePageClasses}`}>
            <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-800 mb-4`}>
              Dashboard
            </h1>
            <p className="text-gray-600">Welcome to your dashboard!</p>
            {isMobile && (
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-2xl mb-2">✓</div>
                  <div className="text-sm font-medium">Tasks</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-2xl mb-2">📅</div>
                  <div className="text-sm font-medium">Calendar</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="text-sm font-medium">Users</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="text-sm font-medium">Analytics</div>
                </div>
              </div>
            )}
          </div>
        );
      case 'Calendar':
        return (
          <div className={`text-center w-full max-w-4xl ${mobilePageClasses}`}>
            <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-800 mb-4`}>
              Calendar
            </h1>
            <p className="text-gray-600">Calendar feature coming soon...</p>
            {isMobile && (
              <div className="mt-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-4xl mb-4">📅</div>
                  <p className="text-sm text-gray-500">
                    We're working on bringing you a beautiful calendar experience optimized for mobile.
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      case 'Users':
        return (
          <div className={`text-center w-full max-w-4xl ${mobilePageClasses}`}>
            <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-800 mb-4`}>
              Users
            </h1>
            <p className="text-gray-600">User management coming soon...</p>
            {isMobile && (
              <div className="mt-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-4xl mb-4">👥</div>
                  <p className="text-sm text-gray-500">
                    User management features will be available soon with mobile-first design.
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className={`text-center w-full max-w-4xl ${mobilePageClasses}`}>
            <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-800 mb-4`}>
              Dashboard
            </h1>
            <p className="text-gray-600">Welcome to your dashboard!</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full w-full flex flex-row bg-gray-100">
      {/* Desktop Layout */}
      {isDesktop && (
        <>
          <Drawer />
          <div className="BODY__ w-full flex flex-col items-center mx-10 my-10 p-6 overflow-y-auto">
            {renderCurrentPage()}
          </div>
        </>
      )}

      {/* Tablet Layout */}
      {isTablet && (
        <>
          <Drawer />
          <div className="BODY__ w-full flex flex-col items-center mx-6 my-6 p-4 overflow-y-auto">
            {renderCurrentPage()}
          </div>
        </>
      )}

      {/* Mobile Layout */}
      {isMobile && (
        <div className="w-full h-full flex flex-col">
          <div className="bg-white border-b shadow-md h-10 flex items-center justify-end px-4">
            <div className="text-lg font-bold text-gray-800">DIAL_IN</div>
            <div className="text-sm text-gray-500 font-medium ml-2">v0.0.1</div>
          </div>
          <div className="flex-1 w-full overflow-y-auto px-4 py-8">
            {renderCurrentPage()}
          </div>
          <MobileNavigation />
        </div>
      )}
    </div>
  )
}

export default App
