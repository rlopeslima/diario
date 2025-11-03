
import React, { useState, useMemo } from 'react';
import { Entry, EntryType } from '../types';
import EntryCard from '../components/EntryCard';
import { SearchIcon, FilterIcon, ExportIcon } from '../components/icons';

interface TimelineViewProps {
    entries: Entry[];
    updateEntry: (entry: Entry) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({ entries, updateEntry }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<EntryType | 'all'>('all');
    const [showFilters, setShowFilters] = useState(false);

    const filteredEntries = useMemo(() => {
        return entries.filter(entry => {
            const term = searchTerm.toLowerCase();
            const matchesSearchTerm =
                entry.description.toLowerCase().includes(term) ||
                (entry.vendor && entry.vendor.toLowerCase().includes(term)) ||
                (entry.category && entry.category.toLowerCase().includes(term));

            const matchesType = filterType === 'all' || entry.type === filterType;

            return matchesSearchTerm && matchesType;
        });
    }, [entries, searchTerm, filterType]);

    const handleExport = () => {
        if (filteredEntries.length === 0) {
            alert("Nenhuma entrada para exportar.");
            return;
        }

        const headers = ['id', 'date', 'type', 'description', 'amount', 'vendor', 'category', 'reminder'];
        
        const escapeCsvField = (field: any): string => {
            if (field === null || field === undefined) return '';
            const stringField = String(field);
            if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                return `"${stringField.replace(/"/g, '""')}"`;
            }
            return stringField;
        };

        const csvRows = [
            headers.join(','),
            ...filteredEntries.map(entry => [
                entry.id,
                entry.date.toISOString(),
                entry.type,
                entry.description,
                entry.amount ?? '',
                entry.vendor ?? '',
                entry.category ?? '',
                entry.reminder ?? ''
            ].map(escapeCsvField).join(','))
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'diario_ia_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="pt-8">
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-300">Linha do Tempo</h1>
            
            <div className="px-4 mb-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar entradas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-24 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <SearchIcon />
                    </div>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                        <button 
                            onClick={handleExport}
                            className="text-gray-400 hover:text-blue-400 p-1"
                            aria-label="Exportar dados"
                        >
                            <ExportIcon />
                        </button>
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className="text-gray-400 hover:text-blue-400 p-1"
                            aria-label="Alternar filtros"
                        >
                            <FilterIcon />
                        </button>
                    </div>
                </div>
                {showFilters && (
                    <div className="bg-gray-800 p-3 mt-2 rounded-lg border border-gray-700">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Filtrar por Tipo</label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as EntryType | 'all')}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-sm"
                        >
                            <option value="all">Todos os Tipos</option>
                            <option value={EntryType.NOTE}>Nota</option>
                            <option value={EntryType.EXPENSE}>Despesa</option>
                            <option value={EntryType.EVENT}>Evento</option>
                        </select>
                    </div>
                )}
            </div>

            {filteredEntries.length > 0 ? (
                <div>
                    {filteredEntries.map(entry => <EntryCard key={entry.id} entry={entry} onUpdate={updateEntry} />)}
                </div>
            ) : (
                <div className="text-center text-gray-400 mt-16 px-4">
                    <p className="text-lg">Nenhuma entrada corresponde à sua busca.</p>
                    <p className="mt-2">Tente ajustar seu termo de busca ou filtros, ou vá para a aba Agente para adicionar uma nova entrada.</p>
                </div>
            )}
        </div>
    );
};

export default TimelineView;
