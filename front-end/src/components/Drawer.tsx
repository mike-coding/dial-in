import React from "react";
import { Page, useNavigationContext } from "../hooks/AppContext";

const Drawer: React.FC = () => {
  return (
    <div className="h-full w-52 bg-white shadow-lg border-r border-gray-200">
      <div className="p-4 py-6 border-b border-gray-200">
        <h2 className="flex flex-row justify-center text-lg font-bold text-gray-800">
          DIAL_IN
        </h2>
        <p className="flex flex-row justify-center text-xs text-gray-500 mt-1">
          v0.0.1
        </p>
      </div>
      <div className="__Navigation_Buttons w-full flex flex-col gap-2 p-4">
        <NavigationButton targetPage="Dashboard" icon="🏠" />
        <NavigationButton targetPage="Tasks" icon="✓" />
        <NavigationButton targetPage="Calendar" icon="📅" />
        <NavigationButton targetPage="Users" icon="👥" />
      </div>
    </div>
  );
};

export default Drawer;

interface NavigationButtonProps {
  targetPage: Page;
  icon: string;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({ targetPage, icon }) => {
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
      <span className="text-lg">{icon}</span>
      <span className="font-medium">{targetPage}</span>
    </button>
  );
};







