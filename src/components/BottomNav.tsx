import React from 'react';
import { View } from '../types';
import { HomeIcon, TimelineIcon, CalendarIcon } from './icons';

interface BottomNavProps {
    currentView: View;
    setView: (view: View) => void;
}

const navItems: { view: View; label: string; icon: React.ReactElement }[] = [
    { view: 'home', label: 'Agente', icon: <HomeIcon /> },
    { view: 'timeline', label: 'Linha do Tempo', icon: <TimelineIcon /> },
    { view: 'calendar', label: 'Calendário', icon: <CalendarIcon /> },
];

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView }) => {
    return (
        <footer id="onboarding-nav-bar" className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
            <nav className="flex justify-around items-center h-16 max-w-md mx-auto">
                {navItems.map(({ view, label, icon }) => (
                    <button
                        key={view}
                        onClick={() => setView(view)}
                        className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                            currentView === view ? 'text-blue-400' : 'text-gray-400 hover:text-blue-300'
                        }`}
                    >
                        <div className="w-6 h-6 mb-1">{icon}</div>
                        <span className="text-xs font-medium">{label}</span>
                    </button>
                ))}
            </nav>
        </footer>
    );
};

export default BottomNav;