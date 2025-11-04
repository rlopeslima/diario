import React, { useState, useCallback, useEffect } from 'react';
import { Entry, View } from './types';
import BottomNav from './components/BottomNav';
import ChatView from './views/ChatView';
import CalendarView from './views/CalendarView';
import OnboardingGuide from './components/OnboardingGuide';
import InputBar from './components/InputBar';
import { RefreshIcon } from './components/icons';
import ReloadPrompt from './components/ReloadPrompt';
import InstallPrompt from './components/InstallPrompt';

const App: React.FC = () => {
    const [view, setView] = useState<View>('chat');
    const [entries, setEntries] = useState<Entry[]>([]);
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');
        if (!hasCompletedOnboarding) {
            setShowOnboarding(true);
        }
    }, []);

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

    const addEntry = useCallback((newEntryData: Omit<Entry, 'id' | 'date'> & { date: string }) => {
        const newEntry: Entry = {
            ...newEntryData,
            id: new Date().toISOString() + Math.random(),
            date: newEntryData.date ? new Date(newEntryData.date) : new Date(),
        };
        
        setEntries(prevEntries => {
            const updatedEntries = [...prevEntries, newEntry].sort((a, b) => b.date.getTime() - a.date.getTime());
            return updatedEntries;
        });
    }, []);

    const updateEntry = useCallback((updatedEntry: Entry) => {
        setEntries(prevEntries => prevEntries.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry));
    }, []);

    const deleteEntry = useCallback((entryId: string) => {
        setEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
    }, []);

    const handleOnboardingComplete = () => {
        localStorage.setItem('hasCompletedOnboarding', 'true');
        setShowOnboarding(false);
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