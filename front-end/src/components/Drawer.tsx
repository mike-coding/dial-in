import React from "react";
import { Page, useNavigationContext } from "../hooks/AppContext";
import { getVersionString } from '../utils/version';

// SVG Components (same as MobileNavigation)
const DashboardIcon = () => (
  <svg fill="currentColor" width="20" height="20" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <path d="M332.8 320h38.4c6.4 0 12.8-6.4 12.8-12.8V172.8c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v134.4c0 6.4 6.4 12.8 12.8 12.8zm96 0h38.4c6.4 0 12.8-6.4 12.8-12.8V76.8c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v230.4c0 6.4 6.4 12.8 12.8 12.8zm-288 0h38.4c6.4 0 12.8-6.4 12.8-12.8v-70.4c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v70.4c0 6.4 6.4 12.8 12.8 12.8zm96 0h38.4c6.4 0 12.8-6.4 12.8-12.8V108.8c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v198.4c0 6.4 6.4 12.8 12.8 12.8zM496 384H64V80c0-8.84-7.16-16-16-16H16C7.16 64 0 71.16 0 80v336c0 17.67 14.33 32 32 32h464c8.84 0 16-7.16 16-16v-32c0-8.84-7.16-16-16-16z"/>
  </svg>
);

const TasksIcon = () => (
  <svg fill="currentColor" width="20" height="20" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <path d="M139.61 35.5a12 12 0 0 0-17 0L58.93 98.81l-22.7-22.12a12 12 0 0 0-17 0L3.53 92.41a12 12 0 0 0 0 17l47.59 47.4a12.78 12.78 0 0 0 17.61 0l15.59-15.62L156.52 69a12.09 12.09 0 0 0 .09-17zm0 159.19a12 12 0 0 0-17 0l-63.68 63.72-22.7-22.1a12 12 0 0 0-17 0L3.53 252a12 12 0 0 0 0 17L51 316.5a12.77 12.77 0 0 0 17.6 0l15.7-15.69 72.2-72.22a12 12 0 0 0 .09-16.9zM64 368c-26.49 0-48.59 21.5-48.59 48S37.53 464 64 464a48 48 0 0 0 0-96zm432 16H208a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h288a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zm0-320H208a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h288a16 16 0 0 0 16-16V80a16 16 0 0 0-16-16zm0 160H208a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h288a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16z"/>
  </svg>
);

const CalendarIcon = () => (
  <svg fill="currentColor" width="20" height="20" viewBox="-32 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V192H0v272zm320-196c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zM192 268c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zM64 268c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12v-40zM400 64h-48V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H160V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H48C21.5 64 0 85.5 0 112v48h448v-48c0-26.5-21.5-48-48-48z"/>
  </svg>
);

const UsersIcon = () => (
  <svg fill="currentColor" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
  </svg>
);

const Drawer: React.FC = () => {
  const navigationItems: { page: Page; icon: React.ReactNode; label: string }[] = [
    { page: "Dashboard", icon: <DashboardIcon />, label: "Dash" },
    { page: "Tasks", icon: <TasksIcon />, label: "Tasks" },
    { page: "Calendar", icon: <CalendarIcon />, label: "Calendar" },
    { page: "Users", icon: <UsersIcon />, label: "Profile" },
  ];

  return (
    <div className="h-full w-52 bg-white shadow-lg border-r border-gray-200">
      <div className="p-4 py-6 border-b border-gray-200 flex flex-row justify-center gap-1">
        <h2 className="flex flex-row justify-center text-lg font-bold text-gray-800">
          DIAL_IN
        </h2>
        <p className="flex flex-row justify-center text-xs text-gray-500 mt-2">
          {getVersionString()}
        </p>
      </div>
      <div className="__Navigation_Buttons w-full flex flex-col gap-2 p-4">
        {navigationItems.map(({ page, icon, label }) => (
          <NavigationButton key={page} targetPage={page} icon={icon} label={label} />
        ))}
      </div>
    </div>
  );
};

export default Drawer;

interface NavigationButtonProps {
  targetPage: Page;
  icon: React.ReactNode;
  label: string;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({ targetPage, icon, label }) => {
  const { navigation, navigateTo } = useNavigationContext();
  const isActive = navigation.currentPage === targetPage;

  return (
    <button
      className={`flex flex-row items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left w-full ${
        isActive
          ? "bg-blue-100 text-blue-700 shadow-sm"
          : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
      }`}
      onClick={() => navigateTo(targetPage)}
    >
      <div>{icon}</div>
      <span className="font-medium">{label}</span>
    </button>
  );
};







