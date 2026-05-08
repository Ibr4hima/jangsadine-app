import React, { createContext, useCallback, useContext, useRef, useState } from 'react'

type ScrollContextType = {
    cachéTabBar: boolean
    onScroll: (y: number) => void
    montrerTabBar: () => void
}

const ScrollCtx = createContext<ScrollContextType | null>(null)

export function ScrollProvider({ children }: { children: React.ReactNode }) {
    const [cachéTabBar, setCachéTabBar] = useState(false)
    const dernierY = useRef(0)

    const onScroll = useCallback((y: number) => {
        const delta = y - dernierY.current
        dernierY.current = y
        if (delta > 8 && y > 100) setCachéTabBar(true)
        else if (delta < -8) setCachéTabBar(false)
    }, [])

    const montrerTabBar = useCallback(() => {
        setCachéTabBar(false)
    }, [])

    return (
        <ScrollCtx.Provider value={{ cachéTabBar, onScroll, montrerTabBar }}>
            {children}
        </ScrollCtx.Provider>
    )
}

export function useScroll() {
    const ctx = useContext(ScrollCtx)
    if (!ctx) throw new Error('useScroll doit être dans ScrollProvider')
    return ctx
}