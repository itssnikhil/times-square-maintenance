import * as XLSX from 'xlsx';
import { FlatUnit, BILLING_MONTHS } from '../data/mockData';
import { SocietyExpense } from '../data/expenseData';

export const exportFlatsToExcel = (
  flats: FlatUnit[], 
  expenses: SocietyExpense[] = [],
  currentMonth: string = 'October 2026'
) => {
  // Sheet 1: Maintenance Collection & Dues
  const flatsData = flats.map((f) => {
    const isFullyExempt = f.status === 'Empty' || Boolean(f.isExemptFromDefaulter) || (f.monthlyDues && f.monthlyDues.length > 0 && f.monthlyDues.every((m) => m.isExempt));
    const monthCols: Record<string, string> = {};
    const unpaidList: string[] = [];

    if (f.monthlyDues && f.monthlyDues.length > 0) {
      f.monthlyDues.forEach((m) => {
        if (m.isExempt) {
          monthCols[m.month] = 'EXEMPT (EMPTY FLAT - ₹0)';
        } else if (m.isPaid) {
          monthCols[m.month] = 'PAID';
        } else {
          monthCols[m.month] = `UNPAID (₹${m.amount})`;
          if (!isFullyExempt) {
            unpaidList.push(m.month);
          }
        }
      });
    } else {
      BILLING_MONTHS.forEach((m) => {
        monthCols[m] = f.status === 'Paid' ? 'PAID' : isFullyExempt ? 'EXEMPT (EMPTY FLAT - ₹0)' : 'UNPAID';
      });
    }

    const totalDue = (f.status === 'Paid' || isFullyExempt)
      ? 0 
      : (f.customOverdueAmount !== undefined
          ? f.customOverdueAmount
          : (f.status === 'Defaulter' ? f.accumulatedArrears : (f.accumulatedArrears || f.monthlyMaintenance)));

    const displayStatus = isFullyExempt
      ? 'Empty (Vacant Flat - ₹0 Due)'
      : f.status;

    return {
      'Flat No': f.flatNo,
      'Wing': f.wing,
      'Floor': f.floor,
      'Resident Name': f.residentName,
      'Status': displayStatus,
      'Monthly Rate (₹)': f.monthlyMaintenance,
      ...monthCols,
      'Unpaid Months Count': isFullyExempt ? 0 : unpaidList.length,
      'Unpaid Months List': (isFullyExempt || unpaidList.length === 0) ? 'None' : unpaidList.join(', '),
      'Total Outstanding Due (₹)': totalDue,
      'Payment Mode': (f.status === 'Paid') ? (f.lastPaymentMode || 'UPI') : '-',
      'Payment Date': (f.status === 'Paid') ? (f.lastPaidDate || '-') : '-',
      'Reference / UTR': (f.status === 'Paid') ? (f.referenceNo || '-') : '-',
      'Notes': f.secretaryNotes || (isFullyExempt ? (f.exemptionReason || 'Flat was empty / Vacant') : ''),
    };
  });

  const flatsWorksheet = XLSX.utils.json_to_sheet(flatsData);
  flatsWorksheet['!cols'] = [
    { wch: 10 }, // Flat No
    { wch: 6 },  // Wing
    { wch: 6 },  // Floor
    { wch: 20 }, // Resident Name
    { wch: 14 }, // Status
    { wch: 16 }, // Monthly Rate
    ...BILLING_MONTHS.map(() => ({ wch: 15 })), // Dynamic columns for May-Oct
    { wch: 18 }, // Unpaid Months Count
    { wch: 30 }, // Unpaid Months List
    { wch: 22 }, // Total Outstanding Due
    { wch: 15 }, // Mode
    { wch: 15 }, // Date
    { wch: 20 }, // UTR
    { wch: 30 }, // Notes
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, flatsWorksheet, 'Flat Maintenance Dues');

  // Sheet 2: Society Expenses (Staff Salary, Electricity, Lift AMC, etc.)
  if (expenses.length > 0) {
    const expensesData = expenses.map((exp) => ({
      'Category': exp.category,
      'Expense Title': exp.title,
      'Vendor / Payee': exp.vendorName,
      'Month': exp.month,
      'Amount (₹)': exp.amount,
      'Due Date': exp.dueDate,
      'Payment Status': exp.status,
      'Payment Mode': exp.paymentMode || '-',
      'Paid Date': exp.paidDate || '-',
      'Bill / Invoice No': exp.billNo || '-',
      'Notes': exp.notes || '',
    }));

    const expensesWorksheet = XLSX.utils.json_to_sheet(expensesData);
    expensesWorksheet['!cols'] = [
      { wch: 16 }, // Category
      { wch: 40 }, // Expense Title
      { wch: 30 }, // Vendor
      { wch: 12 }, // Month
      { wch: 14 }, // Amount
      { wch: 14 }, // Due Date
      { wch: 14 }, // Status
      { wch: 16 }, // Payment Mode
      { wch: 14 }, // Paid Date
      { wch: 18 }, // Bill No
      { wch: 40 }, // Notes
    ];

    XLSX.utils.book_append_sheet(workbook, expensesWorksheet, 'Society Expenses');
  }

  const cleanMonth = currentMonth.replace(/\s+/g, '_');
  XLSX.writeFile(workbook, `Times_Square_Society_Report_${cleanMonth}.xlsx`);
};
