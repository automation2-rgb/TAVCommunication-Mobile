import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type TabBarVisibilityContextValue = {
  isTabBarHidden: boolean;
  setComposerKeyboardOpen: (open: boolean) => void;
};

const TabBarVisibilityContext = createContext<TabBarVisibilityContextValue | null>(null);

export function TabBarVisibilityProvider({ children }: { children: ReactNode }) {
  const [composerKeyboardOpen, setComposerKeyboardOpen] = useState(false);

  const setComposerKeyboardOpenStable = useCallback((open: boolean) => {
    setComposerKeyboardOpen(open);
  }, []);

  const value = useMemo(
    () => ({
      isTabBarHidden: composerKeyboardOpen,
      setComposerKeyboardOpen: setComposerKeyboardOpenStable,
    }),
    [composerKeyboardOpen, setComposerKeyboardOpenStable],
  );

  return (
    <TabBarVisibilityContext.Provider value={value}>{children}</TabBarVisibilityContext.Provider>
  );
}

export function useTabBarVisibility() {
  const context = useContext(TabBarVisibilityContext);
  if (!context) {
    throw new Error('useTabBarVisibility must be used within TabBarVisibilityProvider');
  }
  return context;
}
