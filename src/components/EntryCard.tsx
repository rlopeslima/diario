import React, { useState } from 'react';
import { Entry, EntryType } from '../types';
import { NoteIcon, ReceiptIcon, EventIcon, PromoteIcon, BellIcon, TrashIcon } from './icons';

interface EntryCardProps {
    entry: Entry;
    onUpdate: (entry: Entry) => void;
    onDelete: (entryId: string) => void;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry, onUpdate, onDelete }) => {
    const [isEditingReminder, setIsEditingReminder] = useState(false);
    const [reminderDate, setReminderDate] = useState(entry.reminder || new Date().toISOString());

    const getIcon = () => {
        switch (entry.type) {
            case EntryType.NOTE: return <NoteIcon />;
            case EntryType.EXPENSE: return <ReceiptIcon />;
            case EntryType.EVENT: return <EventIcon />;
            default: return <NoteIcon />;
        }
    };

    const handleSaveReminder = () => {
        onUpdate({ ...entry, reminder: new Date(reminderDate).toISOString() });
        setIsEditingReminder(false);
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-4 border border-gray-700">
            <div className="flex items-start">
                <div className="w-8 h-8 mr-4 mt-1 text-blue-400 flex-shrink-0">{getIcon()}</div>
                <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-sm text-gray-400">{new Date(entry.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                            {entry.reminder && !isEditingReminder && (
                                <div className="flex items-center text-xs text-amber-400 mt-1">
                                    <BellIcon /><span className="ml-1">{new Date(entry.reminder).toLocaleString('pt-BR')}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => setIsEditingReminder(p => !p)} className="p-1 text-gray-400 hover:text-amber-300"><BellIcon /></button>
                            {entry.type !== EntryType.EVENT && (
                                <button onClick={() => onUpdate({ ...entry, type: EntryType.EVENT })} className="p-1 text-gray-400 hover:text-blue-300"><PromoteIcon /></button>
                            )}
                            <button onClick={() => onDelete(entry.id)} className="p-1 text-gray-400 hover:text-red-400"><TrashIcon /></button>
                        </div>
                    </div>

                    {isEditingReminder && (
                        <div className="my-2 p-2 bg-gray-700/50 rounded-md">
                            <input type="datetime-local" value={reminderDate.substring(0, 16)} onChange={(e) => setReminderDate(e.target.value)} className="bg-gray-800 border border-gray-600 rounded-md p-1 text-sm w-full mb-2" />
                            <div className="flex space-x-2">
                                <button onClick={handleSaveReminder} className="text-xs bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded">Salvar</button>
                                {entry.reminder && <button onClick={() => { onUpdate({ ...entry, reminder: undefined }); setIsEditingReminder(false); }} className="text-xs bg-red-500 hover:bg-red-600 px-2 py-1 rounded">Limpar</button>}
                            </div>
                        </div>
                    )}

                    <p className="text-gray-100 mb-2">{entry.description}</p>
                    {entry.type === EntryType.EXPENSE && (
                        <div className="text-sm text-gray-300 mt-2 p-3 bg-gray-700/50 rounded-md">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-lg text-green-400">R$ {entry.amount?.toFixed(2).replace('.', ',')}</span>
                                {entry.vendor && <span className="font-medium">{entry.vendor}</span>}
                            </div>
                            {entry.category && <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded-full mt-2 inline-block">{entry.category}</span>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EntryCard;