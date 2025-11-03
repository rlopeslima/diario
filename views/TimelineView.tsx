import React, { useState, useMemo } from 'react';
import { Entry, EntryType } from '../types';
import EntryCard from '../components/EntryCard';
import { SearchIcon, FilterIcon, ExportIcon } from '../components/icons';

interface TimelineViewProps {
    entries: Entry[];
    updateEntry: (entry: Entry) => void;
    deleteEntry: (entryId: string) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({ entries, updateEntry, deleteEntry }) => {
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

        const headers = ['ID', 'Data', 'Tipo', 'Descrição', 'Valor', 'Fornecedor', 'Categoria', 'Lembrete'];

        const rows = filteredEntries.map(entry => `
            <tr>
                <td contenteditable="false" style="color: #9ca3af;">${entry.id}</td>
                <td contenteditable="true">${entry.date.toISOString().split('T')[0]}</td>
                <td contenteditable="true">${entry.type}</td>
                <td contenteditable="true">${entry.description}</td>
                <td contenteditable="true">${entry.amount ?? ''}</td>
                <td contenteditable="true">${entry.vendor ?? ''}</td>
                <td contenteditable="true">${entry.category ?? ''}</td>
                <td contenteditable="true">${entry.reminder ? new Date(entry.reminder).toISOString().substring(0, 16).replace('T', ' ') : ''}</td>
            </tr>
        `).join('');

        const htmlString = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Exportação Diário IA</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #111827; color: #f3f4f6; padding: 20px; }
                    h1 { color: #60a5fa; }
                    p { color: #d1d5db; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
                    th, td { border: 1px solid #374151; padding: 12px; text-align: left; }
                    th { background-color: #1f2937; font-weight: 600; }
                    td { background-color: #374151; }
                    td[contenteditable="true"]:focus { background-color: #4b5563; outline: 2px solid #60a5fa; }
                    button {
                        background-color: #3b82f6;
                        color: white;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 500;
                        margin-top: 20px;
                        transition: background-color 0.2s;
                    }
                    button:hover { background-color: #2563eb; }
                </style>
            </head>
            <body>
                <h1>Exportação de Entradas - Diário IA</h1>
                <p>Clique nas células para editar o conteúdo. O campo 'ID' não é editável. Use o botão abaixo para salvar suas alterações.</p>
                <button onclick="saveChanges()">Salvar Alterações como Novo Arquivo</button>
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
                <script>
                    function saveChanges() {
                        if (document.activeElement) document.activeElement.blur();
                        const htmlContent = document.documentElement.outerHTML;
                        const blob = new Blob([htmlContent], { type: 'text/html' });
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = 'diario_ia_export_editado.html';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(a.href);
                        alert('Seu arquivo editado foi salvo!');
                    }
                </script>
            </body>
            </html>
        `;

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
                    {filteredEntries.map(entry => <EntryCard key={entry.id} entry={entry} onUpdate={updateEntry} onDelete={deleteEntry} />)}
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