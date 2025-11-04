import React, { useState, useMemo } from 'react';
import { Entry, EntryType } from '../types';
import EntryCard from '../components/EntryCard';
import { SearchIcon, FilterIcon } from '../components/icons';

interface TimelineViewProps {
    entries: Entry[];
    updateEntry: (entry: Entry) => void;
    deleteEntry: (entryId: string) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({ entries, updateEntry, deleteEntry }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<EntryType | 'all'>('all');

    const filteredEntries = useMemo(() => {
        return entries.filter(entry => {
            const term = searchTerm.toLowerCase();
            const matchesSearch =
                entry.description.toLowerCase().includes(term) ||
                (entry.vendor && entry.vendor.toLowerCase().includes(term)) ||
                (entry.category && entry.category.toLowerCase().includes(term));
            const matchesType = filterType === 'all' || entry.type === filterType;
            return matchesSearch && matchesType;
        });
    }, [entries, searchTerm, filterType]);

    return (
        <div className="pt-8">
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-300">Linha do Tempo</h1>
            
            <div className="px-4 mb-4 sticky top-0 bg-gray-900/80 backdrop-blur-sm py-2">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><SearchIcon /></div>
                </div>
                <div className="mt-2">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as EntryType | 'all')}
                        className="w-full bg-gray-800 border border-gray-700 rounded-md py-1 px-2 text-sm"
                    >
                        <option value="all">Todos os Tipos</option>
                        <option value={EntryType.NOTE}>Nota</option>
                        <option value={EntryType.EXPENSE}>Despesa</option>
                        <option value={EntryType.EVENT}>Evento</option>
                    </select>
                </div>
            </div>

            {filteredEntries.length > 0 ? (
                <div className="px-4">
                    {filteredEntries.map(entry => <EntryCard key={entry.id} entry={entry} onUpdate={updateEntry} onDelete={deleteEntry} />)}
                </div>
            ) : (
                <div className="text-center text-gray-400 mt-16 px-4">
                    <p>Nenhuma entrada encontrada.</p>
                </div>
            )}
        </div>
    );
};

export default TimelineView;