import React, { useState, useCallback, useEffect } from 'react';
import { Entry, View } from './types';
import BottomNav from './components/BottomNav';
import HomeView from './views/HomeView';
import TimelineView from './views/TimelineView';
import CalendarView from './views/CalendarView';
import OnboardingGuide from './components/OnboardingGuide';
import { RefreshIcon } from './components/icons';
import { supabase } from './integrations/supabase/client';
import { getEntriesFromDatabase, addEntryToDatabase, updateEntryInDatabase, deleteEntryFromDatabase } from './services/supabaseService';
import { User } from '@supabase/supabase-js';

const App: React.FC = () => {
    const [view, setView] = useState<View>('home');
    const [entries, setEntries] = useState<Entry[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('hasCompletedOnboarding'));

    useEffect(() => {
        const session = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                try {
                    const entriesData = await getEntriesFromDatabase(session.user.id);
                    setEntries(entriesData);
                } catch (err) {
                    setError("Não foi possível carregar suas entradas.");
                }
            }
            setIsLoading(false);
        });

        return () => session.data.subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const intervalId = setInterval(() => {
            if (Notification.permission === 'granted') {
                const now = new Date();
                entries.forEach(entry => {
                    if (entry.reminder && new Date(entry.reminder) <= now) {
                        new Notification('Lembrete do Diário IA', { body: entry.description });
                        updateEntry({ ...entry, reminder: undefined });
                    }
                });
            }
        }, 60 * 1000);

        return () => clearInterval(intervalId);
    }, [entries]);

    const addEntry = useCallback(async (newEntryData: Omit<Entry, 'id' | 'user_id' | 'date'> & { date: string }) => {
        if (!user) return;
        
        const entryToAdd: Omit<Entry, 'id'> = {
            ...newEntryData,
            user_id: user.id,
            date: new Date(newEntryData.date),
        };

        try {
            const newEntry = await addEntryToDatabase(entryToAdd);
            setEntries(prev => [newEntry, ...prev].sort((a, b) => b.date.getTime() - a.date.getTime()));
            setView('timeline');
        } catch (err) {
            setError("Falha ao salvar a nova entrada.");
        }
    }, [user]);

    const updateEntry = useCallback(async (updatedEntry: Entry) => {
        if (!user) return;
        try {
            const savedEntry = await updateEntryInDatabase(updatedEntry);
            setEntries(prev => prev.map(e => e.id === savedEntry.id ? savedEntry : e));
        } catch (err) {
            setError("Falha ao atualizar a entrada.");
        }
    }, [user]);

    const deleteEntry = useCallback(async (entryId: string) => {
        if (!user) return;
        try {
            await deleteEntryFromDatabase(entryId, user.id);
            setEntries(prev => prev.filter(e => e.id !== entryId));
        } catch (err) {
            setError("Falha ao excluir a entrada.");
        }
    }, [user]);

    const renderView = () => {
        if (isLoading) return <div className="flex justify-center items-center h-full">Carregando...</div>;
        if (error) return <div className="flex justify-center items-center h-full text-red-400">{error}</div>;
        
        switch (view) {
            case 'home': return <HomeView addEntry={addEntry} />;
            case 'timeline': return <TimelineView entries={entries} updateEntry={updateEntry} deleteEntry={deleteEntry} />;
            case 'calendar': return <CalendarView entries={entries} updateEntry={updateEntry} deleteEntry={deleteEntry} />;
            default: return <HomeView addEntry={addEntry} />;
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col font-sans bg-gray-900 text-gray-100">
            <header className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm h-14 flex items-center justify-end px-4 z-10 border-b border-gray-800">
                <button
                    onClick={() => window.location.reload()}
                    className="p-2 text-gray-400 hover:text-blue-300 transition-colors rounded-full hover:bg-gray-700"
                    aria-label="Atualizar página"
                >
                    <RefreshIcon />
                </button>
            </header>

            {showOnboarding && <OnboardingGuide onComplete={() => {
                localStorage.setItem('hasCompletedOnboarding', 'true');
                setShowOnboarding(false);
            }} />}
            
            <main className="flex-grow overflow-y-auto pt-14 pb-20">
                {renderView()}
            </main>
            
            <BottomNav currentView={view} setView={setView} />
        </div>
    );
};

export default App;