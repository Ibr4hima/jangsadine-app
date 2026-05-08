import React, { createContext, useContext, useState } from 'react'

type TabBarContextType = {
  tabBarVisible: boolean
  showTabBar: () => void
  hideTabBar: () => void
}

const TabBarCtx = createContext<TabBarContextType | null>(null)

export function TabBarProvider({ children }: { children: React.ReactNode }) {
  const [tabBarVisible, setTabBarVisible] = useState(false)
  const showTabBar = () => setTabBarVisible(true)
  const hideTabBar = () => setTabBarVisible(false)
  return (
    <TabBarCtx.Provider value={{ tabBarVisible, showTabBar, hideTabBar }}>
      {children}
    </TabBarCtx.Provider>
  )
}

export function useTabBar() {
  const ctx = useContext(TabBarCtx)
  if (!ctx) throw new Error('useTabBar doit être dans TabBarProvider')
  return ctx
}
