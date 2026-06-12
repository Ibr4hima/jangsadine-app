import * as SQLite from 'expo-sqlite'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type Note = {
    id: number
    episode_id: string
    episode_titre: string
    sheikh: string
    timestamp: number
    texte: string
    created_at: string
}

type NotesContextType = {
    notes: Note[]
    ajouterNote: (note: Omit<Note, 'id' | 'created_at'>) => Promise<void>
    modifierNote: (id: number, texte: string) => Promise<void>
    supprimerNote: (id: number) => Promise<void>
    notesParEpisode: (episodeId: string) => Note[]
}

const NotesCtx = createContext<NotesContextType | null>(null)

export function NotesProvider({ children }: { children: React.ReactNode }) {
    const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null)
    const [notes, setNotes] = useState<Note[]>([])

    useEffect(() => {
        async function init() {
            const database = await SQLite.openDatabaseAsync('jangsadine.db')
            await database.execAsync(`
        CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          episode_id TEXT NOT NULL,
          episode_titre TEXT NOT NULL,
          sheikh TEXT NOT NULL,
          timestamp REAL NOT NULL,
          texte TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
      `)
            setDb(database)
            const rows = await database.getAllAsync<Note>('SELECT * FROM notes ORDER BY created_at DESC')
            setNotes(rows)
        }
        init()
    }, [])

    const ajouterNote = useCallback(async (note: Omit<Note, 'id' | 'created_at'>) => {
        if (!db) return
        const created_at = new Date().toISOString()
        await db.runAsync(
            'INSERT INTO notes (episode_id, episode_titre, sheikh, timestamp, texte, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [note.episode_id, note.episode_titre, note.sheikh, note.timestamp, note.texte, created_at]
        )
        const rows = await db.getAllAsync<Note>('SELECT * FROM notes ORDER BY created_at DESC')
        setNotes(rows)
    }, [db])

    const modifierNote = useCallback(async (id: number, texte: string) => {
        if (!db) return
        await db.runAsync('UPDATE notes SET texte = ? WHERE id = ?', [texte, id])
        setNotes(prev => prev.map(n => (n.id === id ? { ...n, texte } : n)))
    }, [db])

    const supprimerNote = useCallback(async (id: number) => {
        if (!db) return
        await db.runAsync('DELETE FROM notes WHERE id = ?', [id])
        setNotes(prev => prev.filter(n => n.id !== id))
    }, [db])

    const notesParEpisode = useCallback((episodeId: string) => {
        return notes.filter(n => n.episode_id === episodeId)
    }, [notes])

    return (
        <NotesCtx.Provider value={{ notes, ajouterNote, modifierNote, supprimerNote, notesParEpisode }}>
            {children}
        </NotesCtx.Provider>
    )
}

export function useNotes() {
    const ctx = useContext(NotesCtx)
    if (!ctx) throw new Error('useNotes doit être dans NotesProvider')
    return ctx
}