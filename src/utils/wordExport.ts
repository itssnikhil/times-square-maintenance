import { FlatUnit, BILLING_MONTHS } from '../data/mockData';

// Helper for Indian Currency formatting
const formatINR = (amt: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amt);
};

export const exportPendingAndDefaultersToWord = (
  flats: FlatUnit[],
  selectedBillingMonth: string = 'Nov 2026'
) => {
  const targetIndex = BILLING_MONTHS.indexOf(selectedBillingMonth);

  // Helper to get all unpaid non-exempt months up to selectedBillingMonth
  const getFlatUnpaidMonths = (flat: FlatUnit) => {
    const isFlatEmpty = flat.status === 'Empty' || Boolean(flat.isExemptFromDefaulter) || (flat.monthlyDues && flat.monthlyDues.length > 0 && flat.monthlyDues.every(m => m.isExempt));
    if (isFlatEmpty) return [];
    if (!flat.monthlyDues || flat.monthlyDues.length === 0) return [];
    return flat.monthlyDues.filter((m) => {
      if (m.isPaid || m.isExempt) return false;
      if (targetIndex !== -1) {
        const idx = BILLING_MONTHS.indexOf(m.month);
        return idx !== -1 && idx <= targetIndex;
      }
      return true;
    });
  };

  // Helper to determine if flat is a Defaulter (2+ unpaid months up to selected month or manually marked)
  const isFlatDefaulter = (flat: FlatUnit) => {
    const unpaidList = getFlatUnpaidMonths(flat);
    return flat.status === 'Defaulter' || unpaidList.length >= 2;
  };

  // Helper to get total due amount
  const getFlatTotalDue = (flat: FlatUnit) => {
    if (flat.customOverdueAmount !== undefined) {
      return flat.customOverdueAmount;
    }
    const unpaidList = getFlatUnpaidMonths(flat);
    if (unpaidList.length > 0) {
      return unpaidList.reduce((sum, m) => sum + (m.amount || flat.monthlyMaintenance || 1000), 0);
    }
    return flat.monthlyMaintenance || 1000;
  };

  // Filter all flats that have unpaid dues up to selectedBillingMonth (strictly excluding empty/vacant flats)
  const overdueFlats = flats.filter((flat) => {
    const isFlatEmpty = flat.status === 'Empty' || Boolean(flat.isExemptFromDefaulter) || (flat.monthlyDues && flat.monthlyDues.length > 0 && flat.monthlyDues.every(m => m.isExempt));
    if (isFlatEmpty) {
      return false;
    }
    const unpaidList = getFlatUnpaidMonths(flat);
    return unpaidList.length > 0;
  }).sort((a, b) => {
    const aDef = isFlatDefaulter(a);
    const bDef = isFlatDefaulter(b);
    if (aDef && !bDef) return -1;
    if (!aDef && bDef) return 1;

    const aUnpaid = getFlatUnpaidMonths(a).length;
    const bUnpaid = getFlatUnpaidMonths(b).length;
    if (aUnpaid !== bUnpaid) return bUnpaid - aUnpaid;

    return a.flatNo.localeCompare(b.flatNo, undefined, { numeric: true });
  });

  const totalOverdueAmount = overdueFlats.reduce((sum, f) => sum + getFlatTotalDue(f), 0);
  const defaultersCount = overdueFlats.filter(f => isFlatDefaulter(f)).length;
  const pendingCount = overdueFlats.length - defaultersCount;

  const generatedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Table rows HTML
  const tableRows = overdueFlats.map((flat, index) => {
    const unpaidMonths = getFlatUnpaidMonths(flat);
    const unpaidListFormatted = unpaidMonths.length > 0
      ? unpaidMonths.map(m => `<b>${m.month}</b> (₹${m.amount || flat.monthlyMaintenance || 1000})`).join(', ')
      : `<b>${selectedBillingMonth}</b> (₹${flat.monthlyMaintenance || 1000})`;

    const totalDue = getFlatTotalDue(flat);
    const isDefaulter = isFlatDefaulter(flat);
    const statusLabel = isDefaulter ? 'DEFAULTER' : 'PENDING';
    const statusColor = isDefaulter ? '#b91c1c' : '#b45309';
    const rowBg = index % 2 === 0 ? '#ffffff' : '#f8fafc';

    return `
      <tr style="background-color: ${rowBg};">
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${index + 1}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: bold; font-family: monospace; font-size: 13px;">${flat.flatNo}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center;">Wing ${flat.wing}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 600;">${flat.residentName}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center;">
          <span style="color: ${statusColor}; font-weight: bold; font-size: 11px;">${statusLabel}</span>
        </td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${unpaidMonths.length || 1}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 12px; line-height: 1.4;">${unpaidListFormatted}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #0f172a; font-family: monospace; font-size: 13px;">
          ${formatINR(totalDue)}
        </td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 11px; color: #475569;">
          ${flat.secretaryNotes || '-'}
        </td>
      </tr>
    `;
  }).join('');

  // Complete Microsoft Word HTML Document template
  const wordDocumentHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:w="urn:schemas-microsoft-com:office:word" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>Times Square CHS - Notice of Pending Dues & Defaulters</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 1.5cm;
        }
        body {
          font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
          color: #0f172a;
          line-height: 1.5;
        }
        h1, h2, h3, p {
          margin: 0;
          padding: 0;
        }
      </style>
    </head>
    <body>
      <!-- Society Header / Letterhead -->
      <div style="border-bottom: 3px solid #facc15; padding-bottom: 12px; margin-bottom: 16px; text-align: center;">
        <h1 style="font-size: 20pt; font-weight: 900; color: #020617; text-transform: uppercase; letter-spacing: 0.5px;">
          TIMES SQUARE CO-OPERATIVE HOUSING SOCIETY LTD.
        </h1>
        <p style="font-size: 10pt; color: #475569; margin-top: 4px;">
          Tejaji Nagar, Indore
        </p>
      </div>

      <!-- Notice Title & Metadata -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 6px solid #e11d48; padding: 12px 16px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="font-size: 14pt; font-weight: 800; color: #881337; text-transform: uppercase;">
              OFFICIAL NOTICE: OUTSTANDING MAINTENANCE DUES & DEFAULTERS LIST
            </h2>
            <p style="font-size: 10pt; color: #334155; margin-top: 4px;">
              <strong>Billing Period:</strong> Up to ${selectedBillingMonth} &nbsp;|&nbsp; 
              <strong>Generated Date:</strong> ${generatedDate}
            </p>
          </div>
        </div>
      </div>

      <!-- Summary Metrics Box -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="width: 25%; padding: 10px; background-color: #f1f5f9; border: 1px solid #cbd5e1; text-align: center;">
            <span style="font-size: 9pt; font-weight: bold; color: #475569; text-transform: uppercase; display: block;">Total Overdue Units</span>
            <span style="font-size: 16pt; font-weight: 900; color: #0f172a;">${overdueFlats.length} Flats</span>
          </td>
          <td style="width: 25%; padding: 10px; background-color: #fef2f2; border: 1px solid #fecaca; text-align: center;">
            <span style="font-size: 9pt; font-weight: bold; color: #991b1b; text-transform: uppercase; display: block;">Defaulters (2+ Months)</span>
            <span style="font-size: 16pt; font-weight: 900; color: #b91c1c;">${defaultersCount} Flats</span>
          </td>
          <td style="width: 25%; padding: 10px; background-color: #fefce8; border: 1px solid #fef08a; text-align: center;">
            <span style="font-size: 9pt; font-weight: bold; color: #854d0e; text-transform: uppercase; display: block;">Single Month Pending</span>
            <span style="font-size: 16pt; font-weight: 900; color: #a16207;">${pendingCount} Flats</span>
          </td>
          <td style="width: 25%; padding: 10px; background-color: #020617; border: 1px solid #020617; text-align: center; color: white;">
            <span style="font-size: 9pt; font-weight: bold; color: #facc15; text-transform: uppercase; display: block;">Total Outstanding Amount</span>
            <span style="font-size: 16pt; font-weight: 900; color: #ffffff;">${formatINR(totalOverdueAmount)}</span>
          </td>
        </tr>
      </table>

      <!-- Detailed Statement Table -->
      <h3 style="font-size: 11pt; font-weight: bold; color: #0f172a; margin-bottom: 8px; text-transform: uppercase;">
        Detailed Flat-Wise Overdue Statement (Wing A & Wing C)
      </h3>

      <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 24px;">
        <thead>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th style="padding: 8px; border: 1px solid #0f172a; width: 4%;">#</th>
            <th style="padding: 8px; border: 1px solid #0f172a; width: 10%;">Flat No</th>
            <th style="padding: 8px; border: 1px solid #0f172a; width: 8%;">Wing</th>
            <th style="padding: 8px; border: 1px solid #0f172a; width: 20%;">Resident Name</th>
            <th style="padding: 8px; border: 1px solid #0f172a; width: 12%;">Status</th>
            <th style="padding: 8px; border: 1px solid #0f172a; width: 6%;">Months</th>
            <th style="padding: 8px; border: 1px solid #0f172a; width: 22%;">Unpaid / Given Months</th>
            <th style="padding: 8px; border: 1px solid #0f172a; width: 10%; text-align: right;">Total Due</th>
            <th style="padding: 8px; border: 1px solid #0f172a; width: 14%;">Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <!-- Signatures Block -->
      <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #94a3b8;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; text-align: left; vertical-align: bottom;">
              <p style="font-size: 10pt; font-weight: bold; color: #0f172a;">Date: ${generatedDate}</p>
              <p style="font-size: 9pt; color: #475569;">Tejaji Nagar, Indore</p>
            </td>
            <td style="width: 50%; text-align: right; vertical-align: bottom;">
              <div style="display: inline-block; text-align: center;">
                <p style="font-size: 10pt; font-weight: bold; color: #0f172a; margin-bottom: 40px;">
                  For TIMES SQUARE CO-OP HOUSING SOCIETY LTD.
                </p>
                <p style="font-size: 10pt; font-weight: bold; color: #020617; border-top: 1px solid #000; padding-top: 4px;">
                  Hon. Secretary / Treasurer
                </p>
                <p style="font-size: 9pt; color: #64748b;">Managing Committee</p>
              </div>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  // Create Blob with Word Document MIME type
  const blob = new Blob(['\ufeff', wordDocumentHtml], {
    type: 'application/msword;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const cleanMonth = selectedBillingMonth.replace(/\s+/g, '_');
  link.download = `Times_Square_Pending_and_Defaulters_${cleanMonth}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
