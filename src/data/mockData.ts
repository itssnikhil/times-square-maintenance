export interface MonthDueRecord {
  month: string; // "Jan 2026", "Feb 2026", ..., "Oct 2026"
  isPaid: boolean;
  amount: number;
  isExempt?: boolean; // When true: flat was vacant/empty in this month, exempt from dues
  paidDate?: string;
  paymentMode?: string;
}

export interface PaymentHistoryItem {
  id: string;
  month: string;
  amount: number;
  date: string;
  mode: 'UPI' | 'Cash' | 'Bank Transfer' | 'Cheque';
  referenceNo?: string;
}

export type MaintenanceStatus = 'Paid' | 'Pending' | 'Defaulter' | 'Empty';

export interface FlatUnit {
  id: string;
  flatNo: string;
  wing: 'A' | 'C' | string;
  floor: number;
  residentName: string;
  phone?: string;
  email: string;
  ownership: 'Owner' | 'Tenant';
  monthlyMaintenance: number;
  status: MaintenanceStatus;
  overdueMonths: number;
  accumulatedArrears: number;
  customOverdueAmount?: number; // Manual amount override set by secretary
  manualStatusOverride?: boolean; // When true, manual status takes precedence over calculated
  isExemptFromDefaulter?: boolean;
  exemptionReason?: string;
  lastPaidDate: string | null;
  lastPaymentMode: 'UPI' | 'Cash' | 'Bank Transfer' | 'Cheque' | null;
  referenceNo: string | null;
  secretaryNotes: string;
  history: PaymentHistoryItem[];
  monthlyDues: MonthDueRecord[]; // Month-by-month status tracking from January
}

export interface SocietyConfig {
  name: string;
  subTitle: string;
  address: string;
  registrationNo: string;
  currentBillingMonth: string;
  defaultMonthlyMaintenance: number;
  secretaryName: string;
  secretaryContact: string;
  upiId: string;
  bankDetails: {
    accountName: string;
    accountNo: string;
    ifsc: string;
    bankName: string;
  };
}

export const BILLING_MONTHS = [
  'May 2026',
  'Jun 2026',
  'Jul 2026',
  'Aug 2026',
  'Sep 2026',
  'Oct 2026',
];

export const INITIAL_SOCIETY_CONFIG: SocietyConfig = {
  name: "Times Square Apartments",
  subTitle: "Co-operative Housing Society Ltd.",
  address: "Plot 42, Sector 18, Palm Beach Avenue, Navi Mumbai - 400705",
  registrationNo: "MUM/HSG/TC/10492/2021",
  currentBillingMonth: "Oct 2026",
  defaultMonthlyMaintenance: 5500,
  secretaryName: "Nitin Kulkarni",
  secretaryContact: "+91 98201 12345",
  upiId: "timessquare.society@okhdfcbank",
  bankDetails: {
    accountName: "Times Square CHS Maintenance A/C",
    accountNo: "50200088192341",
    ifsc: "HDFC0001042",
    bankName: "HDFC Bank, Palm Beach Branch",
  },
};

// Helper to construct 6-month dues array from May 2026 to Oct 2026
const buildDues = (amount: number, unpaidCount: number = 0): MonthDueRecord[] => {
  return BILLING_MONTHS.map((month, index) => {
    // Total months = 6 (indexes 0 to 5: May, Jun, Jul, Aug, Sep, Oct)
    const isUnpaid = index >= (BILLING_MONTHS.length - unpaidCount);
    return {
      month,
      isPaid: !isUnpaid,
      amount,
      paidDate: !isUnpaid ? `05 ${month}` : undefined,
      paymentMode: !isUnpaid ? 'UPI' : undefined,
    };
  });
};

import savedData from './savedData.json';

const fallbackFlats: FlatUnit[] = [
  // ==================== WING A ====================
  {
    id: "flat-a-101",
    flatNo: "A-101",
    wing: "A",
    floor: 1,
    residentName: "Amitabh Roy",
    phone: "9820198765",
    email: "amitabh.roy@example.com",
    ownership: "Owner",
    monthlyMaintenance: 5500,
    status: "Paid",
    overdueMonths: 0,
    accumulatedArrears: 0,
    lastPaidDate: "03 Oct 2026",
    lastPaymentMode: "UPI",
    referenceNo: "UPI/627710928172",
    secretaryNotes: "Prompt payer. Paid via GPay.",
    history: [],
    monthlyDues: buildDues(5500, 0),
  },
  {
    id: "flat-a-102",
    flatNo: "A-102",
    wing: "A",
    floor: 1,
    residentName: "Arun Patel",
    phone: "9833456789",
    email: "arun.patel@example.com",
    ownership: "Owner",
    monthlyMaintenance: 5500,
    status: "Pending",
    overdueMonths: 0,
    accumulatedArrears: 5500,
    lastPaidDate: "06 Sep 2026",
    lastPaymentMode: "Bank Transfer",
    referenceNo: "NEFT-HDFC-99120",
    secretaryNotes: "Promised payment by 15th Oct post salary credit.",
    history: [],
    monthlyDues: buildDues(5500, 1),
  },
  {
    id: "flat-a-201",
    flatNo: "A-201",
    wing: "A",
    floor: 2,
    residentName: "Kavita Nair",
    phone: "9819876543",
    email: "kavita.nair@example.com",
    ownership: "Owner",
    monthlyMaintenance: 5500,
    status: "Paid",
    overdueMonths: 0,
    accumulatedArrears: 0,
    lastPaidDate: "05 Oct 2026",
    lastPaymentMode: "UPI",
    referenceNo: "UPI/628019482110",
    secretaryNotes: "Paid on schedule.",
    history: [],
    monthlyDues: buildDues(5500, 0),
  },
  {
    id: "flat-a-202",
    flatNo: "A-202",
    wing: "A",
    floor: 2,
    residentName: "Sunil Joshi",
    phone: "9820554433",
    email: "sunil.joshi@example.com",
    ownership: "Tenant",
    monthlyMaintenance: 5500,
    status: "Pending",
    overdueMonths: 0,
    accumulatedArrears: 5500,
    lastPaidDate: "08 Sep 2026",
    lastPaymentMode: "UPI",
    referenceNo: "UPI/627710928999",
    secretaryNotes: "Tenant waiting for landlord reimbursement.",
    history: [],
    monthlyDues: buildDues(5500, 1),
  },
  {
    id: "flat-a-301",
    flatNo: "A-301",
    wing: "A",
    floor: 3,
    residentName: "Pooja Shah",
    phone: "9870123456",
    email: "pooja.shah@example.com",
    ownership: "Owner",
    monthlyMaintenance: 5500,
    status: "Paid",
    overdueMonths: 0,
    accumulatedArrears: 0,
    lastPaidDate: "02 Oct 2026",
    lastPaymentMode: "UPI",
    referenceNo: "UPI/627788441122",
    secretaryNotes: "Advance payer.",
    history: [],
    monthlyDues: buildDues(5500, 0),
  },
  {
    id: "flat-a-302",
    flatNo: "A-302",
    wing: "A",
    floor: 3,
    residentName: "Alok Varma",
    phone: "9821445566",
    email: "alok.varma@example.com",
    ownership: "Owner",
    monthlyMaintenance: 5500,
    status: "Defaulter",
    overdueMonths: 3,
    accumulatedArrears: 16500,
    lastPaidDate: "12 Jul 2026",
    lastPaymentMode: "Cash",
    referenceNo: "REC-2026-088",
    secretaryNotes: "Pending for Aug, Sep, and Oct 2026.",
    history: [],
    monthlyDues: buildDues(5500, 3),
  },
  {
    id: "flat-a-401",
    flatNo: "A-401",
    wing: "A",
    floor: 4,
    residentName: "Vikram Malhotra",
    phone: "9867001122",
    email: "vikram.m@example.com",
    ownership: "Owner",
    monthlyMaintenance: 6500,
    status: "Defaulter",
    overdueMonths: 4,
    accumulatedArrears: 26000,
    lastPaidDate: "15 Jun 2026",
    lastPaymentMode: "Bank Transfer",
    referenceNo: "NEFT-HDFC-88219",
    secretaryNotes: "Long-standing overdue for Jul, Aug, Sep, and Oct 2026.",
    history: [],
    monthlyDues: buildDues(6500, 4),
  },

  // ==================== WING C ====================
  {
    id: "flat-c-101",
    flatNo: "C-101",
    wing: "C",
    floor: 1,
    residentName: "Meera Iyer",
    phone: "9820987123",
    email: "meera.iyer@example.com",
    ownership: "Owner",
    monthlyMaintenance: 5500,
    status: "Paid",
    overdueMonths: 0,
    accumulatedArrears: 0,
    lastPaidDate: "01 Oct 2026",
    lastPaymentMode: "UPI",
    referenceNo: "UPI/628001122334",
    secretaryNotes: "Always clears dues on 1st of every month.",
    history: [],
    monthlyDues: buildDues(5500, 0),
  },
  {
    id: "flat-c-102",
    flatNo: "C-102",
    wing: "C",
    floor: 1,
    residentName: "Rahul Deshmukh",
    phone: "9892334455",
    email: "rahul.d@example.com",
    ownership: "Tenant",
    monthlyMaintenance: 5500,
    status: "Pending",
    overdueMonths: 0,
    accumulatedArrears: 5500,
    lastPaidDate: "05 Sep 2026",
    lastPaymentMode: "UPI",
    referenceNo: "UPI/627998877665",
    secretaryNotes: "Promised by 12th Oct.",
    history: [],
    monthlyDues: buildDues(5500, 1),
  },
  {
    id: "flat-c-201",
    flatNo: "C-201",
    wing: "C",
    floor: 2,
    residentName: "Rajesh Khanna",
    phone: "9820112233",
    email: "rajesh.khanna@example.com",
    ownership: "Owner",
    monthlyMaintenance: 5500,
    status: "Paid",
    overdueMonths: 0,
    accumulatedArrears: 0,
    lastPaidDate: "04 Oct 2026",
    lastPaymentMode: "Bank Transfer",
    referenceNo: "NEFT-ICICI-11029",
    secretaryNotes: "Paid via auto-debit standing instruction.",
    history: [],
    monthlyDues: buildDues(5500, 0),
  },
  {
    id: "flat-c-202",
    flatNo: "C-202",
    wing: "C",
    floor: 2,
    residentName: "Sanjay Mehta",
    phone: "9833667788",
    email: "sanjay.mehta@example.com",
    ownership: "Owner",
    monthlyMaintenance: 5500,
    status: "Paid",
    overdueMonths: 0,
    accumulatedArrears: 0,
    lastPaidDate: "03 Oct 2026",
    lastPaymentMode: "UPI",
    referenceNo: "UPI/627700223344",
    secretaryNotes: "Receipt issued.",
    history: [],
    monthlyDues: buildDues(5500, 0),
  },
  {
    id: "flat-c-301",
    flatNo: "C-301",
    wing: "C",
    floor: 3,
    residentName: "Ananya Banerjee",
    phone: "9819223344",
    email: "ananya.b@example.com",
    ownership: "Owner",
    monthlyMaintenance: 5500,
    status: "Paid",
    overdueMonths: 0,
    accumulatedArrears: 0,
    lastPaidDate: "06 Oct 2026",
    lastPaymentMode: "UPI",
    referenceNo: "UPI/628044556677",
    secretaryNotes: "Regular online payer.",
    history: [],
    monthlyDues: buildDues(5500, 0),
  },
  {
    id: "flat-c-302",
    flatNo: "C-302",
    wing: "C",
    floor: 3,
    residentName: "Karan Singhania",
    phone: "9820889900",
    email: "karan.s@example.com",
    ownership: "Owner",
    monthlyMaintenance: 6500,
    status: "Defaulter",
    overdueMonths: 3,
    accumulatedArrears: 19500,
    lastPaidDate: "10 Jul 2026",
    lastPaymentMode: "Cheque",
    referenceNo: "CHQ-882910",
    secretaryNotes: "Pending for Aug, Sep, and Oct 2026.",
    history: [],
    monthlyDues: buildDues(6500, 3),
  },
  {
    id: "flat-c-401",
    flatNo: "C-401",
    wing: "C",
    floor: 4,
    residentName: "Deepak Verma",
    phone: "9870998877",
    email: "deepak.v@example.com",
    ownership: "Tenant",
    monthlyMaintenance: 5500,
    status: "Pending",
    overdueMonths: 0,
    accumulatedArrears: 5500,
    lastPaidDate: "05 Sep 2026",
    lastPaymentMode: "UPI",
    referenceNo: "UPI/627889900112",
    secretaryNotes: "Waiting for salary.",
    history: [],
    monthlyDues: buildDues(5500, 1),
  },
  {
    id: "flat-c-402",
    flatNo: "C-402",
    wing: "C",
    floor: 4,
    residentName: "Farhan Khan",
    phone: "9820334455",
    email: "farhan.k@example.com",
    ownership: "Owner",
    monthlyMaintenance: 6500,
    status: "Paid",
    overdueMonths: 0,
    accumulatedArrears: 0,
    lastPaidDate: "05 Oct 2026",
    lastPaymentMode: "UPI",
    referenceNo: "UPI/628099887766",
    secretaryNotes: "Cleared Oct dues.",
    history: [],
    monthlyDues: buildDues(6500, 0),
  },
];

export const INITIAL_FLATS: FlatUnit[] = (savedData && savedData.flats && (savedData.flats as any[]).length > 0)
  ? (savedData.flats as unknown as FlatUnit[])
  : fallbackFlats;
