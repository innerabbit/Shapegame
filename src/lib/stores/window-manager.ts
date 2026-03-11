import { create } from 'zustand';

export type WindowId = 'onboarding' | 'shop' | 'collection' | 'decks' | 'leaderboard';

export interface WindowState {
  id: WindowId;
  title: string;
  icon: string;
  isOpen: boolean;
  isMinimized: boolean;
  zIndex: number;
}

const WINDOW_DEFS: Omit<WindowState, 'isOpen' | 'isMinimized' | 'zIndex'>[] = [
  { id: 'onboarding', title: 'Welcome', icon: '🏠' },
  { id: 'shop', title: 'Shop', icon: '🛒' },
  { id: 'collection', title: 'Collection', icon: '🃏' },
  { id: 'decks', title: 'Deck Builder', icon: '📋' },
  { id: 'leaderboard', title: 'Leaderboard', icon: '🏆' },
];

interface WindowManagerStore {
  windows: WindowState[];
  focusedWindow: WindowId | null;
  nextZIndex: number;

  openWindow: (id: WindowId) => void;
  closeWindow: (id: WindowId) => void;
  minimizeWindow: (id: WindowId) => void;
  focusWindow: (id: WindowId) => void;
  toggleWindow: (id: WindowId) => void;
}

function getInitialWindows(): WindowState[] {
  return WINDOW_DEFS.map((def) => ({
    ...def,
    isOpen: false,
    isMinimized: false,
    zIndex: 10,
  }));
}

export const useWindowManager = create<WindowManagerStore>((set, get) => ({
  windows: getInitialWindows(),
  focusedWindow: null,
  nextZIndex: 11,

  openWindow: (id) => {
    const { nextZIndex } = get();
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isOpen: true, isMinimized: false, zIndex: nextZIndex } : w,
      ),
      focusedWindow: id,
      nextZIndex: nextZIndex + 1,
    }));
  },

  closeWindow: (id) => {
    set((state) => {
      const newWindows = state.windows.map((w) =>
        w.id === id ? { ...w, isOpen: false, isMinimized: false } : w,
      );
      // If we closed the focused window, focus the top-most remaining open window
      let newFocused = state.focusedWindow === id ? null : state.focusedWindow;
      if (newFocused === null) {
        const openWindows = newWindows
          .filter((w) => w.isOpen && !w.isMinimized)
          .sort((a, b) => b.zIndex - a.zIndex);
        newFocused = openWindows[0]?.id ?? null;
      }
      return { windows: newWindows, focusedWindow: newFocused };
    });
  },

  minimizeWindow: (id) => {
    set((state) => {
      const newWindows = state.windows.map((w) =>
        w.id === id ? { ...w, isMinimized: true } : w,
      );
      let newFocused = state.focusedWindow === id ? null : state.focusedWindow;
      if (newFocused === null) {
        const openWindows = newWindows
          .filter((w) => w.isOpen && !w.isMinimized)
          .sort((a, b) => b.zIndex - a.zIndex);
        newFocused = openWindows[0]?.id ?? null;
      }
      return { windows: newWindows, focusedWindow: newFocused };
    });
  },

  focusWindow: (id) => {
    const { nextZIndex } = get();
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMinimized: false, zIndex: nextZIndex } : w,
      ),
      focusedWindow: id,
      nextZIndex: nextZIndex + 1,
    }));
  },

  // Taskbar click: focused → minimize; minimized → restore+focus; closed → open+focus
  toggleWindow: (id) => {
    const { focusedWindow } = get();
    const win = get().windows.find((w) => w.id === id);
    if (!win) return;

    if (!win.isOpen) {
      get().openWindow(id);
    } else if (win.isMinimized) {
      get().focusWindow(id);
    } else if (focusedWindow === id) {
      get().minimizeWindow(id);
    } else {
      get().focusWindow(id);
    }
  },
}));
