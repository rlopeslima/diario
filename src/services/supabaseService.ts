import { supabase } from '../integrations/supabase/client';
import { Entry, EntryType } from '../types';

// Mapeia os dados do Supabase para o tipo Entry do frontend
const mapSupabaseToEntry = (item: any): Entry => ({
  ...item,
  date: new Date(item.date),
  type: item.type as EntryType,
  reminder: item.reminder ? new Date(item.reminder).toISOString() : undefined,
});

export const getEntriesFromDatabase = async (userId: string): Promise<Entry[]> => {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching entries:', error);
    throw new Error('Falha ao buscar entradas do banco de dados');
  }

  return data.map(mapSupabaseToEntry);
};

export const addEntryToDatabase = async (entry: Omit<Entry, 'id'>): Promise<Entry> => {
  const { data, error } = await supabase
    .from('entries')
    .insert({
      ...entry,
      date: entry.date.toISOString().split('T')[0], // Formato YYYY-MM-DD
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding entry:', error);
    throw new Error('Falha ao adicionar nova entrada');
  }

  return mapSupabaseToEntry(data);
};

export const updateEntryInDatabase = async (entry: Entry): Promise<Entry> => {
  const { data, error } = await supabase
    .from('entries')
    .update({
      type: entry.type,
      description: entry.description,
      date: entry.date.toISOString().split('T')[0],
      amount: entry.amount,
      vendor: entry.vendor,
      category: entry.category,
      reminder: entry.reminder,
    })
    .eq('id', entry.id)
    .eq('user_id', entry.user_id)
    .select()
    .single();

  if (error) {
    console.error('Error updating entry:', error);
    throw new Error('Falha ao atualizar entrada');
  }

  return mapSupabaseToEntry(data);
};

export const deleteEntryFromDatabase = async (entryId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting entry:', error);
    throw new Error('Falha ao deletar entrada');
  }
};