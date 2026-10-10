import { FlatUnit, SocietyConfig } from '../data/mockData';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const generateWhatsAppMessage = (
  flat: FlatUnit,
  config: SocietyConfig
): string => {
  const totalAmount = flat.accumulatedArrears + (flat.lateFeeApplied ? flat.lateFeeAmount : 0);
  const formattedAmount = formatCurrency(totalAmount);
  const paymentDetails = `UPI: ${config.upiId} (or A/C: ${config.bankDetails.accountNo}, IFSC: ${config.bankDetails.ifsc})`;

  if (flat.status === 'Defaulter') {
    return `Dear ${flat.residentName}, this is a reminder from the Times Square Management Office. Your maintenance dues for Flat ${flat.flatNo} totaling ${formattedAmount} are overdue for ${flat.overdueMonths} months. Please clear the outstanding balance via ${paymentDetails}.\n\nRegards,\nSociety Management Committee\nTimes Square CHS`;
  }

  // Pending current month reminder
  return `Dear ${flat.residentName}, this is a gentle reminder from the Times Square Management Office. Your monthly maintenance for Flat ${flat.flatNo} (${formatCurrency(flat.monthlyMaintenance)}) for ${config.currentBillingMonth} is pending. Kindly clear via ${paymentDetails}.\n\nThank you!`;
};

export const getWhatsAppLink = (phone?: string, message: string = ''): string => {
  if (!phone) {
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
};

export const exportToCSV = (flats: FlatUnit[], config: SocietyConfig): void => {
  const headers = [
    'Flat No',
    'Wing',
    'Floor',
    'Resident Name',
    'Ownership',
    'Status',
    'Monthly Dues (INR)',
    'Overdue Months',
    'Arrears (INR)',
    'Late Fee (INR)',
    'Total Payable (INR)',
    'Last Paid Date',
    'Payment Mode',
    'Reference No',
    'Secretary Notes',
  ];

  const rows = flats.map((f) => {
    const totalDue = f.status === 'Paid' ? 0 : f.accumulatedArrears + (f.lateFeeApplied ? f.lateFeeAmount : 0);
    return [
      `"${f.flatNo}"`,
      `"${f.wing}"`,
      f.floor,
      `"${f.residentName}"`,
      `"${f.ownership}"`,
      `"${f.status}"`,
      f.monthlyMaintenance,
      f.overdueMonths,
      f.accumulatedArrears,
      f.lateFeeApplied ? f.lateFeeAmount : 0,
      totalDue,
      `"${f.lastPaidDate || 'N/A'}"`,
      `"${f.lastPaymentMode || 'N/A'}"`,
      `"${f.referenceNo || 'N/A'}"`,
      `"${(f.secretaryNotes || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const fileName = `Times_Square_Maintenance_Report_${config.currentBillingMonth.replace(/\s+/g, '_')}.csv`;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
