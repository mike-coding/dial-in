import './App.css'
import Drawer from './components/Drawer'
import Tasks from './components/Tasks'
import useStore from './hooks/AppContext'

function App() {
  const { currentPage } = useStore();

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'Tasks':
        return <Tasks />;
      case 'Dashboard':
        return (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Dashboard</h1>
            <p className="text-gray-600">Welcome to your dashboard!</p>
          </div>
        );
      case 'Calendar':
        return (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Calendar</h1>
            <p className="text-gray-600">Calendar feature coming soon...</p>
          </div>
        );
      case 'Users':
        return (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Users</h1>
            <p className="text-gray-600">User management coming soon...</p>
          </div>
        );
      default:
        return (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Dashboard</h1>
            <p className="text-gray-600">Welcome to your dashboard!</p>
          </div>
        );
    }
  };

  return (
    <div className="relative h-screen w-screen flex flex-row justify-center items-center bg-gray-100">
      <Drawer/>
      <div className="BODY__ w-full flex flex-col items-center mx-10 my-10 p-6"> 
        {renderCurrentPage()}
      </div>
    </div>
  )
}

export default App
