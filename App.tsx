import React, { useState, useCallback, useEffect } from 'react';
import { Entry, View } from './types';
import BottomNav from './components/BottomNav';
import ChatView from './views/ChatView';
import CalendarView from './views/CalendarView';
import OnboardingGuide from './components/OnboardingGuide';
import InputBar from './components/InputBar';
import Login from './views/Login';
import LoadingSpinner from './components/LoadingSpinner';
import { RefreshIcon, SignOutIcon } from './components/icons';
import { supabase } from './src/integrations/supabase/client';
import { getEntriesFromDatabase, saveEntryToDatabase, updateEntryInDatabase, deleteEntryFromDatabase } from './services/supabaseService';
import ReloadPrompt from './components/ReloadPrompt';
import InstallPrompt from './components/InstallPrompt';

const App: React.FC = () => {
    const [view, setView] = useState<View>('chat');
    const [entries, setEntries] = useState<Entry[]>([]);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (session?.user) {
                await loadEntries(session.user.id);
            }
            setLoading(false);
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                await loadEntries(session.user.id);
            } else {
                setEntries([]);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadEntries = async (userId: string) => {
        try {
            const entriesData = await getEntriesFromDatabase(userId);
            setEntries(entriesData);
        } catch (error) {
            console.error("Failed to load entries from database", error);
        }
    };

    useEffect(() => {
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
        const intervalId = setInterval(() => {
            if (Notification.permission === 'granted') {
                const now = new Date();
                entries.forEach(entry => {
                    if (entry.reminder && new Date(entry.reminder) <= now) {
                        new Notification('Lembrete do Diário IA', {
                            body: entry.description,
                            icon: '/vite.svg',
                        });
                        updateEntry({ ...entry, reminder: undefined });
                    }
                });
            }
        }, 60 * 1000);
        return () => clearInterval(intervalId);
    }, [entries]);

    const addEntry = useCallback(async (newEntryData: Omit<Entry, 'id' | 'date'> & { date: string }) => {
        if (!user) {
            alert("Você precisa estar logado para adicionar uma entrada.");
            return;
        }
        try {
            const newEntry: Entry = {
                ...newEntryData,
                id: new Date().toISOString() + Math.random(),
                date: newEntryData.date ? new Date(newEntryData.date) : new Date(),
            };
            
            const savedEntry = await saveEntryToDatabase({ ...newEntry, user_id: user.id });

            setEntries(prevEntries => {
                const updatedEntries = [...prevEntries, savedEntry].sort((a, b) => b.date.getTime() - a.date.getTime());
                return updatedEntries;
            });
        } catch (error) {
            console.error("Failed to add entry:", error);
            alert(`Erro ao adicionar entrada: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    }, [user]);

    const updateEntry = useCallback(async (updatedEntry: Entry) => {
        if (!user) return;
        try {
            await updateEntryInDatabase({ ...updatedEntry, user_id: user.id });
            setEntries(prevEntries => prevEntries.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry));
        } catch (error) {
            console.error("Failed to update entry", error);
        }
    }, [user]);

    const deleteEntry = useCallback(async (entryId: string) => {
        if (!user) return;
        try {
            await deleteEntryFromDatabase(entryId, user.id);
            setEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
        } catch (error) {
            console.error("Failed to delete entry", error);
        }
    }, [user]);

    const handleOnboardingComplete = () => {
        localStorage.setItem('hasCompletedOnboarding', 'true');
        setShowOnboarding(false);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    const renderView = () => {
        switch (view) {
            case 'chat':
                return <ChatView entries={entries} updateEntry={updateEntry} deleteEntry={deleteEntry} />;
            case 'calendar':
                return <CalendarView entries={entries} updateEntry={updateEntry} deleteEntry={deleteEntry} />;
            default:
                return <ChatView entries={entries} updateEntry={updateEntry} deleteEntry={deleteEntry} />;
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-gray-900"><LoadingSpinner size={12} /></div>;
    }

    if (!user) {
        return <Login />;
    }

    return (
        <div className="h-screen w-screen flex flex-col font-sans bg-gray-900 text-gray-100">
             <header className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm h-14 flex items-center justify-between px-4 z-10 border-b border-gray-800">
                <h1 className="text-lg font-bold text-blue-300">Diário IA</h1>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => window.location.reload()}
                        className="p-2 text-gray-400 hover:text-blue-300 transition-colors rounded-full hover:bg-gray-700"
                        aria-label="Atualizar página"
                    >
                        <RefreshIcon />
                    </button>
                    <button
                        onClick={handleSignOut}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-full hover:bg-gray-700"
                        aria-label="Sair"
                    >
                        <SignOutIcon />
                    </button>
                </div>
            </header>

            {showOnboarding && <OnboardingGuide onComplete={handleOnboardingComplete} />}
            
            <main className={`flex-grow overflow-y-auto pt-14 ${view === 'chat' ? 'pb-32' : 'pb-20'}`}>
                {renderView()}
            </main>
            
            {view === 'chat' && <InputBar addEntry={addEntry} />}
            <BottomNav currentView={view} setView={setView} />
            <InstallPrompt />
            <ReloadPrompt />
        </div>
    );
};

export default App;