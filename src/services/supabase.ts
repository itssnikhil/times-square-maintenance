import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { FlatUnit } from '../data/mockData';
import { SocietyExpense } from '../data/expenseData';

export const SUPABASE_URL = 'https://dfpnjnscwmmdaagekols.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_o_93OzmIA0BPiF4jGHm1nA_ecPESiX8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const RECORD_ID = 'times_square';

// Generate a unique client identifier for this tab/device session
export const CLIENT_ID = 'device_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();

let activeChannel: RealtimeChannel | null = null;

export const SupabaseService = {
  // Fetch from Supabase, or initialize if table row doesn't exist
  async getSocietyData(
    initialFlats: FlatUnit[],
    initialExpenses: SocietyExpense[]
  ): Promise<{ flats: FlatUnit[]; expenses: SocietyExpense[] } | null> {
    try {
      const { data, error } = await supabase
        .from('society_data')
        .select('*')
        .eq('id', RECORD_ID)
        .maybeSingle();

      if (error) {
        console.warn('[Supabase] Notice:', error.message);
        return null;
      }

      if (data && data.flats && Array.isArray(data.flats) && data.flats.length > 0) {
        return {
          flats: data.flats as FlatUnit[],
          expenses: (data.expenses as SocietyExpense[]) || [],
        };
      }

      // If record does not exist in the database yet, initialize it
      console.log('[Supabase] Initializing society record in cloud database...');
      await this.saveSocietyData(initialFlats, initialExpenses);
      return {
        flats: initialFlats,
        expenses: initialExpenses,
      };
    } catch (err) {
      console.error('[Supabase] Fetch error:', err);
      return null;
    }
  },

  // Save flats and expenses to Supabase with device tracking to avoid echo
  async saveSocietyData(flats: FlatUnit[], expenses: SocietyExpense[]): Promise<boolean> {
    try {
      const payload = {
        id: RECORD_ID,
        flats,
        expenses,
        config: { updated_by: CLIENT_ID, timestamp: Date.now() },
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('society_data')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        console.error('[Supabase] Upsert error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase] Save error:', err);
      return false;
    }
  },

  // Realtime subscription for instant cross-device updates without echo loops
  subscribe(onUpdate: (data: { flats: FlatUnit[]; expenses: SocietyExpense[] }) => void) {
    if (activeChannel) {
      activeChannel.unsubscribe();
    }

    try {
      activeChannel = supabase
        .channel('society_data_live')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'society_data', filter: `id=eq.${RECORD_ID}` },
          (payload) => {
            const newRecord = payload.new as any;
            // PREVENT ECHO: If this device itself sent this change, ignore the broadcast!
            if (newRecord?.config?.updated_by === CLIENT_ID) {
              return;
            }

            if (newRecord && newRecord.flats && Array.isArray(newRecord.flats)) {
              onUpdate({
                flats: newRecord.flats,
                expenses: newRecord.expenses || [],
              });
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('[Supabase] Realtime subscribe error:', err);
    }
  },

  unsubscribe() {
    if (activeChannel) {
      activeChannel.unsubscribe();
      activeChannel = null;
    }
  },
};
