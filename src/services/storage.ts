import { FlatUnit, SocietyConfig, INITIAL_FLATS, INITIAL_SOCIETY_CONFIG, BILLING_MONTHS } from '../data/mockData';
import { SocietyExpense, INITIAL_EXPENSES } from '../data/expenseData';
import savedData from '../data/savedData.json';

const defaultFlats: FlatUnit[] = (savedData && savedData.flats && (savedData.flats as any[]).length > 0)
  ? (savedData.flats as unknown as FlatUnit[])
  : INITIAL_FLATS;

const defaultExpenses: SocietyExpense[] = (savedData && savedData.expenses && (savedData.expenses as any[]).length > 0)
  ? (savedData.expenses as unknown as SocietyExpense[])
  : INITIAL_EXPENSES;

const FLATS_STORAGE_KEY = 'times_square_flats_v3';
const CONFIG_STORAGE_KEY = 'times_square_config_v2';
const EXPENSES_STORAGE_KEY = 'times_square_expenses_v2';
const ADMIN_AUTH_KEY = 'times_square_admin_session_v1';
const ADMIN_PIN_KEY = 'times_square_admin_pin_v2';

export const DEFAULT_ADMIN_PIN = '5923';

export const StorageService = {
  getFlats(): FlatUnit[] {
    try {
      // Clear out legacy key if present
      localStorage.removeItem('times_square_flats_v2');

      let data = localStorage.getItem(FLATS_STORAGE_KEY);
      if (!data) {
        this.saveFlats(defaultFlats);
        return defaultFlats;
      }
      const parsed: FlatUnit[] = JSON.parse(data);

      // If cached data is the old 15 dummy flats (e.g. Amitabh Roy), auto-replace with all 70 real flats
      const isOldDummy = parsed.length <= 15 && parsed.some(f => f.residentName === 'Amitabh Roy' || f.residentName === 'Vikram Malhotra');
      if (isOldDummy) {
        this.saveFlats(defaultFlats);
        return defaultFlats;
      }
      let changed = false;
      const migrated = parsed.map((f) => {
        let updated = { ...f };
        if (updated.wing === 'B' || (updated.flatNo && updated.flatNo.startsWith('B-'))) {
          changed = true;
          updated.wing = 'C';
          updated.flatNo = updated.flatNo.startsWith('B-') ? updated.flatNo.replace('B-', 'C-') : updated.flatNo;
          updated.id = updated.id.replace('flat-b-', 'flat-c-');
        }

        // Ensure billing months match BILLING_MONTHS (May 2026 to Oct 2026)
        const needsMonthSync = !updated.monthlyDues ||
          updated.monthlyDues.length !== BILLING_MONTHS.length ||
          updated.monthlyDues.some(d => !BILLING_MONTHS.includes(d.month));

        if (needsMonthSync) {
          changed = true;
          const initial = INITIAL_FLATS.find(item => item.flatNo === updated.flatNo);
          const existingMap = new Map((updated.monthlyDues || []).map(d => [d.month, d]));

          updated.monthlyDues = BILLING_MONTHS.map((m, idx) => {
            if (existingMap.has(m)) {
              return existingMap.get(m)!;
            }
            const initDue = initial?.monthlyDues?.find(d => d.month === m);
            if (initDue) return initDue;
            return {
              month: m,
              isPaid: updated.status === 'Paid' || (updated.status === 'Pending' && idx < BILLING_MONTHS.length - 1) || (updated.status === 'Defaulter' && idx < BILLING_MONTHS.length - (updated.overdueMonths || 3)),
              amount: updated.monthlyMaintenance || 5500,
            };
          });

          // Recalculate unpaid months and accumulated arrears for May-Oct cycle if not custom overridden
          if (!updated.isCustomOverride && updated.status !== 'Empty' && !updated.isExemptFromDefaulter) {
            const unpaid = updated.monthlyDues.filter(d => !d.isPaid && !d.isExempt);
            updated.accumulatedArrears = unpaid.reduce((sum, d) => sum + (d.amount || updated.monthlyMaintenance || 5500), 0);
            updated.overdueMonths = unpaid.length;
            if (unpaid.length === 0) {
              updated.status = 'Paid';
            } else if (unpaid.length >= 2) {
              updated.status = 'Defaulter';
            } else {
              updated.status = 'Pending';
            }
          }
        }

        // Clean up legacy late fee properties if present
        if ('lateFeeApplied' in updated || 'lateFeeAmount' in updated) {
          changed = true;
          delete (updated as any).lateFeeApplied;
          delete (updated as any).lateFeeAmount;
        }

        return updated;
      });

      if (changed) {
        this.saveFlats(migrated);
      }
      return migrated;
    } catch (e) {
      console.error('Failed to read flats from storage', e);
      return INITIAL_FLATS;
    }
  },

  saveFlats(flats: FlatUnit[]): void {
    try {
      localStorage.setItem(FLATS_STORAGE_KEY, JSON.stringify(flats));
    } catch (e) {
      console.error('Failed to write flats to storage', e);
    }
  },

  getConfig(): SocietyConfig {
    try {
      const data = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (!data) {
        this.saveConfig(INITIAL_SOCIETY_CONFIG);
        return INITIAL_SOCIETY_CONFIG;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to read config from storage', e);
      return INITIAL_SOCIETY_CONFIG;
    }
  },

  saveConfig(config: SocietyConfig): void {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to write config to storage', e);
    }
  },

  getExpenses(): SocietyExpense[] {
    try {
      localStorage.removeItem('times_square_expenses_v1');
      const data = localStorage.getItem(EXPENSES_STORAGE_KEY);
      if (!data) {
        this.saveExpenses(defaultExpenses);
        return defaultExpenses;
      }
      const parsed: SocietyExpense[] = JSON.parse(data);
      // If cached data contains dummy sample expenses, purge and return empty array
      if (parsed.some(e => e.id === 'exp-1' || e.vendorName?.includes('Apex Security'))) {
        this.saveExpenses([]);
        return [];
      }
      return parsed;
    } catch (e) {
      console.error('Failed to read expenses from storage', e);
      return defaultExpenses;
    }
  },

  saveExpenses(expenses: SocietyExpense[]): void {
    try {
      localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
    } catch (e) {
      console.error('Failed to write expenses to storage', e);
    }
  },

  resetAll(): { flats: FlatUnit[]; config: SocietyConfig; expenses: SocietyExpense[] } {
    localStorage.removeItem(FLATS_STORAGE_KEY);
    localStorage.removeItem(CONFIG_STORAGE_KEY);
    localStorage.removeItem(EXPENSES_STORAGE_KEY);
    this.saveFlats(defaultFlats);
    this.saveConfig(INITIAL_SOCIETY_CONFIG);
    this.saveExpenses(defaultExpenses);
    return { flats: defaultFlats, config: INITIAL_SOCIETY_CONFIG, expenses: defaultExpenses };
  },

  exportData(): string {
    const data = {
      flats: this.getFlats(),
      expenses: this.getExpenses(),
      config: this.getConfig(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  },

  importData(jsonString: string): { success: boolean; flats?: FlatUnit[]; expenses?: SocietyExpense[]; config?: SocietyConfig; message?: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data.flats || !Array.isArray(data.flats)) {
        return { success: false, message: 'Invalid backup file: missing flats list' };
      }
      this.saveFlats(data.flats);
      if (data.expenses && Array.isArray(data.expenses)) {
        this.saveExpenses(data.expenses);
      }
      if (data.config) {
        this.saveConfig(data.config);
      }
      return {
        success: true,
        flats: data.flats,
        expenses: data.expenses || this.getExpenses(),
        config: data.config || this.getConfig(),
      };
    } catch (e: any) {
      console.error('Import failed', e);
      return { success: false, message: e?.message || 'Invalid JSON backup file' };
    }
  },

  getAdminPin(): string {
    const saved = localStorage.getItem(ADMIN_PIN_KEY);
    if (!saved || saved === '1234') {
      return DEFAULT_ADMIN_PIN;
    }
    return saved;
  },

  setAdminPin(newPin: string): void {
    localStorage.setItem(ADMIN_PIN_KEY, newPin);
  },

  isAdminAuthenticated(): boolean {
    return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
  },

  setAdminAuthenticated(auth: boolean): void {
    if (auth) {
      localStorage.setItem(ADMIN_AUTH_KEY, 'true');
    } else {
      localStorage.removeItem(ADMIN_AUTH_KEY);
    }
  },
};
