import { Check, Clock3, LockKeyhole, AlertCircle, FileCheck2 } from 'lucide-react';
import type { ScopeReceipt } from '@/lib/scopeReceipt';
import { formatDate, formatDateTime, formatMoney } from '@/lib/scopeReceipt';
import { cn } from '@/lib/utils';

interface ReceiptCardProps {
  receipt: ScopeReceipt;
  compact?: boolean;
  showMetadata?: boolean;
  className?: string;
}

export default function ReceiptCard({
  receipt,
  compact = false,
  showMetadata = true,
  className,
}: ReceiptCardProps) {
  const locked = receipt.status === 'locked';
  const approvedChanges = receipt.changeRequests?.filter((cr) => cr.status === 'approved') || [];
  const totalPrice = receipt.price + approvedChanges.reduce((sum, cr) => sum + cr.additionalPrice, 0);

  return (
    <article
      className={cn(
        'receipt-perforated print-receipt relative overflow-hidden max-w-full min-w-0 rounded-xl border border-[#dfe3e8] bg-white shadow-[0_20px_45px_-20px_rgba(15,23,42,0.18)] transition-all',
        compact ? 'p-5 sm:p-6' : 'p-6 sm:p-9',
        className
      )}
      data-testid="receipt-card"
    >
      {/* Receipt Header */}
      <div className="flex items-start justify-between gap-4" data-testid="receipt-card-header">
        <div data-testid="receipt-brand-block" className="min-w-0">
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-[#111827]">
            <FileCheck2 className="size-3.5 text-[#059669]" />
            <span>ScopeReceipt</span>
          </div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[#4b5563]">
            digital proof of agreement
          </div>
        </div>

        {/* Status Stamp */}
        {receipt.status?.toUpperCase() === 'LOCKED' ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-600 shadow-sm shrink-0"
            data-testid="receipt-status-locked"
          >
            <Check className="size-3" strokeWidth={2.5} /> Scope locked
          </span>
        ) : receipt.status?.toUpperCase() === 'AWAITING' || receipt.status?.toUpperCase() === 'AWAITING_CONFIRMATION' ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-700 shadow-sm shrink-0"
            data-testid="receipt-status-awaiting"
          >
            <Clock3 className="size-3" /> Awaiting confirmation
          </span>
        ) : receipt.status?.toUpperCase() === 'CHANGE_APPROVED' || receipt.status?.toUpperCase() === 'CHANGE_REQUEST' ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-purple-700 shadow-sm shrink-0"
            data-testid="receipt-status-change"
          >
            ✓ Scope + Change Approved
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-gray-600 shrink-0"
            data-testid="receipt-status-draft"
          >
            Draft receipt
          </span>
        )}
      </div>

      {/* Perforation dashed line */}
      <div className="my-6 receipt-dash" data-testid="receipt-divider-top" />

      {/* Project Title (Deliverable Scope) */}
      <div className="mb-7 min-w-0" data-testid="receipt-project-section">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#4b5563] block">
          Deliverable Scope
        </span>
        <h2
          className={cn(
            'mt-1.5 font-semibold tracking-[-0.04em] text-[#111827] break-words [overflow-wrap:anywhere]',
            compact ? 'text-xl' : 'text-2xl sm:text-[28px] leading-tight'
          )}
          data-testid="receipt-project-title"
        >
          {receipt.title}
        </h2>
        {(receipt.freelancerName || receipt.clientName) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-[#374151]">
            {receipt.freelancerName && (
              <span className="break-words">Provided by: <strong className="font-semibold text-[#111827]">{receipt.freelancerName}</strong></span>
            )}
            {receipt.clientName && (
              <span className="break-words">For: <strong className="font-semibold text-[#111827]">{receipt.clientName}</strong></span>
            )}
          </div>
        )}
      </div>

      {/* Main Grid: Deliverables vs Exclusions */}
      <div className="grid gap-7 sm:grid-cols-[1.15fr_0.85fr] min-w-0" data-testid="receipt-details-grid">
        {/* Left: What IS and IS NOT included */}
        <div className="space-y-6 min-w-0" data-testid="receipt-primary-details">
          {/* Deliverable Description section */}
          <section data-testid="receipt-deliverable-section" className="min-w-0">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.17em] text-[#4b5563] block">
              Deliverable Description
            </span>
            <p className="mt-2 text-[15px] leading-relaxed text-[#1f2937] whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
              {receipt.deliverable}
            </p>
          </section>

          {/* Not Included Boundary Box */}
          <section
            className="rounded-lg border border-[#fde68a] bg-[#fffbeb]/75 p-4 shadow-sm min-w-0"
            data-testid="receipt-not-included-section"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#fde68a]/70 pb-2.5">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="size-3.5 text-[#b45309]" />
                <span
                  className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#92400e]"
                  data-testid="receipt-not-included-label"
                >
                  Not Included
                </span>
              </div>
              <span
                className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#b45309]"
                data-testid="receipt-boundary-note"
              >
                THE BOUNDARY
              </span>
            </div>
            <ul className="mt-3 space-y-2 min-w-0" data-testid="receipt-not-included-list">
              {receipt.notIncluded.length > 0 ? (
                receipt.notIncluded.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-[13px] leading-5 text-[#78350f] min-w-0"
                    data-testid={`receipt-not-included-item-${idx}`}
                  >
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#d97706]" />
                    <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">{item}</span>
                  </li>
                ))
              ) : (
                <li className="text-[12px] text-[#92400e] italic">No exclusions specified</li>
              )}
            </ul>
          </section>

          {/* Approved Scope Changes if any */}
          {approvedChanges.length > 0 && (
            <section className="rounded-lg border border-[#a7f3d0] bg-[#ecfdf5]/70 p-3.5 min-w-0">
              <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#047857]">
                <span>Approved Scope Add-ons</span>
                <span>+{formatMoney(approvedChanges.reduce((s, c) => s + c.additionalPrice, 0), receipt.currency)}</span>
              </div>
              <div className="mt-2 space-y-1.5 min-w-0">
                {approvedChanges.map((cr) => (
                  <div key={cr.id} className="text-[12px] text-[#065f46] break-words [overflow-wrap:anywhere]">
                    • {cr.description} <span className="font-mono font-semibold">(+{formatMoney(cr.additionalPrice, receipt.currency)})</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right: Delivery & Agreed Price */}
        <div
          className="space-y-6 sm:border-l sm:border-[#eef0f2] sm:pl-7 min-w-0"
          data-testid="receipt-secondary-details"
        >
          {/* Delivery section */}
          <section data-testid="receipt-delivery-section" className="min-w-0">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.17em] text-[#4b5563] block">
              Target Delivery
            </span>
            <p className="mt-1.5 text-[15px] font-semibold text-[#111827]" data-testid="receipt-deadline-value">
              {formatDate(receipt.deadline)}
            </p>
            {receipt.handoverMethod && (
              <p className="mt-1 text-[12px] leading-5 text-[#374151] font-medium break-words [overflow-wrap:anywhere]" data-testid="receipt-handover-value">
                via {receipt.handoverMethod}
              </p>
            )}
          </section>

          {/* Agreed Price */}
          <section data-testid="receipt-price-section">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.17em] text-[#4b5563]">
              Agreed Price
            </span>
            <div className="mt-1.5">
              <p
                className="font-mono text-3xl sm:text-4xl font-bold tracking-[-0.05em] text-[#111827]"
                data-testid="receipt-price-value"
              >
                {formatMoney(totalPrice, receipt.currency)}
              </p>
              {approvedChanges.length > 0 && (
                <span className="font-mono text-[10px] font-semibold text-[#047857]">
                  Base {formatMoney(receipt.price, receipt.currency)} + {formatMoney(totalPrice - receipt.price, receipt.currency)} add-ons
                </span>
              )}
            </div>
            <div className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-[#047857]">
              <Check className="size-3" /> Locked in agreed currency ({receipt.currency})
            </div>
          </section>

          {/* Digital Signature if Locked */}
          {locked && receipt.clientSignature && (
            <section className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#4b5563]">
                Authorized By
              </span>
              <p className="mt-1 font-mono text-sm font-semibold text-[#111827]">
                ✍️ {receipt.clientSignature}
              </p>
            </section>
          )}
        </div>
      </div>

      {/* Bottom perforation dash */}
      <div className="my-7 receipt-dash" data-testid="receipt-divider-bottom" />

      {/* Metadata & Unique ID */}
      {showMetadata && (
        <div
          className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
          data-testid="receipt-metadata"
        >
          <div className="space-y-1 font-mono text-[10px] leading-5 text-[#4b5563] font-medium" data-testid="receipt-timestamps">
            <div data-testid="receipt-created-timestamp">
              Created {formatDateTime(receipt.createdAt)}
            </div>
            {locked && (
              <div data-testid="receipt-locked-timestamp" className="text-[#047857] font-semibold">
                Confirmed {formatDateTime(receipt.lockedAt)}
              </div>
            )}
          </div>
          <div
            className="flex items-center gap-2 rounded bg-gray-100 border border-gray-200 px-2.5 py-1 font-mono text-[11px] font-bold text-[#1f2937]"
            data-testid="receipt-id"
          >
            <LockKeyhole className="size-3.5 text-[#059669]" />
            <span>{receipt.publicId}</span>
          </div>
        </div>
      )}
    </article>
  );
}
