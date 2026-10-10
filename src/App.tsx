import React, { useState, useMemo, useEffect } from 'react';
import { FlatUnit, INITIAL_FLATS, BILLING_MONTHS } from './data/mockData';
import { SocietyExpense, INITIAL_EXPENSES } from './data/expenseData';
import { StorageService } from './services/storage';
import { SimpleEditModal } from './components/SimpleEditModal';
import { AddFlatModal } from './components/AddFlatModal';
import { ExpenseModal } from './components/ExpenseModal';
import { PinLockModal } from './components/PinLockModal';
import { ManageDuesModal } from './components/ManageDuesModal';
import { exportFlatsToExcel } from './utils/excelExport';
import { exportPendingAndDefaultersToWord } from './utils/wordExport';
import { 
  Building2, 
  FileSpreadsheet, 
  FileText,
  Edit3, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  RotateCcw,
  Plus,
  Check,
  Layers,
  Lock,
  ShieldCheck,
  Calendar,
  Receipt,
  Users,
  Shield,
  Zap,
  Wrench,
  Droplet,
  ArrowLeft,
  Home,
  Download,
  Upload
} from 'lucide-react';

export function App() {
  const [flats, setFlats] = useState<FlatUnit[]>(() => StorageService.getFlats());
  const [expenses, setExpenses] = useState<SocietyExpense[]>(() => StorageService.getExpenses());
  
  // Primary Page Navigation: 'maintenance' OR 'expenses'
  const [currentPage, setCurrentPage] = useState<'maintenance' | 'expenses'>('maintenance');
  
  // Maintenance Page Filters
  const [activeTab, setActiveTab] = useState<'ALL' | 'PAID' | 'PENDING' | 'DEFAULTER' | 'EMPTY'>('ALL');
  const [selectedWing, setSelectedWing] = useState<'ALL' | 'A' | 'C'>('ALL');
  const [selectedBillingMonth, setSelectedBillingMonth] = useState<string>('Oct 2026');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Expenses Page Filters
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('ALL');
  const [expenseStatusFilter, setExpenseStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');

  // Modals & Secretary Auth State
  const [editingFlat, setEditingFlat] = useState<FlatUnit | null>(null);
  const [editingExpense, setEditingExpense] = useState<SocietyExpense | null>(null);
  const [isAddFlatModalOpen, setIsAddFlatModalOpen] = useState(false);
  const [isManageDuesModalOpen, setIsManageDuesModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => StorageService.isAdminAuthenticated());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleAdminUnlock = () => {
    setIsAdmin(true);
    StorageService.setAdminAuthenticated(true);
    showToast('Secretary Mode Unlocked (Edit access enabled)');
  };

  const handleAdminLock = () => {
    setIsAdmin(false);
    StorageService.setAdminAuthenticated(false);
    showToast('Switched to Resident View-Only Mode');
  };

  // Helper for Indian Currency formatting
  const formatINR = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt);
  };

  // Auto-sync data to local server disk (so it can be permanently deployed to GitHub/Vercel)
  useEffect(() => {
    try {
      if (flats && flats.length > 0) {
        fetch('/api/sync-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flats, expenses, timestamp: new Date().toISOString() }),
        }).catch(() => {});
      }
    } catch (e) {}
  }, [flats, expenses]);

  // -------------------------------------------------------------
  // FLAT MAINTENANCE ACTIONS
  // -------------------------------------------------------------
  const handleRequestEditFlat = (flat: FlatUnit) => {
    if (!isAdmin) {
      showToast('Enter Secretary PIN to edit flat dues');
      setIsPinModalOpen(true);
      return;
    }
    setEditingFlat(flat);
  };

  const handleRequestManageDues = () => {
    if (!isAdmin) {
      showToast('Enter Secretary PIN to edit pending & defaulter list');
      setIsPinModalOpen(true);
      return;
    }
    setIsManageDuesModalOpen(true);
  };

  const handleSaveAllDues = (updatedFlats: FlatUnit[]) => {
    setFlats(updatedFlats);
    StorageService.saveFlats(updatedFlats);
    showToast('Updated Pending & Defaulter list and amounts successfully');
  };

  const handleRequestAddFlat = () => {
    if (!isAdmin) {
      showToast('Enter Secretary PIN to add new flats');
      setIsPinModalOpen(true);
      return;
    }
    setIsAddFlatModalOpen(true);
  };

  const handleSaveFlat = (updated: FlatUnit) => {
    const nextFlats = flats.map((f) => (f.id === updated.id ? updated : f));
    setFlats(nextFlats);
    StorageService.saveFlats(nextFlats);
    showToast(`Updated Flat ${updated.flatNo} (${updated.status})`);
  };

  const handleAddFlat = (newFlat: FlatUnit) => {
    const nextFlats = [...flats, newFlat];
    setFlats(nextFlats);
    StorageService.saveFlats(nextFlats);
    showToast(`Added Flat ${newFlat.flatNo} to Wing ${newFlat.wing}`);
  };

  const handleDeleteFlat = (flatId: string) => {
    const nextFlats = flats.filter((f) => f.id !== flatId);
    setFlats(nextFlats);
    StorageService.saveFlats(nextFlats);
    showToast('Flat removed from records');
  };

  // -------------------------------------------------------------
  // SOCIETY EXPENSES ACTIONS
  // -------------------------------------------------------------
  const handleRequestAddExpense = () => {
    if (!isAdmin) {
      showToast('Enter Secretary PIN to add society expenses');
      setIsPinModalOpen(true);
      return;
    }
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  const handleRequestEditExpense = (expense: SocietyExpense) => {
    if (!isAdmin) {
      showToast('Enter Secretary PIN to edit expenses');
      setIsPinModalOpen(true);
      return;
    }
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = (savedExpense: SocietyExpense) => {
    let nextExpenses: SocietyExpense[];
    const exists = expenses.some((e) => e.id === savedExpense.id);
    if (exists) {
      nextExpenses = expenses.map((e) => (e.id === savedExpense.id ? savedExpense : e));
    } else {
      nextExpenses = [savedExpense, ...expenses];
    }
    setExpenses(nextExpenses);
    StorageService.saveExpenses(nextExpenses);
    showToast(`Saved expense: ${savedExpense.title} (${savedExpense.status})`);
  };

  const handleDeleteExpense = (id: string) => {
    const nextExpenses = expenses.filter((e) => e.id !== id);
    setExpenses(nextExpenses);
    StorageService.saveExpenses(nextExpenses);
    showToast('Expense record removed');
  };

  const handleToggleExpenseStatus = (expense: SocietyExpense) => {
    if (!isAdmin) {
      showToast('Enter Secretary PIN to update expense payment status');
      setIsPinModalOpen(true);
      return;
    }
    const nextStatus: 'Paid' | 'Pending' = expense.status === 'Paid' ? 'Pending' : 'Paid';
    const updated: SocietyExpense = {
      ...expense,
      status: nextStatus,
      paidDate: nextStatus === 'Paid' ? 'Today' : undefined,
      paymentMode: nextStatus === 'Paid' ? (expense.paymentMode || 'Bank Transfer') : undefined,
    };
    handleSaveExpense(updated);
  };

  // -------------------------------------------------------------
  // RESET DATA & EXCEL EXPORT
  // -------------------------------------------------------------
  const handleResetData = () => {
    if (!isAdmin) {
      showToast('Enter Secretary PIN to reset data');
      setIsPinModalOpen(true);
      return;
    }
    if (window.confirm('Reset all records to official 70 society flats & expenses?')) {
      const reset = StorageService.resetAll();
      setFlats(reset.flats);
      setExpenses(reset.expenses);
      showToast('Reset to official 70 society flats');
    }
  };

  const handleBackupData = () => {
    try {
      const json = StorageService.exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `times_square_society_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Downloaded Society Data Backup (.json)');
    } catch (e) {
      alert('Failed to export backup.');
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const result = StorageService.importData(content);
      if (result.success) {
        if (result.flats) setFlats(result.flats);
        if (result.expenses) setExpenses(result.expenses);
        showToast('Society data successfully restored!');
      } else {
        alert(result.message || 'Failed to restore data.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportExcel = () => {
    exportFlatsToExcel(flats, expenses, selectedBillingMonth);
    showToast('Downloaded Society Excel Spreadsheet (.xlsx)');
  };

  const handleExportWord = () => {
    exportPendingAndDefaultersToWord(flats, selectedBillingMonth);
    showToast('Downloaded Word Notice (.doc) with Pending & Defaulters');
  };

  // -------------------------------------------------------------
  // MAINTENANCE CALCULATIONS
  // -------------------------------------------------------------
  const isMonthEmptyOrExempt = (flat: FlatUnit, monthName: string): boolean => {
    if (flat.status === 'Empty') return true;
    if (flat.isExemptFromDefaulter) return true;
    const due = flat.monthlyDues?.find((m) => m.month === monthName);
    if (due?.isExempt) return true;
    if (flat.monthlyDues && flat.monthlyDues.length > 0 && flat.monthlyDues.every((m) => m.isExempt)) {
      return true;
    }
    return false;
  };

  const getUnpaidMonths = (flat: FlatUnit) => {
    if (flat.status === 'Empty' || flat.isExemptFromDefaulter) {
      return [];
    }
    if (flat.monthlyDues && flat.monthlyDues.length > 0) {
      return flat.monthlyDues.filter((m) => !m.isPaid && !m.isExempt);
    }
    return [];
  };

  const wingAAll = useMemo(() => flats.filter((f) => f.wing === 'A'), [flats]);
  const wingCAll = useMemo(() => flats.filter((f) => f.wing === 'C'), [flats]);

  const getFlatStatusForMonth = (flat: FlatUnit, monthName: string): 'Paid' | 'Pending' | 'Defaulter' | 'Empty' => {
    // 1. When flat was empty in this month or overall, it is strictly classified as 'Empty'
    if (isMonthEmptyOrExempt(flat, monthName)) {
      return 'Empty';
    }

    // 2. Check the payment record specifically for the requested month
    const dueForMonth = flat.monthlyDues?.find((m) => m.month === monthName);

    if (dueForMonth) {
      if (dueForMonth.isExempt) {
        return 'Empty';
      }
      if (dueForMonth.isPaid) {
        // Resident paid for this specific month! (e.g. Rakhi paid October)
        return 'Paid';
      }
      // If NOT paid in this specific month:
      const totalUnpaid = getUnpaidMonths(flat).length;
      if (totalUnpaid >= 2 || flat.status === 'Defaulter') {
        return 'Defaulter';
      }
      return 'Pending';
    }

    // Fallback if no specific month record exists:
    if (flat.manualStatusOverride && flat.status !== 'Empty') {
      return flat.status;
    }

    const unpaidList = getUnpaidMonths(flat);
    if (unpaidList.length === 0) return 'Paid';
    if (flat.status === 'Defaulter' || unpaidList.length >= 2) return 'Defaulter';
    return 'Pending';
  };

  const displayedFlats = useMemo(() => {
    return flats.filter((f) => {
      if (selectedWing !== 'ALL' && f.wing !== selectedWing) return false;
      return true;
    });
  }, [flats, selectedWing]);

  const paidFlats = displayedFlats.filter((f) => getFlatStatusForMonth(f, selectedBillingMonth) === 'Paid');
  const pendingFlats = displayedFlats.filter((f) => getFlatStatusForMonth(f, selectedBillingMonth) === 'Pending');
  const defaulterFlats = displayedFlats.filter((f) => getFlatStatusForMonth(f, selectedBillingMonth) === 'Defaulter');
  const emptyFlats = displayedFlats.filter((f) => getFlatStatusForMonth(f, selectedBillingMonth) === 'Empty');

  const totalCollected = paidFlats.reduce((sum, f) => sum + f.monthlyMaintenance, 0);
  const totalPending = pendingFlats.reduce((sum, f) => {
    if (f.customOverdueAmount !== undefined) return sum + f.customOverdueAmount;
    return sum + (f.accumulatedArrears > 0 ? f.accumulatedArrears : f.monthlyMaintenance);
  }, 0);
  const totalDefaulterArrears = defaulterFlats.reduce((sum, f) => {
    if (f.isExemptFromDefaulter) return sum;
    if (f.customOverdueAmount !== undefined) return sum + f.customOverdueAmount;
    return sum + f.accumulatedArrears;
  }, 0);

  const filterFlatList = (list: FlatUnit[]) => {
    return list.filter((flat) => {
      const curStatus = getFlatStatusForMonth(flat, selectedBillingMonth);
      if (activeTab === 'PAID' && curStatus !== 'Paid') return false;
      if (activeTab === 'PENDING' && curStatus !== 'Pending') return false;
      if (activeTab === 'DEFAULTER' && curStatus !== 'Defaulter') return false;
      if (activeTab === 'EMPTY' && curStatus !== 'Empty') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesFlat = flat.flatNo.toLowerCase().includes(q);
        const matchesName = flat.residentName.toLowerCase().includes(q);
        if (!matchesFlat && !matchesName) return false;
      }
      return true;
    }).sort((a, b) => {
      if (activeTab === 'ALL') {
        const aDef = getFlatStatusForMonth(a, selectedBillingMonth) === 'Defaulter';
        const bDef = getFlatStatusForMonth(b, selectedBillingMonth) === 'Defaulter';
        if (aDef && !bDef) return -1;
        if (!aDef && bDef) return 1;
      }
      return a.flatNo.localeCompare(b.flatNo);
    });
  };

  const wingAFiltered = useMemo(() => filterFlatList(wingAAll), [wingAAll, activeTab, searchQuery, selectedBillingMonth]);
  const wingCFiltered = useMemo(() => filterFlatList(wingCAll), [wingCAll, activeTab, searchQuery, selectedBillingMonth]);

  // -------------------------------------------------------------
  // EXPENSES CALCULATIONS
  // -------------------------------------------------------------
  const totalExpensesBudget = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const paidExpensesList = useMemo(() => expenses.filter((e) => e.status === 'Paid'), [expenses]);
  const pendingExpensesList = useMemo(() => expenses.filter((e) => e.status === 'Pending'), [expenses]);
  const totalPaidExpenses = useMemo(() => paidExpensesList.reduce((sum, e) => sum + e.amount, 0), [paidExpensesList]);
  const totalPendingExpenses = useMemo(() => pendingExpensesList.reduce((sum, e) => sum + e.amount, 0), [pendingExpensesList]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      if (expenseCategoryFilter !== 'ALL' && exp.category !== expenseCategoryFilter) return false;
      if (expenseStatusFilter === 'PAID' && exp.status !== 'Paid') return false;
      if (expenseStatusFilter === 'PENDING' && exp.status !== 'Pending') return false;

      if (expenseSearchQuery.trim()) {
        const q = expenseSearchQuery.toLowerCase().trim();
        const matchesTitle = exp.title.toLowerCase().includes(q);
        const matchesVendor = exp.vendorName.toLowerCase().includes(q);
        const matchesCategory = exp.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesVendor && !matchesCategory) return false;
      }
      return true;
    });
  }, [expenses, expenseCategoryFilter, expenseStatusFilter, expenseSearchQuery]);

  const renderCategoryIcon = (category: SocietyExpense['category']) => {
    switch (category) {
      case 'Staff Salary':
        return <Users className="w-3.5 h-3.5 text-blue-600" />;
      case 'Security':
        return <Shield className="w-3.5 h-3.5 text-slate-800" />;
      case 'Electricity':
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case 'Lift & AMC':
        return <Building2 className="w-3.5 h-3.5 text-purple-600" />;
      case 'Water':
        return <Droplet className="w-3.5 h-3.5 text-cyan-600" />;
      case 'Repairs & Misc':
      default:
        return <Wrench className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-16 selection:bg-yellow-400 selection:text-black">
      {/* Official Top Header - White, Black and Yellow Theme */}
      <header className="sticky top-0 z-40 bg-slate-950 text-white border-b-4 border-yellow-400 shadow-md">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          {/* Logo & Society Header */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-extrabold shadow-sm shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                  Times Square Society
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 uppercase">
                  {selectedBillingMonth}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                {currentPage === 'maintenance' ? 'Maintenance Portal · Wing A & Wing C' : 'Society Expenses & Worker Payments'}
              </p>
            </div>
          </div>

          {/* Top Actions: Expenses/Maintenance Switcher, Add, Excel, Secretary Lock */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Page Switcher Button: Click on Expenses to open different page */}
            {currentPage === 'maintenance' ? (
              <button
                type="button"
                onClick={() => setCurrentPage('expenses')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs sm:text-sm border border-yellow-500 shadow-sm transition active:scale-95 min-h-[42px]"
                title="Open Society Expenses & Bills page"
              >
                <Receipt className="w-4 h-4 text-slate-950" />
                <span>Expenses</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentPage('maintenance')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs sm:text-sm border border-yellow-500 shadow-sm transition active:scale-95 min-h-[42px]"
                title="Back to Flat Maintenance Collections"
              >
                <ArrowLeft className="w-4 h-4 text-slate-950" />
                <span>Maintenance</span>
              </button>
            )}

            {/* Secretary Lock / Unlock Badge */}
            <button
              type="button"
              onClick={() => setIsPinModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold border transition active:scale-95 min-h-[42px] ${
                isAdmin
                  ? 'bg-slate-900 border-yellow-400 text-yellow-400 shadow-sm font-black'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isAdmin ? "Secretary Mode Active (Tap to lock)" : "Resident View (Tap to unlock with Secretary PIN)"}
            >
              {isAdmin ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-yellow-400" />
                  <span className="hidden sm:inline">Secretary</span>
                  <span className="text-[10px] bg-yellow-400 text-slate-950 px-1 py-0.2 rounded font-black">ON</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span className="hidden sm:inline">Login</span>
                </>
              )}
            </button>

            {/* Export to Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm border border-slate-700 shadow-sm transition active:scale-95 min-h-[42px]"
              title="Download Excel spreadsheet (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            {/* Export to Word (Pending & Defaulters Notice) */}
            <button
              type="button"
              onClick={handleExportWord}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm border border-slate-700 shadow-sm transition active:scale-95 min-h-[42px]"
              title="Export list of Pending & Defaulter flats with given months to Microsoft Word (.doc)"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Word</span>
            </button>

            {/* Backup Data (Download JSON) */}
            {isAdmin && (
              <button
                type="button"
                onClick={handleBackupData}
                className="p-2 rounded-xl text-yellow-400 hover:text-white hover:bg-slate-900 transition min-h-[42px] min-w-[42px] flex items-center justify-center border border-slate-700"
                title="Backup / Download all Society Data as JSON"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            {/* Restore Data (Upload JSON) */}
            {isAdmin && (
              <label
                className="p-2 rounded-xl text-yellow-400 hover:text-white hover:bg-slate-900 transition min-h-[42px] min-w-[42px] flex items-center justify-center border border-slate-700 cursor-pointer"
                title="Restore / Upload Society Data from JSON backup"
              >
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
            )}

            {/* Reset Data */}
            {isAdmin && (
              <button
                type="button"
                onClick={handleResetData}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition min-h-[42px] min-w-[42px] flex items-center justify-center border border-slate-800"
                title="Reset Sample Data"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Primary Top Tab Navigation Bar */}
      <nav className="max-w-4xl mx-auto px-3 sm:px-4 pt-3">
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-2xl border border-slate-300 shadow-xs">
          <button
            type="button"
            onClick={() => setCurrentPage('maintenance')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition min-h-[44px] ${
              currentPage === 'maintenance'
                ? 'bg-slate-950 text-yellow-400 shadow-sm'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Flat Maintenance Dues</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              currentPage === 'maintenance' ? 'bg-yellow-400 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}>
              {flats.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage('expenses')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition min-h-[44px] ${
              currentPage === 'expenses'
                ? 'bg-slate-950 text-yellow-400 shadow-sm'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Society Expenses & Bills</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              currentPage === 'expenses' ? 'bg-yellow-400 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}>
              {expenses.length}
            </span>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-4">
        {/* =========================================================================
            PAGE 1: FLAT MAINTENANCE COLLECTIONS
           ========================================================================= */}
        {currentPage === 'maintenance' && (
          <div className="space-y-4">
            {/* 📅 MONTH SELECTOR BAR (May 2026 - Oct 2026) */}
            <div className="bg-white p-3 rounded-2xl border border-slate-300 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-yellow-600 shrink-0" />
                  <span className="text-xs font-black text-slate-950 uppercase">
                    Select Billing Month (May–Oct 2026):
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-900 bg-yellow-300 px-2 py-0.5 rounded-lg border border-yellow-500 font-mono">
                  {selectedBillingMonth}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-1.5">
                {BILLING_MONTHS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedBillingMonth(m)}
                    className={`py-2 px-1 text-[11px] font-black rounded-xl transition border text-center ${
                      selectedBillingMonth === m
                        ? 'bg-slate-950 text-yellow-300 border-slate-950 shadow-xs ring-2 ring-yellow-400/50'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{m.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4 SUMMARY METRIC CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {/* Paid */}
              <button
                type="button"
                onClick={() => setActiveTab('PAID')}
                className={`p-3 sm:p-3.5 rounded-2xl border text-left transition active:scale-98 bg-white shadow-xs ${
                  activeTab === 'PAID'
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm'
                    : 'border-slate-300 hover:border-emerald-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-emerald-700 uppercase">Paid</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-base sm:text-xl font-black text-slate-950 font-mono mt-1">
                  {formatINR(totalCollected)}
                </div>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  {paidFlats.length} Flats in {selectedBillingMonth}
                </span>
              </button>

              {/* Pending */}
              <button
                type="button"
                onClick={() => setActiveTab('PENDING')}
                className={`p-3 sm:p-3.5 rounded-2xl border text-left transition active:scale-98 bg-white shadow-xs ${
                  activeTab === 'PENDING'
                    ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-sm'
                    : 'border-slate-300 hover:border-amber-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-amber-700 uppercase">Pending</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-base sm:text-xl font-black text-slate-950 font-mono mt-1">
                  {formatINR(totalPending)}
                </div>
                <span className="text-[11px] text-amber-700 font-semibold">
                  {pendingFlats.length} Flats in {selectedBillingMonth}
                </span>
              </button>

              {/* Defaulters */}
              <button
                type="button"
                onClick={() => setActiveTab('DEFAULTER')}
                className={`p-3 sm:p-3.5 rounded-2xl border text-left transition active:scale-98 bg-white shadow-xs ${
                  activeTab === 'DEFAULTER'
                    ? 'border-rose-500 ring-2 ring-rose-500/30 shadow-sm'
                    : 'border-slate-300 hover:border-rose-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-rose-700 uppercase">Defaulters</span>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-base sm:text-xl font-black text-rose-700 font-mono mt-1">
                  {formatINR(totalDefaulterArrears)}
                </div>
                <span className="text-[11px] text-rose-700 font-semibold">
                  {defaulterFlats.length} Overdue Flats
                </span>
              </button>

              {/* Empty Flats */}
              <button
                type="button"
                onClick={() => setActiveTab('EMPTY')}
                className={`p-3 sm:p-3.5 rounded-2xl border text-left transition active:scale-98 bg-white shadow-xs ${
                  activeTab === 'EMPTY'
                    ? 'border-yellow-400 ring-2 ring-yellow-400/30 shadow-sm'
                    : 'border-slate-300 hover:border-yellow-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-700 uppercase">Empty Flats</span>
                  <Home className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="text-base sm:text-xl font-black text-slate-950 font-mono mt-1">
                  ₹0 Due
                </div>
                <span className="text-[11px] text-slate-600 font-semibold">
                  {emptyFlats.length} Vacant in {selectedBillingMonth}
                </span>
              </button>
            </div>

            {/* WING SELECTION BAR (Wing A & Wing C) */}
            <div className="bg-white p-1.5 rounded-2xl border border-slate-300 flex items-center justify-between gap-1 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold px-2 hidden sm:flex">
                <Layers className="w-4 h-4 text-yellow-600" />
                <span>Select Wing:</span>
              </div>

              <div className="grid grid-cols-3 gap-1 flex-1">
                <button
                  type="button"
                  onClick={() => setSelectedWing('ALL')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl transition min-h-[42px] flex items-center justify-center gap-1.5 ${
                    selectedWing === 'ALL'
                      ? 'bg-yellow-400 text-slate-950 shadow-xs font-black border border-yellow-500/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>Both Wings</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedWing === 'ALL' ? 'bg-slate-950 text-yellow-300' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {flats.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedWing('A')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl transition min-h-[42px] flex items-center justify-center gap-1.5 ${
                    selectedWing === 'A'
                      ? 'bg-yellow-400 text-slate-950 shadow-xs font-black border border-yellow-500/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>🏢 Wing A</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedWing === 'A' ? 'bg-slate-950 text-yellow-300' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {wingAAll.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedWing('C')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl transition min-h-[42px] flex items-center justify-center gap-1.5 ${
                    selectedWing === 'C'
                      ? 'bg-yellow-400 text-slate-950 shadow-xs font-black border border-yellow-500/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>🏢 Wing C</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedWing === 'C' ? 'bg-slate-950 text-yellow-300' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {wingCAll.length}
                  </span>
                </button>
              </div>
            </div>

            {/* 5 Tabs: All | Paid | Pending | Defaulters | Empty */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 p-1 bg-white rounded-2xl border border-slate-300 shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition min-h-[44px] flex items-center justify-center gap-1 ${
                  activeTab === 'ALL'
                    ? 'bg-slate-950 text-white shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>All Flats</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'ALL' ? 'bg-yellow-400 text-slate-950' : 'bg-slate-100 text-slate-600'
                }`}>
                  {displayedFlats.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('PAID')}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition min-h-[44px] flex items-center justify-center gap-1 ${
                  activeTab === 'PAID'
                    ? 'bg-emerald-600 text-white shadow-sm font-black'
                    : 'text-emerald-700 hover:text-emerald-900'
                }`}
              >
                <span>Paid</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'PAID' ? 'bg-emerald-800 text-white' : 'bg-emerald-50 text-emerald-800'
                }`}>
                  {paidFlats.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('PENDING')}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition min-h-[44px] flex items-center justify-center gap-1 ${
                  activeTab === 'PENDING'
                    ? 'bg-yellow-400 text-slate-950 shadow-sm font-black border border-yellow-500/50'
                    : 'text-amber-700 hover:text-amber-900'
                }`}
              >
                <span>Pending</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'PENDING' ? 'bg-slate-950 text-yellow-300' : 'bg-amber-50 text-amber-800'
                }`}>
                  {pendingFlats.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('DEFAULTER')}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition min-h-[44px] flex items-center justify-center gap-1 ${
                  activeTab === 'DEFAULTER'
                    ? 'bg-rose-600 text-white shadow-sm font-black'
                    : 'text-rose-700 hover:text-rose-900'
                }`}
              >
                <span>Defaulters</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'DEFAULTER' ? 'bg-rose-800 text-white' : 'bg-rose-50 text-rose-800'
                }`}>
                  {defaulterFlats.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('EMPTY')}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition min-h-[44px] flex items-center justify-center gap-1 ${
                  activeTab === 'EMPTY'
                    ? 'bg-slate-950 text-yellow-300 shadow-sm font-black'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                <span>Empty</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'EMPTY' ? 'bg-yellow-400 text-slate-950' : 'bg-slate-100 text-slate-800'
                }`}>
                  {emptyFlats.length}
                </span>
              </button>
            </div>

            {/* Search Bar + Add Flat Button */}
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search flat (e.g. A-101, C-201) or resident..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 shadow-xs min-h-[44px]"
                />
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleRequestManageDues}
                    className="px-3.5 py-2.5 bg-slate-950 hover:bg-slate-850 border border-yellow-400 text-yellow-300 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 shrink-0 min-h-[44px] shadow-sm transition active:scale-95"
                    title="Directly edit who is on the pending & defaulter list and adjust their amounts"
                  >
                    <Layers className="w-4 h-4 text-yellow-400" />
                    <span className="hidden sm:inline">Edit Pending & Defaulter List</span>
                    <span className="sm:hidden">Edit Dues</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRequestAddFlat}
                    className="px-3.5 py-2.5 bg-yellow-400 hover:bg-yellow-300 border border-yellow-500/60 text-slate-950 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 shrink-0 min-h-[44px] shadow-xs transition active:scale-95"
                    title="Add a new flat"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Flat</span>
                  </button>
                </div>
              )}
            </div>

            {/* SEGREGATED WING LISTS */}
            <div className="space-y-6">
              {/* Section: WING A */}
              {(selectedWing === 'ALL' || selectedWing === 'A') && (
                <section className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b-2 border-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-950 uppercase tracking-wide flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
                        <span>🏢 WING A</span>
                      </span>
                      <span className="text-xs px-2 py-0.2 rounded-full bg-slate-200 text-slate-800 font-mono font-bold">
                        {wingAFiltered.length} flats
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {wingAAll.filter(f => getFlatStatusForMonth(f, selectedBillingMonth) === 'Paid').length} Paid in {selectedBillingMonth}
                    </span>
                  </div>

                  {wingAFiltered.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">No Wing A units matching current filter.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {wingAFiltered.map((flat) => renderFlatCard(flat))}
                    </div>
                  )}
                </section>
              )}

              {/* Section: WING C */}
              {(selectedWing === 'ALL' || selectedWing === 'C') && (
                <section className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b-2 border-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-950 uppercase tracking-wide flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
                        <span>🏢 WING C</span>
                      </span>
                      <span className="text-xs px-2 py-0.2 rounded-full bg-slate-200 text-slate-800 font-mono font-bold">
                        {wingCFiltered.length} flats
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {wingCAll.filter(f => getFlatStatusForMonth(f, selectedBillingMonth) === 'Paid').length} Paid in {selectedBillingMonth}
                    </span>
                  </div>

                  {wingCFiltered.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">No Wing C units matching current filter.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {wingCFiltered.map((flat) => renderFlatCard(flat))}
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            PAGE 2: SOCIETY EXPENSES (Worker Salaries, Electricity, AMC)
           ========================================================================= */}
        {currentPage === 'expenses' && (
          <div className="space-y-4">
            {/* Header Box for Expenses Page */}
            <div className="p-4 bg-white rounded-2xl border border-slate-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-400" />
                  <h2 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-slate-900" />
                    <span>Society Expenses & Payments</span>
                  </h2>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Worker salaries, electricity bills, lift AMC, water tankers, and maintenance repairs.
                </p>
              </div>

              {/* Add Expense Button - Secretary only */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleRequestAddExpense}
                  className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 border border-yellow-500 shadow-sm transition active:scale-95 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Expense</span>
                </button>
              )}
            </div>

            {/* 3 EXPENSE KPI CARDS */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-300 shadow-xs">
                <span className="text-[11px] font-black uppercase text-slate-600 block">
                  Total Budget
                </span>
                <div className="text-base sm:text-xl font-black font-mono text-slate-950 mt-1">
                  {formatINR(totalExpensesBudget)}
                </div>
                <span className="text-[11px] text-slate-500 font-semibold">
                  {expenses.length} Total Bills
                </span>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-300 shadow-xs">
                <span className="text-[11px] font-black uppercase text-emerald-700 block">
                  Paid Bills
                </span>
                <div className="text-base sm:text-xl font-black font-mono text-emerald-700 mt-1">
                  {formatINR(totalPaidExpenses)}
                </div>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  {paidExpensesList.length} Cleared
                </span>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-300 shadow-xs">
                <span className="text-[11px] font-black uppercase text-rose-700 block">
                  Pending Bills
                </span>
                <div className="text-base sm:text-xl font-black font-mono text-rose-700 mt-1">
                  {formatINR(totalPendingExpenses)}
                </div>
                <span className="text-[11px] text-rose-700 font-semibold">
                  {pendingExpensesList.length} Awaiting Payment
                </span>
              </div>
            </div>

            {/* Expense Filter Tabs: All Bills | Paid | Pending */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-white rounded-2xl border border-slate-300 shadow-xs">
              <button
                type="button"
                onClick={() => setExpenseStatusFilter('ALL')}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition min-h-[44px] flex items-center justify-center gap-1.5 ${
                  expenseStatusFilter === 'ALL'
                    ? 'bg-slate-950 text-white shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>All Bills</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  expenseStatusFilter === 'ALL' ? 'bg-yellow-400 text-slate-950' : 'bg-slate-100 text-slate-600'
                }`}>
                  {expenses.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setExpenseStatusFilter('PAID')}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition min-h-[44px] flex items-center justify-center gap-1.5 ${
                  expenseStatusFilter === 'PAID'
                    ? 'bg-emerald-600 text-white shadow-sm font-black'
                    : 'text-emerald-700 hover:text-emerald-900'
                }`}
              >
                <span>Paid</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  expenseStatusFilter === 'PAID' ? 'bg-emerald-800 text-white' : 'bg-emerald-50 text-emerald-800'
                }`}>
                  {paidExpensesList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setExpenseStatusFilter('PENDING')}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition min-h-[44px] flex items-center justify-center gap-1.5 ${
                  expenseStatusFilter === 'PENDING'
                    ? 'bg-rose-600 text-white shadow-sm font-black'
                    : 'text-rose-700 hover:text-rose-900'
                }`}
              >
                <span>Pending Bills</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  expenseStatusFilter === 'PENDING' ? 'bg-rose-800 text-white' : 'bg-rose-50 text-rose-800'
                }`}>
                  {pendingExpensesList.length}
                </span>
              </button>
            </div>

            {/* Category Dropdown & Search Bar */}
            <div className="flex gap-2 items-center flex-col sm:flex-row">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={expenseSearchQuery}
                  onChange={(e) => setExpenseSearchQuery(e.target.value)}
                  placeholder="Search expense title, vendor, staff name..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-yellow-500 shadow-xs min-h-[44px]"
                />
              </div>

              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="w-full sm:w-auto p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 shadow-xs focus:outline-none focus:border-yellow-500 min-h-[44px]"
              >
                <option value="ALL">All Categories</option>
                <option value="Staff Salary">👷 Staff Salary (Housekeeping/Cleaner)</option>
                <option value="Security">👮 Security Guards Agency</option>
                <option value="Electricity">⚡ Electricity (Pumps & Common)</option>
                <option value="Lift & AMC">🛗 Otis Lift AMC</option>
                <option value="Water">💧 Water Tankers</option>
                <option value="Repairs & Misc">🔧 Repairs & Maintenance</option>
              </select>
            </div>

            {/* Expense Cards List */}
            <div className="space-y-3">
              {filteredExpenses.length === 0 ? (
                <div className="p-10 text-center bg-white rounded-2xl border border-slate-300 shadow-xs space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">No Society Expenses Recorded</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      The expenses and bills ledger is currently empty.
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleRequestAddExpense}
                      className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs rounded-xl inline-flex items-center gap-1.5 transition border border-yellow-500 shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Expense</span>
                    </button>
                  )}
                </div>
              ) : (
                filteredExpenses.map((exp) => {
                  const isPaid = exp.status === 'Paid';
                  return (
                    <div
                      key={exp.id}
                      className={`p-4 rounded-2xl bg-white border transition shadow-xs ${
                        isPaid
                          ? 'border-slate-300 border-l-4 border-l-emerald-600'
                          : 'border-slate-300 border-l-4 border-l-rose-500'
                      }`}
                    >
                      {/* Top Row: Title, Category, Amount, Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              {renderCategoryIcon(exp.category)}
                              <span>{exp.category}</span>
                            </span>
                            <span className="text-[11px] font-bold text-slate-500 font-mono">
                              {exp.month}
                            </span>
                          </div>

                          <h3 className="text-sm sm:text-base font-black text-slate-950 mt-1.5">
                            {exp.title}
                          </h3>

                          <p className="text-xs text-slate-600 font-medium mt-0.5">
                            Vendor / Payee: <strong className="text-slate-900">{exp.vendorName}</strong>
                          </p>
                        </div>

                        {/* Amount & Status Badge */}
                        <div className="text-right shrink-0">
                          <div className="font-mono font-black text-base sm:text-xl text-slate-950">
                            {formatINR(exp.amount)}
                          </div>

                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 border border-emerald-300 text-emerald-800 mt-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Paid</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-50 border border-rose-300 text-rose-800 mt-1">
                              <Clock className="w-3.5 h-3.5 text-rose-600" />
                              <span>Pending Bill</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details row */}
                      <div className="mt-3 p-2.5 bg-slate-50 rounded-xl text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2 border border-slate-200">
                        <div>
                          {isPaid ? (
                            <span>Paid on: <strong className="font-mono text-slate-900">{exp.paidDate || 'Cleared'}</strong> via <strong>{exp.paymentMode || 'Bank Transfer'}</strong></span>
                          ) : (
                            <span>Due Date: <strong className="font-mono text-rose-700">{exp.dueDate}</strong></span>
                          )}
                          {exp.billNo && (
                            <span className="ml-2 text-slate-500 font-mono">Bill No: {exp.billNo}</span>
                          )}
                        </div>

                        {exp.notes && (
                          <div className="w-full text-slate-600 italic border-t border-slate-200 pt-1.5 mt-1">
                            "{exp.notes}"
                          </div>
                        )}
                      </div>

                      {/* Action buttons (1-click status toggle & Edit) - Secretary Only */}
                      {isAdmin && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                          {/* 1-click status toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleExpenseStatus(exp)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 min-h-[40px] ${
                              isPaid
                                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                                : 'bg-emerald-600 text-white hover:bg-emerald-500 border-emerald-700 font-black shadow-xs'
                            }`}
                            title={isPaid ? "Mark as Pending" : "Mark as Paid"}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{isPaid ? 'Mark as Pending' : 'Mark as Paid'}</span>
                          </button>

                          {/* Edit Expense */}
                          <button
                            type="button"
                            onClick={() => handleRequestEditExpense(exp)}
                            className="px-3 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black border border-yellow-500 text-xs shadow-xs flex items-center gap-1 min-h-[40px]"
                            title="Edit expense details"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* Pin Lock Modal */}
      <PinLockModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        isAdmin={isAdmin}
        onUnlock={handleAdminUnlock}
        onLock={handleAdminLock}
      />

      {/* Add Flat Modal */}
      <AddFlatModal
        isOpen={isAddFlatModalOpen}
        onClose={() => setIsAddFlatModalOpen(false)}
        onAdd={handleAddFlat}
      />

      {/* Add / Edit Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        onDelete={handleDeleteExpense}
        initialExpense={editingExpense}
        defaultMonth={selectedBillingMonth}
      />

      {/* Manage Pending & Defaulter List Modal */}
      <ManageDuesModal
        isOpen={isManageDuesModalOpen}
        onClose={() => setIsManageDuesModalOpen(false)}
        flats={flats}
        onSaveAll={handleSaveAllDues}
        currentMonth={selectedBillingMonth}
      />

      {/* Simple Edit Flat Modal */}
      <SimpleEditModal
        flat={editingFlat}
        isOpen={Boolean(editingFlat)}
        onClose={() => setEditingFlat(null)}
        onSave={handleSaveFlat}
        onDelete={handleDeleteFlat}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-yellow-300 text-xs font-bold shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-yellow-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );

  // Helper to render individual Flat Card (Clean, NO Flash, NO WhatsApp, NO Call)
  function renderFlatCard(flat: FlatUnit) {
    const curStatus = getFlatStatusForMonth(flat, selectedBillingMonth);
    const isDefaulter = curStatus === 'Defaulter';
    const isPaid = curStatus === 'Paid';
    const isEmpty = curStatus === 'Empty';
    const allUnpaid = getUnpaidMonths(flat);
    const priorUnpaid = allUnpaid.filter((m) => m.month !== selectedBillingMonth);
    const hasPriorUnpaid = isPaid && priorUnpaid.length > 0;

    const priorArrearsAmt = flat.customOverdueAmount !== undefined
      ? flat.customOverdueAmount
      : (flat.accumulatedArrears > 0 ? flat.accumulatedArrears : priorUnpaid.reduce((s, m) => s + m.amount, 0));

    const totalDue = (isEmpty || (isPaid && !hasPriorUnpaid))
      ? 0
      : isPaid && hasPriorUnpaid
      ? priorArrearsAmt
      : (flat.customOverdueAmount !== undefined
          ? flat.customOverdueAmount
          : (isDefaulter ? flat.accumulatedArrears : (flat.accumulatedArrears || flat.monthlyMaintenance)));

    return (
      <div
        key={flat.id}
        className={`p-3.5 sm:p-4 rounded-2xl bg-white border transition shadow-xs ${
          isDefaulter
            ? 'border-rose-300 border-l-4 border-l-rose-600'
            : isEmpty
            ? 'border-slate-300 border-l-4 border-l-yellow-400 bg-slate-50/20'
            : isPaid && hasPriorUnpaid
            ? 'border-slate-300 border-l-4 border-l-emerald-500 hover:border-slate-400'
            : isPaid
            ? 'border-slate-300 hover:border-slate-400'
            : 'border-slate-300 border-l-4 border-l-amber-400 hover:border-amber-300'
        }`}
      >
        {/* Flat Header Row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-slate-950 font-mono">
                {flat.flatNo}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-yellow-100 text-slate-950 font-extrabold border border-yellow-300">
                Wing {flat.wing}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Floor {flat.floor}
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {flat.residentName}
            </div>
          </div>

          {/* Status & Amount */}
          <div className="text-right shrink-0">
            {isEmpty ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-yellow-50 border border-yellow-400 text-slate-950">
                <Home className="w-3.5 h-3.5 text-yellow-600" />
                <span>Empty Flat ({selectedBillingMonth})</span>
              </span>
            ) : isPaid ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-300 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Paid ({selectedBillingMonth})</span>
              </span>
            ) : isDefaulter ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-50 border border-rose-300 text-rose-800">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Defaulter ({allUnpaid.length} mo)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 border border-amber-300 text-amber-900">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Pending ({selectedBillingMonth})</span>
              </span>
            )}

            {isEmpty && (
              <div className="mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-yellow-100 text-slate-900 border border-yellow-400">
                  <span>{flat.exemptionReason || 'Flat was empty / Vacant'}</span>
                </span>
              </div>
            )}

            <div className="mt-1 font-mono font-black text-sm sm:text-base text-slate-950">
              {isEmpty ? (
                <span className="text-slate-600 font-black">₹0 Due</span>
              ) : isPaid && hasPriorUnpaid ? (
                <span className="text-amber-800 font-black">{formatINR(priorArrearsAmt)}</span>
              ) : isDefaulter ? (
                <span className="text-rose-700 font-black">{formatINR(totalDue)}</span>
              ) : isPaid ? (
                <span>{formatINR(flat.monthlyMaintenance)}</span>
              ) : (
                <span className="text-amber-800 font-black">{formatINR(totalDue)}</span>
              )}
            </div>

            {isEmpty && (
              <span className="text-[10px] text-slate-500 block font-bold">
                Flat Empty / Vacant
              </span>
            )}

            {isPaid && hasPriorUnpaid && (
              <span className="text-[10px] text-amber-700 block font-bold">
                ({selectedBillingMonth} Paid · Prior Dues)
              </span>
            )}

            {flat.customOverdueAmount !== undefined && !isPaid && !isEmpty && (
              <span className="text-[10px] text-amber-600 block font-bold">
                (Custom Amount)
              </span>
            )}

            {isDefaulter && (
              <span className="text-[10px] text-rose-600 block font-bold">
                {allUnpaid.length} Months Overdue
              </span>
            )}
            {isPaid && !isEmpty && !hasPriorUnpaid && (
              <span className="text-[10px] text-slate-500 block font-medium">
                via {flat.lastPaymentMode || 'UPI'}
              </span>
            )}
          </div>
        </div>

        {/* 📅 Month-by-month status track (Clean 6-month grid: May to Oct 2026) */}
        <div className="mt-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-[11px] mb-1.5 font-bold text-slate-600">
            <span>Dues by Month (May–Oct 2026):</span>
            <span className="font-mono text-slate-800">
              {isEmpty ? (
                <span className="text-yellow-800 font-bold">Flat Empty (₹0 Due)</span>
              ) : isPaid && hasPriorUnpaid ? (
                <span className="text-amber-800 font-bold">{selectedBillingMonth} Cleared · {priorUnpaid.length} Prior Unpaid</span>
              ) : allUnpaid.length > 0 ? (
                `${allUnpaid.length} Unpaid`
              ) : (
                'All Cleared'
              )}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {flat.monthlyDues?.map((m) => (
              <div
                key={m.month}
                className={`py-1 px-1 rounded-lg border text-center text-[10px] font-bold ${
                  m.isExempt
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : m.isPaid
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-300 font-black'
                }`}
              >
                <div className="font-mono">{m.month.split(' ')[0]}</div>
                <div className="text-[9px] mt-0.5">
                  {m.isExempt ? 'Empty (₹0)' : m.isPaid ? '✓' : `₹${m.amount}`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes Snippet if present */}
        {flat.secretaryNotes && (
          <div className="mt-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 font-medium">
            <strong className="text-amber-700">Note:</strong> {flat.secretaryNotes}
          </div>
        )}

        {/* Action Row: Edit Months Button Only (Secretary Admin Only) */}
        {isAdmin && (
          <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium">
              Unit ID: <code className="font-mono">{flat.id}</code>
            </span>

            <button
              type="button"
              onClick={() => handleRequestEditFlat(flat)}
              className="px-4 py-2 rounded-xl text-xs font-black bg-yellow-400 hover:bg-yellow-300 text-slate-950 border border-yellow-500/60 flex items-center gap-1.5 shadow-xs transition active:scale-95 min-h-[42px]"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Months</span>
            </button>
          </div>
        )}
      </div>
    );
  }
}

export default App;
