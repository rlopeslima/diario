import React, { useState, useMemo } from 'react';
import { Entry } from '../types';
import Calendar from '../components/Calendar';
import EntryCard from '../components/EntryCard';

interface CalendarViewProps {
    entries: Entry[];
    updateEntry: (entry: Entry) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ entries, updateEntry }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());

    const filteredEntries = useMemo(() => {
        return entries.filter(entry => 
            new Date(entry.date).toDateString() === selectedDate.toDateString()
        );
    }, [entries, selectedDate]);

    return (
        <div className="p-4 pt-8">
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-300">Calendário</h1>
            <Calendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                entries={entries}
            />
            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4 border-b-2 border-gray-700 pb-2">
                    Entradas para {selectedDate.toLocaleDateString('pt-BR', { month: 'long', day: 'numeric' })}
                </h2>
                {filteredEntries.length > 0 ? (
                    filteredEntries.map(entry => <EntryCard key={entry.id} entry={entry} onUpdate={updateEntry} />)
                ) : (
                    <div className="text-center text-gray-400 mt-8">
                        <p>Nenhuma entrada para este dia.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarView;