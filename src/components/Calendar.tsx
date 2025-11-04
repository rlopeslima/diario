import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { Entry } from '../types';

interface CalendarProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    entries: Entry[];
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect, entries }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

    const changeMonth = (offset: number) => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const entryDates = new Set(entries.map(e => new Date(e.date).toDateString()));

    const cells = Array.from({ length: firstDayOfMonth }, (_, i) => <div key={`empty-${i}`} />);

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isSelected = date.toDateString() === selectedDate.toDateString();
        const isToday = date.toDateString() === new Date().toDateString();
        const hasEntry = entryDates.has(date.toDateString());

        cells.push(
            <div key={day} className="h-10 flex items-center justify-center" onClick={() => onDateSelect(date)}>
                <div className={`relative w-9 h-9 flex items-center justify-center rounded-full cursor-pointer transition-all
                    ${isSelected ? 'bg-blue-500 text-white' : ''}
                    ${!isSelected && isToday ? 'bg-gray-700' : ''}
                    ${!isSelected ? 'hover:bg-gray-600' : ''}
                `}>
                    <span>{day}</span>
                    {hasEntry && <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-400'}`} />}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-xl">
            <div className="flex items-center justify-between mb-4 px-2">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-700"><ChevronLeftIcon /></button>
                <h2 className="text-lg font-semibold">{currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-700"><ChevronRightIcon /></button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-y-1">{cells}</div>
        </div>
    );
};

export default Calendar;