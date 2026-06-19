import './App.css'
import React from 'react'
import Drawer from './components/Drawer'
import MobileNavigation from './components/MobileNavigation'
import Tasks from './components/Tasks'
import Categories from './components/Categories'
import Auth from './components/Auth'
import Profile from './components/Profile'
import Calendar from './components/Calendar'
import DerivedFieldStyleDebug from './components/DerivedFieldStyleDebug'
import OverlayScrollPane from './components/OverlayScrollPane'
import WindowsEmoji from './components/WindowsEmoji'
import { useNavigationContext, useUser } from './hooks/AppContext'
import useDeviceDetection from './hooks/useDeviceDetection'
import { getVersionString } from './utils/version'

function App() {
  const { navigation } = useNavigationContext();
  const { authState, checkAuthStatus } = useUser();
  const { isMobile, isTablet, isDesktop } = useDeviceDetection();

  // Check authentication status on app startup
  React.useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Update document title with version
  React.useEffect(() => {
    document.title = `DIAL_IN ${getVersionString()}`;
  }, []);

  const debugView = new URLSearchParams(window.location.search).get('debug');

  if (debugView === 'derived-fields') {
    return <DerivedFieldStyleDebug />;
  }

  // Show loading screen during initial auth check
  if (authState.isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <div className="text-white font-bold text-xl">DI</div>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if not authenticated
  if (!authState.isAuthenticated) {
    return <Auth isMobile={isMobile} />;
  }

  const renderCurrentPage = () => {
    const mobilePageClasses = isMobile ? "px-2" : "";
    
    switch (navigation.currentPage) {
      case 'Tasks':
        return <Tasks isMobile={isMobile} />;
      case 'Categories':
        return <Categories />;
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
                  <WindowsEmoji emoji="✓" size={32} className="mb-2" />
                  <div className="text-sm font-medium">Tasks</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <WindowsEmoji emoji="📅" size={32} className="mb-2" />
                  <div className="text-sm font-medium">Calendar</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <WindowsEmoji emoji="👥" size={32} className="mb-2" />
                  <div className="text-sm font-medium">Users</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <WindowsEmoji emoji="📊" size={32} className="mb-2" />
                  <div className="text-sm font-medium">Analytics</div>
                </div>
              </div>
            )}
          </div>
        );
      case 'Calendar':
        return <Calendar isMobile={isMobile} />;
      case 'Users':
        return <Profile isMobile={isMobile} />;
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

  const isCalendarPage = navigation.currentPage === 'Calendar';

  return (
    <div className="h-full w-full relative overflow-hidden">
      {/* Background Image 
      <div className="absolute inset-0" style={{ backgroundImage: 'url(/bg/natureBG.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
      */}
      {/* Backdrop Effects Overlay - only affects background
      <div className="absolute inset-0 backdrop-blur-md backdrop-brightness-180 backdrop-saturate-60 backdrop-contrast-70"></div>
       */}
      {/* Content Layer */}
      <div className="relative h-full w-full flex flex-row bg-gray-200/60">
        {/* Desktop Layout */}
      {isDesktop && (
        <>
          <Drawer />
          <OverlayScrollPane
            wrapperClassName={isCalendarPage ? 'mx-4 my-4' : 'mx-10 my-10'}
            className={`BODY__ w-full flex flex-col items-center ${isCalendarPage ? 'p-3' : 'p-6'}`}
          >
            {renderCurrentPage()}
          </OverlayScrollPane>
        </>
      )}

      {/* Tablet Layout */}
      {isTablet && (
        <>
          <Drawer />
          <OverlayScrollPane
            wrapperClassName={isCalendarPage ? 'mx-3 my-3' : 'mx-6 my-6'}
            className={`BODY__ w-full flex flex-col items-center ${isCalendarPage ? 'p-2' : 'p-4'}`}
          >
            {renderCurrentPage()}
          </OverlayScrollPane>
        </>
      )}

      {/* Mobile Layout */}
      {isMobile && (
        <div className="w-full h-full flex flex-col">
          <div className="bg-white/80 border-b border-gray-400 h-10 flex items-center justify-start px-4">
            <div className="text-lg font-bold text-gray-800">DIAL_IN</div>
            <div className="text-sm text-gray-500 font-medium ml-2">{getVersionString()}</div>
          </div>
          <OverlayScrollPane className={`w-full px-4 ${isCalendarPage ? 'py-3' : 'py-8'}`}>
            {renderCurrentPage()}
          </OverlayScrollPane>
          <MobileNavigation />
        </div>
      )}
      </div>
    </div>
  )
}

export default App
