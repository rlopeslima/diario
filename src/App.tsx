import React, { useState, useCallback, useEffect } from 'react';
import { Entry, View } from './types';
import BottomNav from './components/BottomNav';
import HomeView from './views/HomeView';
import TimelineView from './views/TimelineView';
import CalendarView from './views/CalendarView';
import OnboardingGuide from './components/OnboardingGuide';
import { RefreshIcon } from './components/icons';
import { supabase } from './integrations/supabase/client';
import { getEntriesFromDatabase, saveEntryToDatabase, updateEntryInDatabase, deleteEntryFromDatabase } from './services/supabaseService';

const App: React.FC = () => {
    const [view, setView] = useState<View>('home');
    const [entries, setEntries] = useState<Entry[]>([]);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Efeito para verificar autenticação e carregar dados
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUser(user);
                    await loadEntries(user.id);
                }
            } catch (err) {
                console.error("Erro ao verificar autenticação:", err);
                setError("Erro ao carregar dados de autenticação");
            }
        };

        checkAuth();

        // Configurar listener de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                setUser(session.user);
                await loadEntries(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
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
            setError("Falha ao carregar entradas do banco de dados");
        }
    };

    // Efeito para salvar entradas no banco de dados quando mudam
    useEffect(() => {
        if (user && entries.length > 0) {
            // Salvar todas as entradas no banco de dados
            entries.forEach(async (entry) => {
                try {
                    await saveEntryToDatabase({
                        ...entry,
                        user_id: user.id,
                    });
                } catch (error) {
                    console.error("Failed to save entry to database", error);
                }
            });
        }
    }, [entries, user]);

    // Efeito para verificar lembretes
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
                        // Limpar o lembrete após notificar
                        updateEntry({ ...entry, reminder: undefined });
                    }
                });
            }
        }, 60 * 1000);

        return () => clearInterval(intervalId);
    }, [entries]);

    const addEntry = useCallback(async (newEntryData: Omit<Entry, 'id' | 'date'> & { date: string }) => {
        if (!user) return;

        const newEntry: Entry = {
            ...newEntryData,
            id: new Date().toISOString() + Math.random(),
            date: newEntryData.date ? new Date(newEntryData.date) : new Date(),
        };

        setEntries(prevEntries => {
            const updatedEntries = [...prevEntries, newEntry].sort((a, b) => b.date.getTime() - a.date.getTime());
            return updatedEntries;
        });

        setView('timeline');
    }, [user]);

    const updateEntry = useCallback(async (updatedEntry: Entry) => {
        if (!user) return;

        try {
            await updateEntryInDatabase({
                ...updatedEntry,
                user_id: user.id,
            });

            setEntries(prevEntries => 
                prevEntries.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry)
            );
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

    const renderView = () => {
        if (error) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center text-red-400">
                        <p className="text-lg">Erro: {error}</p>
                        <p className="text-sm mt-2">Por favor, atualize a página e tente novamente.</p>
                    </div>
                </div>
            );
        }

        switch (view) {
            case 'home':
                return <HomeView addEntry={addEntry} />;
            case 'timeline':
                return <TimelineView entries={entries} updateEntry={updateEntry} deleteEntry={deleteEntry} />;
            case 'calendar':
                return <CalendarView entries={entries} updateEntry={updateEntry} deleteEntry={deleteEntry} />;
            default:
                return <HomeView addEntry={addEntry} />;
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

            {showOnboarding && <OnboardingGuide onComplete={handleOnboardingComplete} />}
            <main className="flex-grow overflow-y-auto pt-14 pb-20">
                {renderView()}
            </main>
            <BottomNav currentView={view} setView={setView} />
        </div>
    );
};

export default App;