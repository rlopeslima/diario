import { supabase } from '../src/integrations/supabase/client';
import { Entry } from '../types';

export const saveEntryToDatabase = async (entry: Omit<Entry, 'id'> & { user_id: string }): Promise<Entry> => {
  const { data, error } = await supabase
    .from('entries')
    .insert({
      user_id: entry.user_id,
      type: entry.type,
      description: entry.description,
      date: entry.date.toISOString().split('T')[0],
      amount: entry.amount,
      vendor: entry.vendor,
      category: entry.category,
      reminder: entry.reminder,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving entry to database:', error);
    throw new Error('Falha ao salvar entrada no banco de dados');
  }

  return {
    ...data,
    date: new Date(data.date),
    reminder: data.reminder ? new Date(data.reminder) : undefined,
  };
};

export const getEntriesFromDatabase = async (userId: string): Promise<Entry[]> => {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching entries from database:', error);
    throw new Error('Falha ao buscar entradas do banco de dados');
  }

  return data.map(entry => ({
    ...entry,
    date: new Date(entry.date),
    reminder: entry.reminder ? new Date(entry.reminder) : undefined,
  }));
};

export const updateEntryInDatabase = async (entry: Entry & { user_id: string }): Promise<Entry> => {
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
    console.error('Error updating entry in database:', error);
    throw new Error('Falha ao atualizar entrada no banco de dados');
  }

  return {
    ...data,
    date: new Date(data.date),
    reminder: data.reminder ? new Date(data.reminder) : undefined,
  };
};

export const deleteEntryFromDatabase = async (entryId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting entry from database:', error);
    throw new Error('Falha ao deletar entrada no banco de dados');
  }
};