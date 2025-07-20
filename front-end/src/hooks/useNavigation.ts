import { create } from 'zustand';
import React from 'react';
import { Page } from './types';

interface NavigationState {
  currentPage: Page;
}

interface NavigationStore {
  navigation: NavigationState;
  navigateTo: (page: Page) => void;
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  navigation: { currentPage: "Dashboard" },
  navigateTo: (page) => set({ navigation: { currentPage: page } }),
}));

export const useNavigationContext = () => {
  const navigation = useNavigationStore((state) => state.navigation);
  const navigateTo = useNavigationStore((state) => state.navigateTo);
  return React.useMemo(() => ({ navigation, navigateTo }), [navigation, navigateTo]);
};
