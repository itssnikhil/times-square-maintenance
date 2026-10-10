export interface SocietyExpense {
  id: string;
  category: 'Staff Salary' | 'Electricity' | 'Water' | 'Lift & AMC' | 'Security' | 'Repairs & Misc';
  title: string;
  vendorName: string;
  month: string; // e.g. "Oct 2026", "Sep 2026"
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'Paid' | 'Pending';
  paymentMode?: 'Bank Transfer' | 'Cheque' | 'UPI' | 'Cash';
  billNo?: string;
  notes?: string;
}

// Kept completely empty as requested
export const INITIAL_EXPENSES: SocietyExpense[] = [];
