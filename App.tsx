import React, { useState, useCallback, useEffect } from 'react';
import { Entry, View } from './types';
import BottomNav from './components/BottomNav';
import HomeView from './views/HomeView';
import TimelineView from './views/TimelineView';
import CalendarView from './views/CalendarView';
import OnboardingGuide from './components/OnboardingGuide';
import { RefreshIcon } from './components/icons';

const App: React.FC = () => {
    const [view, setView] = useState<View>('home');
    const [entries, setEntries] = useState<Entry[]>(() => {
        try {
            const storedData = localStorage.getItem('daily-log-entries');
            if (storedData) {
                // Re-hydrate Date objects after parsing from JSON
                return JSON.parse(storedData).map((e: Entry) => ({
                    ...e,
                    date: new Date(e.date),
                }));
            }
        } catch (error) {
            console.error("Failed to load entries from localStorage", error);
        }
        return [];
    });
    const [showOnboarding, setShowOnboarding] = useState(false);

    // Effect for checking if onboarding has been completed
    useEffect(() => {
        const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');
        if (!hasCompletedOnboarding) {
            setShowOnboarding(true);
        }
    }, []);


    // Effect for saving entries to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('daily-log-entries', JSON.stringify(entries));
        } catch (error) {
            console.error("Failed to save entries to localStorage", error);
        }
    }, [entries]);

    // Effect for handling notifications
    useEffect(() => {
        // 1. Request permission on mount
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }

        // 2. Set up an interval to check for reminders
        const intervalId = setInterval(() => {
            if (Notification.permission === 'granted') {
                const now = new Date();
                entries.forEach(entry => {
                    if (entry.reminder && new Date(entry.reminder) <= now) {
                        new Notification('Lembrete do Diário IA', {
                            body: entry.description,
                            icon: '/vite.svg',
                        });
                        // Clear the reminder after notifying
                        updateEntry({ ...entry, reminder: undefined });
                    }
                });
            }
        }, 60 * 1000); // Check every minute

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, [entries]);


    const addEntry = useCallback((newEntryData: Omit<Entry, 'id' | 'date'> & { date: string }) => {
        setEntries(prevEntries => {
            const newEntry: Entry = {
                ...newEntryData,
                id: new Date().toISOString() + Math.random(),
                date: newEntryData.date ? new Date(newEntryData.date) : new Date(),
            };
            // Sort by date descending
            return [...prevEntries, newEntry].sort((a, b) => b.date.getTime() - a.date.getTime());
        });
        setView('timeline');
    }, []);

    const updateEntry = useCallback((updatedEntry: Entry) => {
        setEntries(prevEntries => 
            prevEntries.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry)
        );
    }, []);

    const handleOnboardingComplete = () => {
        localStorage.setItem('hasCompletedOnboarding', 'true');
        setShowOnboarding(false);
    };

    const renderView = () => {
        switch (view) {
            case 'home':
                return <HomeView addEntry={addEntry} />;
            case 'timeline':
                return <TimelineView entries={entries} updateEntry={updateEntry} />;
            case 'calendar':
                return <CalendarView entries={entries} updateEntry={updateEntry} />;
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