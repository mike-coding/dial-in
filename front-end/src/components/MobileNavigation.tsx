import React from "react";
import { Page, useNavigationContext } from "../hooks/AppContext";

const MobileNavigation: React.FC = () => {
  const { navigation, navigateTo } = useNavigationContext();

  const navigationItems: { page: Page; icon: string; label: string }[] = [
    { page: "Dashboard", icon: "🏠", label: "Home" },
    { page: "Tasks", icon: "✓", label: "Tasks" },
    { page: "Calendar", icon: "📅", label: "Calendar" },
    { page: "Users", icon: "👥", label: "Users" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 h-20">
      <div className="flex justify-around items-center h-full px-4 max-w-md mx-auto">
        {navigationItems.map(({ page, icon, label }) => (
          <button
            key={page}
            onClick={() => navigateTo(page)}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-[60px] ${
              navigation.currentPage === page
                ? "bg-blue-100 text-blue-600 scale-105"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="text-xl mb-1">{icon}</span>
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileNavigation;
