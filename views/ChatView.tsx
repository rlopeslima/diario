import React, { useState, useMemo } from 'react';
import { Entry, EntryType } from '../types';
import EntryCard from '../components/EntryCard';
import { SearchIcon, FilterIcon, ExportIcon, HomeIcon } from '../components/icons';

interface ChatViewProps {
    entries: Entry[];
    updateEntry: (entry: Entry) => void;
    deleteEntry: (entryId: string) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ entries, updateEntry, deleteEntry }) => {
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
        const headers = ['ID', 'Data', 'Tipo', 'Descrição', 'Valor', 'Fornecedor', 'Categoria', 'Lembrete', 'Itens'];
        const rows = filteredEntries.map(entry => {
            const itemsString = entry.items ? entry.items.map(item => `${item.name} (R$ ${item.price.toFixed(2).replace('.',',')})`).join('; ') : '';
            return `
            <tr>
                <td contenteditable="false" style="color: #9ca3af;">${entry.id}</td>
                <td contenteditable="true">${entry.date.toISOString().split('T')[0]}</td>
                <td contenteditable="true">${entry.type}</td>
                <td contenteditable="true">${entry.description}</td>
                <td contenteditable="true">${entry.amount ?? ''}</td>
                <td contenteditable="true">${entry.vendor ?? ''}</td>
                <td contenteditable="true">${entry.category ?? ''}</td>
                <td contenteditable="true">${entry.reminder ? new Date(entry.reminder).toISOString().substring(0, 16).replace('T', ' ') : ''}</td>
                <td contenteditable="true">${itemsString}</td>
            </tr>
        `}).join('');
        const htmlString = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Exportação Diário IA</title>
            <style>
                body { font-family: sans-serif; background-color: #111827; color: #d1d5db; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #374151; padding: 8px; text-align: left; }
                th { background-color: #1f2937; }
                tr:nth-child(even) { background-color: #1f2937; }
                td[contenteditable="true"]:focus { background-color: #4b5563; outline: 2px solid #3b82f6; }
            </style>
        </head>
        <body>
            <h1>Exportação de Entradas - Diário IA</h1>
            <p>Dados exportados em: ${new Date().toLocaleString('pt-BR')}</p>
            <p>Você pode editar os campos clicando neles.</p>
            <table>
                <thead>
                    <tr>
                        ${headers.map(h => `<th>${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </body>
        </html>`;
        const blob = new Blob([htmlString], { type: 'text/html;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'diario_ia_export.html');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="pt-4">
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
                        <button onClick={handleExport} className="text-gray-400 hover:text-blue-400 p-1" aria-label="Exportar dados">
                            <ExportIcon />
                        </button>
                        <button onClick={() => setShowFilters(!showFilters)} className="text-gray-400 hover:text-blue-400 p-1" aria-label="Alternar filtros">
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
                    {filteredEntries.map(entry => <EntryCard key={entry.id} entry={entry} onUpdate={updateEntry} onDelete={deleteEntry} />)}
                </div>
            ) : (
                <div className="text-center text-gray-400 mt-16 px-4 flex flex-col items-center">
                    <div className="w-16 h-16 text-gray-600 mb-4">
                        <HomeIcon />
                    </div>
                    <h2 className="text-xl font-semibold">Bem-vindo ao seu Diário IA!</h2>
                    <p className="mt-2 max-w-sm">
                        {searchTerm || filterType !== 'all'
                            ? "Nenhuma entrada corresponde à sua busca. Tente ajustar seus filtros."
                            : "Sua linha do tempo está vazia. Use a barra de entrada abaixo para adicionar sua primeira nota por texto, voz ou anexando um recibo."}
                    </p>
                </div>
            )}
        </div>
    );
};

export default ChatView;