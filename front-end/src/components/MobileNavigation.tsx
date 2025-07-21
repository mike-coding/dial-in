import React, { useState, useEffect } from "react";
import { Page, useNavigationContext } from "../hooks/AppContext";

// SVG Components
const DashboardIcon = () => (
  <svg fill="currentColor" width="24" height="24" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <path d="M332.8 320h38.4c6.4 0 12.8-6.4 12.8-12.8V172.8c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v134.4c0 6.4 6.4 12.8 12.8 12.8zm96 0h38.4c6.4 0 12.8-6.4 12.8-12.8V76.8c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v230.4c0 6.4 6.4 12.8 12.8 12.8zm-288 0h38.4c6.4 0 12.8-6.4 12.8-12.8v-70.4c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v70.4c0 6.4 6.4 12.8 12.8 12.8zm96 0h38.4c6.4 0 12.8-6.4 12.8-12.8V108.8c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v198.4c0 6.4 6.4 12.8 12.8 12.8zM496 384H64V80c0-8.84-7.16-16-16-16H16C7.16 64 0 71.16 0 80v336c0 17.67 14.33 32 32 32h464c8.84 0 16-7.16 16-16v-32c0-8.84-7.16-16-16-16z"/>
  </svg>
);

const TasksIcon = () => (
  <svg fill="currentColor" width="24" height="24" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <path d="M139.61 35.5a12 12 0 0 0-17 0L58.93 98.81l-22.7-22.12a12 12 0 0 0-17 0L3.53 92.41a12 12 0 0 0 0 17l47.59 47.4a12.78 12.78 0 0 0 17.61 0l15.59-15.62L156.52 69a12.09 12.09 0 0 0 .09-17zm0 159.19a12 12 0 0 0-17 0l-63.68 63.72-22.7-22.1a12 12 0 0 0-17 0L3.53 252a12 12 0 0 0 0 17L51 316.5a12.77 12.77 0 0 0 17.6 0l15.7-15.69 72.2-72.22a12 12 0 0 0 .09-16.9zM64 368c-26.49 0-48.59 21.5-48.59 48S37.53 464 64 464a48 48 0 0 0 0-96zm432 16H208a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h288a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zm0-320H208a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h288a16 16 0 0 0 16-16V80a16 16 0 0 0-16-16zm0 160H208a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h288a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16z"/>
  </svg>
);

const CalendarIcon = () => (
  <svg fill="currentColor" width="24" height="24" viewBox="-32 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V192H0v272zm320-196c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zM192 268c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zM64 268c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12v-40zM400 64h-48V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H160V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H48C21.5 64 0 85.5 0 112v48h448v-48c0-26.5-21.5-48-48-48z"/>
  </svg>
);

const UsersIcon = () => (
  <svg fill="currentColor" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
  </svg>
);

const CategoriesIcon = () => (
  <svg fill="currentColor" width="24" height="24" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <path d="M296 32h192c13.255 0 24 10.745 24 24v160c0 13.255-10.745 24-24 24H296c-13.255 0-24-10.745-24-24V56c0-13.255 10.745-24 24-24zm-80 0H24C10.745 32 0 42.745 0 56v160c0 13.255 10.745 24 24 24h192c13.255 0 24-10.745 24-24V56c0-13.255-10.745-24-24-24zM0 296v160c0 13.255 10.745 24 24 24h192c13.255 0 24-10.745 24-24V296c0-13.255-10.745-24-24-24H24c-13.255 0-24 10.745-24 24zm296 184h192c13.255 0 24-10.745 24-24V296c0-13.255-10.745-24-24-24H296c-13.255 0-24 10.745-24 24v160c0 13.255 10.745 24 24 24z"/>
  </svg>
);

const RulesIcon = () => (
  <svg fill="currentColor" width="24" height="24" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <path d="M440.65 12.57l4 82.77A247.16 247.16 0 0 0 255.83 8C134.73 8 33.91 94.92 12.29 209.82A12 12 0 0 0 24.09 224h49.05a12 12 0 0 0 11.67-9.26 175.91 175.91 0 0 1 317-56.94l-101.46-4.86a12 12 0 0 0-12.57 12v47.41a12 12 0 0 0 12 12H500a12 12 0 0 0 12-12V12a12 12 0 0 0-12-12h-47.37a12 12 0 0 0-11.98 12.57zM255.83 432a175.61 175.61 0 0 1-146-77.8l101.8 4.87a12 12 0 0 0 12.57-12v-47.4a12 12 0 0 0-12-12H12a12 12 0 0 0-12 12V500a12 12 0 0 0 12 12h47.35a12 12 0 0 0 12-12.6l-4.15-82.57A247.17 247.17 0 0 0 255.83 504c121.11 0 221.93-86.92 243.55-201.82a12 12 0 0 0-11.8-14.18h-49.05a12 12 0 0 0-11.67 9.26A175.86 175.86 0 0 1 255.83 432z"/>
  </svg>
);

const MobileNavigation: React.FC = () => {
  const { navigation, navigateTo } = useNavigationContext();

  // Check if we're in the Tasks module (Tasks, Categories, or Rules)
  const isTasksModule = ["Tasks", "Categories", "Rules"].includes(navigation.currentPage);
  
  // State to manage delayed unmounting for exit animation
  const [showExpanded, setShowExpanded] = useState(isTasksModule);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isTasksModule && !showExpanded) {
      // Expanding: show immediately
      setShowExpanded(true);
      setIsExiting(false);
    } else if (!isTasksModule && showExpanded && !isExiting) {
      // Collapsing: start exit animation
      setIsExiting(true);
      const timer = setTimeout(() => {
        setShowExpanded(false);
        setIsExiting(false);
      }, 400); // Slightly longer than animation duration
      return () => clearTimeout(timer);
    }
  }, [isTasksModule, showExpanded, isExiting]);

  const mainNavigationItems: { page: Page; icon: React.ReactNode; label: string }[] = [
    { page: "Dashboard", icon: <DashboardIcon />, label: "Dash" },
    { page: "Tasks", icon: <TasksIcon />, label: "Tasks" },
    { page: "Calendar", icon: <CalendarIcon />, label: "Calendar" },
    { page: "Users", icon: <UsersIcon />, label: "Profile" },
  ];

  const tasksSubNavItems = [
    { page: "Tasks" as Page, icon: <TasksIcon />, label: "Tasks" },
    { page: "Categories" as Page, icon: <CategoriesIcon />, label: "Categories" },
    { page: "Rules" as Page, icon: <RulesIcon />, label: "Rules" },
  ];

  return (
    <>
      <style>
        {`
          @keyframes fadeInSlideUp {
            0% {
              opacity: 0;
              transform: translateY(10px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fadeOutSlideDown {
            0% {
              opacity: 1;
              transform: translateY(0);
            }
            100% {
              opacity: 0;
              transform: translateY(10px);
            }
          }
        `}
      </style>
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 shadow-lg z-50 h-20">
      <div className="flex justify-around items-center h-full px-4 max-w-md mx-auto">
        {mainNavigationItems.map(({ page, icon, label }) => (
          <div 
            key={page} 
            className={`transition-all duration-300 ease-in-out ${
              page === "Tasks" && isTasksModule ? "flex-1 max-w-[180px]" : "min-w-[60px] max-w-[60px]"
            }`}
          >
            {page === "Tasks" && isTasksModule ? (
              // Expanded Tasks module with horizontal sub-navigation
              <div className="flex items-center justify-start gap-1 bg-blue-100 rounded-lg p-1 transition-all duration-300 ease-in-out">
                {tasksSubNavItems.map(({ page: subPage, icon: subIcon, label: subLabel }, index) => (
                  <button
                    key={subPage}
                    onClick={() => navigateTo(subPage)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-300 min-w-[45px] ${
                      navigation.currentPage === subPage
                        ? "text-blue-600 scale-105"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    style={{ 
                      opacity: 0,
                      transform: 'translateY(10px)',
                      animation: `fadeInSlideUp 300ms ease-out ${index * 100}ms forwards`
                    }}
                  >
                    <div className="mb-1">{subIcon}</div>
                    <span className="text-xs font-medium">{subLabel}</span>
                  </button>
                ))}
              </div>
            ) : (
              // Regular navigation button
              <button
                onClick={() => navigateTo(page)}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-[60px] ${
                  navigation.currentPage === page
                    ? "bg-blue-100 text-blue-600 scale-105"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="mb-1">{icon}</div>
                <span className="text-xs font-medium">{label}</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
    </>
  );
};

export default MobileNavigation;
