import React, { useState } from 'react';
import { Entry, EntryType } from '../types';
import { NoteIcon, ReceiptIcon, EventIcon, PromoteIcon, BellIcon, TrashIcon } from './icons';

interface EntryCardProps {
    entry: Entry;
    onUpdate: (entry: Entry) => void;
    onDelete: (entryId: string) => void;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry, onUpdate, onDelete }) => {
    const { type, description, date, amount, vendor, category, reminder, items } = entry;
    const [isEditingReminder, setIsEditingReminder] = useState(false);
    const [reminderDate, setReminderDate] = useState(reminder || '');

    const getIcon = () => {
        switch (type) {
            case EntryType.NOTE:
                return <NoteIcon />;
            case EntryType.EXPENSE:
                return <ReceiptIcon />;
            case EntryType.EVENT:
                return <EventIcon />;
            default:
                return <NoteIcon />;
        }
    };
    
    const promoteToEvent = () => {
        onUpdate({ ...entry, type: EntryType.EVENT });
    };

    const handleSaveReminder = () => {
        onUpdate({ ...entry, reminder: reminderDate });
        setIsEditingReminder(false);
    };

    const handleClearReminder = () => {
        onUpdate({ ...entry, reminder: undefined });
        setReminderDate('');
        setIsEditingReminder(false);
    };

    const handleDelete = () => {
        if (window.confirm('Tem certeza que deseja excluir esta entrada?')) {
            onDelete(entry.id);
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-4 mx-4 border border-gray-700">
            <div className="flex items-start">
                <div className="w-8 h-8 mr-4 mt-1 text-blue-400 flex-shrink-0">{getIcon()}</div>
                <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                         <div>
                            <p className="text-sm text-gray-400">
                                {new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>
                            {reminder && !isEditingReminder && (
                                <div className="flex items-center text-xs text-amber-400 mt-1">
                                    <BellIcon />
                                    <span className="ml-1">{new Date(reminder).toLocaleString('pt-BR')}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                             <button onClick={() => setIsEditingReminder(!isEditingReminder)} className="p-1 text-gray-400 hover:text-amber-300 transition-colors">
                                <BellIcon />
                            </button>
                            {type !== EntryType.EVENT && (
                                 <button onClick={promoteToEvent} className="flex items-center text-xs text-blue-400 hover:text-blue-300 transition-colors p-1 rounded-md bg-gray-700 hover:bg-gray-600">
                                    <PromoteIcon />
                                    <span className="ml-1">Para Evento</span>
                                </button>
                            )}
                            <button onClick={handleDelete} className="p-1 text-gray-400 hover:text-red-400 transition-colors">
                                <TrashIcon />
                            </button>
                        </div>
                    </div>

                    {isEditingReminder && (
                        <div className="my-2 p-2 bg-gray-700/50 rounded-md">
                            <label className="text-xs text-gray-300 block mb-1">Definir Lembrete</label>
                            <input
                                type="datetime-local"
                                value={reminderDate.substring(0, 16)} // Format for input
                                onChange={(e) => setReminderDate(e.target.value)}
                                className="bg-gray-800 border border-gray-600 rounded-md p-1 text-sm w-full mb-2"
                            />
                            <div className="flex space-x-2">
                                <button onClick={handleSaveReminder} className="text-xs bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded">Salvar</button>
                                {reminder && <button onClick={handleClearReminder} className="text-xs bg-red-500 hover:bg-red-600 px-2 py-1 rounded">Limpar</button>}
                                <button onClick={() => setIsEditingReminder(false)} className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded">Cancelar</button>
                            </div>
                        </div>
                    )}

                    <p className="text-gray-100 mb-2">{description}</p>
                    {type === EntryType.EXPENSE && (
                        <div className="text-sm text-gray-300 mt-2 p-3 bg-gray-700/50 rounded-md">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-lg text-green-400">
                                    R$ {amount?.toFixed(2).replace('.', ',') ?? '0,00'}
                                </span>
                                {vendor && <span className="font-medium">{vendor}</span>}
                            </div>
                            {category && <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded-full mt-2 inline-block">{category}</span>}
                            {items && items.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-600">
                                    <h4 className="text-xs font-semibold text-gray-400 mb-2">Itens do Recibo:</h4>
                                    <ul className="space-y-1 text-xs">
                                        {items.map((item, index) => (
                                            <li key={index} className="flex justify-between">
                                                <span>{item.name}</span>
                                                <span>R$ {item.price.toFixed(2).replace('.', ',')}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EntryCard;