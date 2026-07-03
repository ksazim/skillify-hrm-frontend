import { formatCurrency, formatDate, monthName, initials } from '@/utils/formatters'

/**
 * usePayslipGenerator
 * ─────────────────────
 * Builds a self-contained payslip HTML document and triggers a
 * browser download — exact same data fields, same fetch-detail
 * fallback, same filename pattern as the original. Only the
 * visual styling of the generated document was refreshed to
 * match the app's new light theme (cosmetic only, no data change).
 */
export function usePayslipGenerator({ fetchPayrollDetail, showToast }) {
  const sharePayslip = async (row) => {
    let payroll = row

    // If items are missing, fetch full detail first
    if (!payroll.items) {
      try {
        payroll = await fetchPayrollDetail(row.id)
      } catch {
        showToast('Could not load payslip details', 'error')
        return
      }
    }

    const empName    = payroll.employee?.user?.name ?? 'Employee'
    const empId      = String(payroll.employee_id).padStart(4, '0')
    const period     = `${monthName(payroll.month)} ${payroll.year}`
    const earnings   = (payroll.items ?? []).filter(i => i.type === 'earning')
    const deductions = (payroll.items ?? []).filter(i => i.type === 'deduction')
    const paidLabel  = payroll.paid_at ? `Paid on ${formatDate(payroll.paid_at)}` : 'Status: Draft'

    const earningsRows = earnings.map(i => `
      <tr>
        <td>${i.title}</td>
        <td class="amt green">${formatCurrency(i.amount)}</td>
      </tr>`).join('')

    const deductionRows = deductions.map(i => `
      <tr>
        <td>${i.title}</td>
        <td class="amt red">−${formatCurrency(i.amount)}</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Payslip – ${empName} – ${period}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;background:#F1F3F6;color:#1F2430;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem}
  .slip{background:#FFFFFF;border:1px solid #E5E7EB;border-radius:14px;width:100%;max-width:640px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,0.06)}
  /* Header */
  .slip-head{padding:28px 32px 22px;border-bottom:1px solid #EEF0F4;display:flex;justify-content:space-between;align-items:flex-start}
  .company{font-size:18px;font-weight:800;color:#4F46E5;letter-spacing:-.01em}
  .slip-label{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#9CA3AF;margin-top:4px;font-weight:600}
  .period-badge{background:#EEF2FF;border:1px solid #C7D2FE;color:#4338CA;font-size:11px;font-weight:700;letter-spacing:.06em;padding:6px 14px;border-radius:20px;text-transform:uppercase;align-self:flex-start}
  /* Employee strip */
  .emp-strip{padding:18px 32px;background:#FAFAFC;border-bottom:1px solid #EEF0F4;display:flex;align-items:center;gap:16px}
  .avatar{width:42px;height:42px;border-radius:50%;background:#4F46E5;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;flex-shrink:0}
  .emp-name{font-size:15px;font-weight:700;color:#111827}
  .emp-meta{font-size:11px;color:#9CA3AF;margin-top:3px}
  /* Summary band */
  .summary{display:flex;flex-wrap:wrap;border-bottom:1px solid #EEF0F4}
  .sum-item{flex:1;min-width:120px;padding:16px 18px;display:flex;flex-direction:column;gap:5px;border-right:1px solid #EEF0F4}
  .sum-item:last-child{border-right:none;background:#F8F7FF}
  .sum-label{font-size:9px;letter-spacing:.09em;text-transform:uppercase;color:#9CA3AF;font-weight:700}
  .sum-val{font-size:15px;font-weight:700}
  .sum-val.gold{color:#4F46E5}
  .sum-val.red{color:#DC2626}
  .sum-val.green{color:#059669}
  /* Tables */
  .tables{display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid #EEF0F4}
  .tbl-col{padding:20px 24px}
  .tbl-col:first-child{border-right:1px solid #EEF0F4}
  .tbl-head{font-size:9px;letter-spacing:.09em;text-transform:uppercase;color:#6B7280;font-weight:700;padding-bottom:10px;border-bottom:1px solid #EEF0F4;margin-bottom:2px;display:flex;align-items:center;gap:6px}
  .dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
  .dot.g{background:#059669}.dot.r{background:#DC2626}
  table{width:100%;border-collapse:collapse}
  td{padding:7px 0;font-size:12px;border-bottom:1px solid #F3F4F6;color:#4B5563}
  tr:last-child td{border-bottom:none}
  td.amt{text-align:right;font-weight:700}
  td.green{color:#059669}
  td.red{color:#DC2626}
  /* Net pay footer */
  .net-foot{padding:20px 32px;display:flex;align-items:center;justify-content:space-between;background:#F8F7FF;border-bottom:1px solid #EEF0F4}
  .net-label{font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:#6B7280;font-weight:700}
  .net-val{font-size:24px;font-weight:800;color:#4F46E5}
  /* Footer */
  .slip-foot{padding:16px 32px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
  .paid-stamp{display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:600;color:#059669;background:#ECFDF5;border:1px solid #A7F3D0;border-radius:20px;padding:5px 12px}
  .gen-note{font-size:10px;color:#B7BCC7;letter-spacing:.02em}
  @media print{body{background:#fff;padding:0}.slip{box-shadow:none;max-width:100%}}
</style>
</head>
<body>
<div class="slip">
  <div class="slip-head">
    <div>
      <div class="company">Company Payroll</div>
      <div class="slip-label">Official Salary Slip</div>
    </div>
    <div class="period-badge">${period}</div>
  </div>

  <div class="emp-strip">
    <div class="avatar">${initials(empName)}</div>
    <div>
      <div class="emp-name">${empName}</div>
      <div class="emp-meta">Employee ID: #${empId} &nbsp;·&nbsp; ${period}</div>
    </div>
  </div>

  <div class="summary">
    <div class="sum-item">
      <span class="sum-label">Gross Salary</span>
      <span class="sum-val">${formatCurrency(payroll.gross_salary)}</span>
    </div>
    <div class="sum-item">
      <span class="sum-label">Deductions</span>
      <span class="sum-val red">−${formatCurrency((payroll.late_deduction || 0) + (payroll.leave_deduction || 0))}</span>
    </div>
    <div class="sum-item">
      <span class="sum-label">Overtime + Bonus</span>
      <span class="sum-val green">+${formatCurrency((payroll.overtime_amount || 0) + (payroll.bonus_amount || 0))}</span>
    </div>
    <div class="sum-item">
      <span class="sum-label">Net Pay</span>
      <span class="sum-val gold">${formatCurrency(payroll.net_salary)}</span>
    </div>
  </div>

  <div class="tables">
    <div class="tbl-col">
      <div class="tbl-head"><span class="dot g"></span>Earnings</div>
      <table>
        <tbody>${earningsRows || '<tr><td colspan="2" style="color:#B7BCC7;font-style:italic">No earnings</td></tr>'}</tbody>
      </table>
    </div>
    <div class="tbl-col">
      <div class="tbl-head"><span class="dot r"></span>Deductions</div>
      <table>
        <tbody>${deductionRows || '<tr><td colspan="2" style="color:#B7BCC7;font-style:italic">No deductions</td></tr>'}</tbody>
      </table>
    </div>
  </div>

  <div class="net-foot">
    <span class="net-label">Total Net Pay</span>
    <span class="net-val">${formatCurrency(payroll.net_salary)}</span>
  </div>

  <div class="slip-foot">
    <span class="paid-stamp">${paidLabel}</span>
    <span class="gen-note">Generated ${new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}</span>
  </div>
</div>
</body>
</html>`

    // Trigger download
    const blob = new Blob([html], { type: 'text/html' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `Payslip_${empName.replace(/\s+/g, '_')}_${period.replace(/\s+/g, '_')}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showToast('Payslip downloaded', 'success')
  }

  return { sharePayslip }
}
