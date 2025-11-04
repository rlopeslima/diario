import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface CalendarProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    entries: { date: Date }[];
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect, entries }) => {
    const [currentDate, setCurrentDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const renderHeader = () => (
        <div className="flex items-center justify-between mb-4 px-2">
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                <ChevronLeftIcon />
            </button>
            <h2 className="text-lg font-semibold">
                {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                <ChevronRightIcon />
            </button>
        </div>
    );

    const renderDays = () => {
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        return (
            <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-2">
                {days.map(day => <div key={day}>{day}</div>)}
            </div>
        );
    };

    const renderCells = () => {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const numDays = daysInMonth(year, month);
        const firstDay = firstDayOfMonth(year, month);
        const cells = [];

        for (let i = 0; i < firstDay; i++) {
            cells.push(<div key={`empty-start-${i}`} className="h-10"></div>);
        }

        const entryDates = new Set(entries.map(e => new Date(e.date).toDateString()));

        for (let day = 1; day <= numDays; day++) {
            const date = new Date(year, month, day);
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            const hasEntry = entryDates.has(date.toDateString());

            cells.push(
                <div key={day} className="h-10 flex items-center justify-center" onClick={() => onDateSelect(date)}>
                    <div className={`relative w-9 h-9 flex items-center justify-center rounded-full cursor-pointer transition-all duration-200
                        ${isSelected ? 'bg-blue-500 text-white font-bold' : ''}
                        ${!isSelected && isToday ? 'bg-gray-700' : ''}
                        ${!isSelected ? 'hover:bg-gray-600' : ''}
                    `}>
                        <span>{day}</span>
                        {hasEntry && <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-400'}`}></div>}
                    </div>
                </div>
            );
        }
        
        return <div className="grid grid-cols-7 gap-y-1">{cells}</div>;
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-xl">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
        </div>
    );
};

export default Calendar;