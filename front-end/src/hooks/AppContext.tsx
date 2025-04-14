import { create } from 'zustand';

export type Page = "Tasks" | "Calendar" | "Users" | "Dashboard";

interface NavigationState {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const useStore = create<NavigationState>((set) => ({
  currentPage: "Dashboard",
  setCurrentPage: (page: Page) => set({ currentPage: page }),
}));

export default useStore;
