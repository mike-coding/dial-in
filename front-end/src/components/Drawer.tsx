import React from "react";
import useStore, { Page } from "../hooks/AppContext";


const Drawer: React.FC = () => {
  return (
    <div className="h-full w-52 bg-white">
      <div className="p-2 py-5">
        <h2 className="flex flex-row justify-center text-xl font-bold mb-4 border-b-3 pb-5 border-gray-200">DIAL_IN [v0.0.1]</h2>
      </div>
      <div className="__Navigation_Buttons w-full flex flex-col gap-5 text-xl">
        <NavigationButton targetPage="Dashboard"/>
        <NavigationButton targetPage="Tasks"/>
        <NavigationButton targetPage="Calendar"/>
        <NavigationButton targetPage="Users"/>
      </div>
  </div>
  );
};

export default Drawer;

interface NavigationButtonProps {
  targetPage:Page
}

const NavigationButton: React.FC<NavigationButtonProps> = ({targetPage}) => {
  const { setCurrentPage } = useStore();
  return (
    <div 
      className="flex flex-row justify-center hover:scale-110 "
      onClick={() => setCurrentPage(targetPage)}
      >
        {targetPage}
    </div>
  )
}







