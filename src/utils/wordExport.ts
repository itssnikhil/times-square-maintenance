import { FlatUnit } from '../data/mockData';

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
  selectedBillingMonth: string = 'Oct 2026'
) => {
  // Filter only Pending and Defaulter flats (strictly excluding exempt flats and exempt vacant months)
  const overdueFlats = flats.filter((flat) => {
    // If flat was empty, exempted or cleared, completely exclude from overdue notice
    const isFlatEmpty = flat.status === 'Empty' || Boolean(flat.isExemptFromDefaulter) || (flat.monthlyDues && flat.monthlyDues.length > 0 && flat.monthlyDues.every(m => m.isExempt));
    if (isFlatEmpty || flat.status === 'Paid') {
      return false;
    }
    const dueForMonth = flat.monthlyDues?.find((m) => m.month === selectedBillingMonth);
    const isPaidInMonth = dueForMonth ? (dueForMonth.isPaid || dueForMonth.isExempt) : false;
    const unpaidList = flat.monthlyDues?.filter((m) => !m.isPaid && !m.isExempt) || [];
    
    // Include only if not paid in selected month OR has any unpaid non-exempt months
    return !isPaidInMonth || unpaidList.length > 0;
  }).sort((a, b) => {
    // Defaulters first, then by flat number
    const aUnpaid = (a.monthlyDues?.filter(m => !m.isPaid && !m.isExempt) || []).length;
    const bUnpaid = (b.monthlyDues?.filter(m => !m.isPaid && !m.isExempt) || []).length;
    if (aUnpaid !== bUnpaid) return bUnpaid - aUnpaid;
    return a.flatNo.localeCompare(b.flatNo);
  });

  const totalOverdueAmount = overdueFlats.reduce((sum, f) => {
    if (f.customOverdueAmount !== undefined) return sum + f.customOverdueAmount;
    if (f.accumulatedArrears > 0) return sum + f.accumulatedArrears;
    const unpaidList = f.monthlyDues?.filter((m) => !m.isPaid && !m.isExempt) || [];
    const amount = unpaidList.length > 0
      ? unpaidList.reduce((s, m) => s + m.amount, 0)
      : f.monthlyMaintenance;
    return sum + amount;
  }, 0);

  const defaultersCount = overdueFlats.filter(f => f.manualStatusOverride ? f.status === 'Defaulter' : (f.status === 'Defaulter' || (f.monthlyDues?.filter(m => !m.isPaid && !m.isExempt) || []).length >= 2)).length;
  const pendingCount = overdueFlats.length - defaultersCount;

  const generatedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Table rows HTML
  const tableRows = overdueFlats.map((flat, index) => {
    const unpaidMonths = flat.monthlyDues?.filter((m) => !m.isPaid && !m.isExempt) || [];
    const unpaidListFormatted = unpaidMonths.length > 0
      ? unpaidMonths.map(m => `<b>${m.month}</b> (₹${m.amount})`).join(', ')
      : `<b>${selectedBillingMonth}</b> (₹${flat.monthlyMaintenance})`;

    const totalDue = flat.customOverdueAmount !== undefined
      ? flat.customOverdueAmount
      : (flat.accumulatedArrears > 0
          ? flat.accumulatedArrears
          : (unpaidMonths.length > 0
              ? unpaidMonths.reduce((sum, m) => sum + m.amount, 0)
              : flat.monthlyMaintenance));

    const isDefaulter = flat.manualStatusOverride 
      ? flat.status === 'Defaulter' 
      : (flat.status === 'Defaulter' || unpaidMonths.length >= 2);
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
          Plot 42, Sector 18, Palm Beach Avenue, Navi Mumbai - 400705 · Registration No: MUM/HSG/TC/10492/2021
        </p>
        <p style="font-size: 9pt; color: #64748b; margin-top: 2px;">
          Office Email: office@timessquarechs.in | Hon. Secretary Contact: +91 98201 12345
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

      <!-- Settlement & Bank Instructions -->
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 12px 16px; margin-bottom: 24px; font-size: 10pt;">
        <h4 style="font-weight: bold; color: #0f172a; margin-bottom: 6px; text-transform: uppercase; font-size: 10pt;">
          Payment & Clearance Instructions
        </h4>
        <p style="margin-bottom: 4px;">
          All members listed above are requested to clear their outstanding maintenance dues immediately via any of the following modes:
        </p>
        <ul style="margin: 4px 0 8px 20px; padding: 0;">
          <li><strong>Official Society UPI ID:</strong> <span style="font-family: monospace;">timessquare.society@okhdfcbank</span></li>
          <li><strong>Direct Bank NEFT / RTGS:</strong> A/C Name: <em>Times Square CHS Maintenance A/C</em> | A/C No: <em>50200088192341</em> | Bank: <em>HDFC Bank</em> | IFSC: <em>HDFC0001042</em></li>
          <li><strong>Cheque / Demand Draft:</strong> In favor of <em>"Times Square Co-op Hsg Soc Ltd"</em> submitted at Society Office.</li>
        </ul>
        <p style="font-size: 9pt; color: #475569;">
          * After payment, kindly notify the Society Secretary with the transaction UTR number to obtain an official stamped receipt.
        </p>
      </div>

      <!-- Signatures Block -->
      <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #94a3b8;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; text-align: left; vertical-align: bottom;">
              <p style="font-size: 10pt; font-weight: bold; color: #0f172a;">Date: ${generatedDate}</p>
              <p style="font-size: 9pt; color: #475569;">Navi Mumbai</p>
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
