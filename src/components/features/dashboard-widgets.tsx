import Link from "next/link";
import { Activity, ArrowRight, BookOpen, CreditCard, FileText, MessageCircle, RefreshCw, Users, Video, type LucideIcon } from "lucide-react";
import { displayValue, type ApiRecord } from "@/lib/api";

export function DashboardMetric({ label, value, icon: Icon }: { label: string; value: unknown; icon: LucideIcon }) {
  return <article className="metric-card"><span className="metric-icon"><Icon size={18} /></span><span className="metric-label">{label}</span><strong>{displayValue(value)}</strong><small>Fetched from the backend</small></article>;
}

export function DashboardRecords({ title, eyebrow, records, href }: { title: string; eyebrow: string; records: ApiRecord[]; href: string }) {
  return <section className="dashboard-list-panel">
    <div className="panel-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><Link className="text-link" href={href}>View all <ArrowRight size={14} /></Link></div>
    {records.length
      ? <div className="dashboard-rows">{records.slice(0, 5).map((record, index) => <div className="dashboard-row" key={String(record.public_id ?? record.id ?? index)}><span className="dashboard-row-icon">{iconFor(record)}</span><span className="dashboard-row-copy"><b>{titleOf(record)}</b><small>{detailsOf(record)}</small></span></div>)}</div>
      : <div className="dashboard-empty">No records returned from this endpoint.</div>}
  </section>;
}

export function DashboardStatus({ loading, error, hasSession, onRetry }: { loading: boolean; error: string; hasSession: boolean; onRetry: () => void }) {
  if (!hasSession) return <div className="api-error" role="status"><div><b>Sign in to load your dashboard</b><p>Your real enrollments, class schedule, and progress are private to your account.</p></div><Link className="button button-primary" href="/login">Sign in <ArrowRight size={14} /></Link></div>;
  if (loading) return <div className="api-loading"><span className="spinner" /> Loading dashboard data from the backend…</div>;
  return <div className="dashboard-load-state" role={error ? "alert" : "status"}>{error ? <><span>{error}</span><button className="button button-light" type="button" onClick={onRetry}><RefreshCw size={14} /> Refresh</button></> : "Dashboard data is up to date."}</div>;
}

function titleOf(record: ApiRecord) {
  const batch = record.batch && typeof record.batch === "object" ? record.batch as ApiRecord : null;
  const course = record.course && typeof record.course === "object" ? record.course as ApiRecord : null;
  const title = record.title ?? record.full_name ?? record.student_name ?? record.test_title ?? record.name ?? batch?.title ?? course?.title ?? record.subject ?? record.email;
  return displayValue(title, "Untitled");
}

function detailsOf(record: ApiRecord) {
  const course = record.course && typeof record.course === "object" ? record.course as ApiRecord : null;
  const teacher = record.primary_teacher && typeof record.primary_teacher === "object" ? record.primary_teacher as ApiRecord : null;
  return [course?.title, teacher?.full_name, record.status, record.scheduled_start, record.category, record.created_at, record.enrolled_at].filter(Boolean).map(value => displayValue(value)).join(" · ") || "From your account";
}

function iconFor(record: ApiRecord) {
  if (record.scheduled_start) return <Video size={16} />;
  if (record.student_name || record.total_students !== undefined) return <Users size={16} />;
  if (record.amount !== undefined || record.amount_paid !== undefined) return <CreditCard size={16} />;
  if (record.text_content || record.reply_count !== undefined) return <MessageCircle size={16} />;
  if (record.title) return <BookOpen size={16} />;
  if (record.current_streak !== undefined || record.total_points !== undefined) return <Activity size={16} />;
  return <FileText size={16} />;
}
