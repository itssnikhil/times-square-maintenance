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

export const INITIAL_EXPENSES: SocietyExpense[] = [
  {
    id: "exp-1",
    category: "Security",
    title: "Security Guards Salary (3 Day & Night Guards)",
    vendorName: "Apex Security Agency Pvt Ltd",
    month: "Oct 2026",
    amount: 21000,
    dueDate: "05 Oct 2026",
    paidDate: "05 Oct 2026",
    status: "Paid",
    paymentMode: "Bank Transfer",
    billNo: "INV-APEX-992",
    notes: "Direct NEFT to agency account. All 3 guards attendance verified.",
  },
  {
    id: "exp-2",
    category: "Electricity",
    title: "Common Area & Water Pump Electricity Bill",
    vendorName: "MSEDCL / Power Supply Board",
    month: "Oct 2026",
    amount: 11450,
    dueDate: "12 Oct 2026",
    paidDate: "08 Oct 2026",
    status: "Paid",
    paymentMode: "UPI",
    billNo: "MSEB-OCT-88219",
    notes: "Paid online via society UPI account.",
  },
  {
    id: "exp-3",
    category: "Staff Salary",
    title: "Housekeeping Staff Salary (2 Cleaners & Sweeper)",
    vendorName: "Ramesh & Sunita (Direct Society Staff)",
    month: "Oct 2026",
    amount: 14000,
    dueDate: "07 Oct 2026",
    paidDate: "06 Oct 2026",
    status: "Paid",
    paymentMode: "Bank Transfer",
    billNo: "SAL-OCT-02",
    notes: "Monthly salary credited to respective bank accounts.",
  },
  {
    id: "exp-4",
    category: "Lift & AMC",
    title: "Otis Elevator Monthly AMC & Safety Inspection",
    vendorName: "Otis Elevator Co. (India) Ltd",
    month: "Oct 2026",
    amount: 4500,
    dueDate: "15 Oct 2026",
    status: "Pending",
    notes: "Invoice received. Awaiting technician quarterly checklist report.",
  },
  {
    id: "exp-5",
    category: "Water",
    title: "Emergency Water Tanker (2 Tankers - 20,000L)",
    vendorName: "City Water Tanker Services",
    month: "Oct 2026",
    amount: 3200,
    dueDate: "18 Oct 2026",
    status: "Pending",
    notes: "Ordered during municipal water pipeline maintenance cut.",
  },
  {
    id: "exp-6",
    category: "Repairs & Misc",
    title: "Clubhouse & Garden Grass Trimming & Upkeep",
    vendorName: "Green Thumb Garden Care",
    month: "Oct 2026",
    amount: 2500,
    dueDate: "04 Oct 2026",
    paidDate: "04 Oct 2026",
    status: "Paid",
    paymentMode: "Cash",
    billNo: "REC-CASH-441",
    notes: "Cash payment against signed receipt from office petty cash.",
  },
  {
    id: "exp-7",
    category: "Repairs & Misc",
    title: "Overhead Water Tank Cleaning & Chlorination",
    vendorName: "PureFlow Sanitization",
    month: "Oct 2026",
    amount: 3800,
    dueDate: "20 Oct 2026",
    status: "Pending",
    notes: "Scheduled for upcoming weekend after 10 AM.",
  },
];
