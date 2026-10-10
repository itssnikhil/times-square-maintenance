# Times Square Apartment Society — Mobile-First Maintenance Collection Web App

A high-performance, mobile-first maintenance collection and defaulter escalation portal designed specifically for the Society Secretary of **"Times Square Co-operative Housing Society Ltd."**

---

## 🌟 Key Features

### 1. Core Role & Access Control (Secretary Admin vs Resident View)
- **Role-Based Permissions:** Single Admin (Society Secretary) holds full write permissions: marking payments, updating dues, adding confidential memos, applying late penalties, and exporting financial audits.
- **PIN Lock Gate:**
  - Default Admin PIN: `1234` (with instant 1-tap demo unlock button).
  - Ability to change Secretary PIN.
  - Session state persists in `localStorage`.
- **Resident Public View:**
  - When locked or accessed by a resident, admin editing controls and private memos are hidden.
  - Residents can search their flat (e.g., `A-202`), view dues breakdown, scan the society UPI QR/ID (`timessquare.society@okhdfcbank`), copy NEFT details, and 1-tap notify the Secretary on WhatsApp after payment.

### 2. Mobile-First Layout & Touch Ergonomics
- **Strict Mobile Optimization:** Designed for one-handed thumb navigation with min 44px touch targets.
- **Sticky Top Bar:** Society emblem, current billing cycle (`October 2026`), admin status badge, quick actions, and demo device switcher (toggle between 390px mobile frame and full-width responsive view).
- **Quick Metrics Bar:**
  - Total Flats count (`15 units across Wings A & B`)
  - Total Collected this month (`₹44,000` with animated progress bar towards the ₹83,500 target)
  - Pending Current Month dues (`₹22,000`)
  - Defaulters Arrears (`₹52,500 + ₹4,500 late fees`)
- **Bottom Navigation Bar:** Fast thumb access to Defaulters, WhatsApp Broadcasts, Audit Report, and PIN gate.

### 3. Dedicated Defaulters List ("Anti-Gravity" Visual Hierarchy)
- **High-Priority Visual Hierarchy:**
  - Filter Switcher: `[ All Units (15) | Paid (8) | Pending (4) | 🚨 Defaulters (3) ]`
  - High-contrast visual styling (`#0f172a` dark slate backdrop with crimson/amber borders and `defaulter-pulse` warning glow).
  - Prominent metrics: Overdue Months count (e.g., `3 Months Overdue`) and Total Accumulated Arrears.
- **1-Tap Automated WhatsApp Reminder:**
  - Formatted per society bylaws:
    > *"Dear [Resident Name], this is a reminder from the Times Square Management Office. Your maintenance dues for [Flat No] totaling [Amount] are overdue for [X] months. Please clear the outstanding balance via [UPI/Account details]."*
- **Late Fee / Penalty Toggle:** Auto-calculates `overdueMonths × ₹500` per month with instant recalculation.
- **WhatsApp Batch Broadcast Tool:** Preview and send reminders to all defaulters in 1 click or copy all messages to clipboard.

### 4. Secretary Inline Editing Capabilities
- **Bottom Sheet / Slide-Over Drawer:**
  - 1-click status pills: `[Mark Paid]`, `[Mark Pending]`, `[🚨 Defaulter]`.
  - Payment mode selector (`UPI`, `Cash`, `Bank Transfer`, `Cheque`).
  - Auto-generate receipt & transaction reference number.
  - Confidential Secretary memo notes with 1-click tag snippets (`+ Promised by 15th`, `+ Sent legal notice`, `+ Cash paid at gate`).
  - Haptic celebratory confetti burst on marking as Paid!

### 5. Audit Reports & Formal Statements
- **CSV Export:** Download full 16-column spreadsheet (`Times_Square_Maintenance_Report_October_2026.csv`).
- **Official Print / PDF Receipt:** Formatted society maintenance receipt and demand bill with registration number, itemized breakdown, and Secretary signature block.

---

## 🏗 Tech Stack & Architecture
- **Framework:** React 19 + Vite 8
- **Styling:** Tailwind CSS v4 (Mobile-first, glassmorphism, responsive utilities)
- **Icons:** Lucide React
- **Celebration Feedback:** Canvas-Confetti
- **Persistence:** LocalStorage API with versioning and 1-click "Reset Sample Data"
- **Dataset:** 15 flats across Floors 1–4 of Wings A & B (8 Paid, 4 Pending, 3 Defaulters: A-202, A-404, B-301)

---

## 🚀 Running Locally

```bash
cd times-square-maintenance
npm install
npm run dev
```

Visit [http://localhost:5173/](http://localhost:5173/) on your browser.
