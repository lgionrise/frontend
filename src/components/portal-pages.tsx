"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import {
  ArrowRight, BookOpen, CalendarDays, Check, CircleAlert,
  CreditCard, FileText, GraduationCap, LoaderCircle, MessageCircle,
  Plus, RefreshCw, Search, Users, Video,
} from "lucide-react";
import { apiRequest, displayValue, type ApiRecord } from "@/lib/api";
import { LiveClassList, LiveClassManager } from "@/components/features/live-classes";
import { StudentDashboard } from "@/components/features/student-dashboard";
import { TeacherDashboard } from "@/components/features/teacher-dashboard";
import {
  findNavigationItem, findPageLink, routeFor, type PortalRole,
} from "@/lib/navigation";

type Props = { role: PortalRole; section: string[]; pageKey: string; hasSession: boolean; user: ApiRecord | null };

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
  handler: (response: RazorpayResponse) => void | Promise<void>;
};

type RazorpayConstructor = new (options: RazorpayOptions) => {
  open: () => void;
  close?: () => void;
};

function getRazorpay(): RazorpayConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;
}


type LoadState = "loading" | "ready" | "error";

const PUBLIC_ENDPOINTS = new Set([
  "/batches/", "/batches/compare/", "/courses/", "/auth/teachers/", "/coupons/active-offers/",
]);

function isPublicEndpoint(endpoint: string) {
  if (PUBLIC_ENDPOINTS.has(endpoint)) return true;
  const batchDetail = endpoint.match(/^\/batches\/([^/]+)\/$/);
  return Boolean(batchDetail && !["mine", "my-enrollments", "create", "compare", "wishlist"].includes(batchDetail[1]));
}

const descriptions: Record<string, string> = {
  discover: "Browse real published batches from your learning platform.",
  "my-courses": "Your active and past batch enrollments.",
  "live-classes": "Upcoming and past live sessions from your enrolled batches.",
  library: "Your course materials, saved notes, and downloadable resources.",
  tests: "Published tests and your completed attempts.",
  doubts: "Your question threads and teacher replies.",
  tutoring: "Browse teacher profiles and manage private-session bookings.",
  achievements: "Points, streaks, badges, goals, and rewards from your account.",
  certificates: "Certificates issued to your account.",
  payments: "Your payment orders, plans, and subscriptions.",
  saved: "The batches you have added to your wishlist.",
  referrals: "Your referral code and referral activity.",
  notifications: "Notifications sent to your account.",
  support: "Your support tickets, help articles, and FAQs.",
  profile: "Your account details.",
  security: "Your active devices and account security settings.",
  batches: "Batches assigned to your teacher account.",
  students: "Choose one of your batches to view its enrolled students.",
  courses: "Published course catalogue and syllabus information.",
  content: "Learning materials uploaded for your batches.",
  recordings: "Recordings connected to your classes.",
  earnings: "Earnings snapshots from your teaching activity.",
  performance: "Teaching performance metrics from your account.",
  payouts: "Payout history and bank-account settings.",
  settings: "Your account settings.",
};

function titleCase(value: string) {
  return value.split("-").map(part => part ? part[0].toUpperCase() + part.slice(1) : "").join(" ");
}

function endpointFor(role: PortalRole, section: string[]) {
  const [slug, child, identifier, detailId] = section;
  const item = findNavigationItem(role, slug);
  const page = findPageLink(role, slug, child);

  if (slug === "dashboard") return null;
  if (slug === "students" && child === "roster" && identifier) return `/batches/${identifier}/students/`;
  if (slug === "batches" && child === "manage" && identifier) return `/batches/${identifier}/manage/`;
  if (slug === "batches" && child === "schedule" && identifier) return `/batches/${identifier}/schedule/`;
  if (slug === "live-classes" && child === "manage" && identifier) return `/live-classes/${identifier}/`;
  if (slug === "live-classes" && child === "attendance" && identifier) return `/live-classes/${identifier}/attendance/`;
  if (slug === "live-classes" && child === "chat" && identifier) return `/live-classes/${identifier}/chat/`;
  if (slug === "live-classes" && child === "polls" && identifier) return `/live-classes/${identifier}/polls/`;
  if (slug === "live-classes" && child === "announcements" && identifier) return `/live-classes/${identifier}/announcements/`;
  if (slug === "recordings" && child === "detail" && identifier) return `/recordings/${identifier}/`;
  if (slug === "tests" && child === "result" && identifier) return `/tests/attempts/${identifier}/result/`;
  if (slug === "tests" && child === "questions" && identifier) return `/tests/${identifier}/questions/`;
  if (slug === "doubts" && child === "thread" && identifier) return `/doubts/${identifier}/`;
  if (slug === "support" && child === "ticket" && identifier) return `/support/tickets/${identifier}/`;
  if (slug === "discover" && child === "batch" && identifier) return `/batches/${identifier}/`;
  if (slug === "discover" && child === "compare") return "/batches/";
  if (slug === "achievements" && child === "redeem" && identifier) return `/gamification/rewards/${identifier}/redeem/`;
  if (slug === "payments" && child === "invoice" && identifier) return `/payments/orders/${identifier}/invoice/`;
  if (slug === "live-classes" && child === "batch" && identifier) return `/live-classes/batch/${identifier}/all/`;
  if (slug === "live-classes" && child === "issue" && identifier) return `/live-classes/${identifier}/report-issue/`;
  if (slug === "live-classes" && child === "leave" && identifier) return `/live-classes/${identifier}/leave/`;
  if (slug === "live-classes" && child === "end" && identifier) return `/live-classes/${identifier}/end/`;
  if (slug === "recordings" && child === "notes" && identifier) return `/recordings/${identifier}/notes/`;
  if (slug === "recordings" && child === "bookmarks" && identifier) return `/recordings/${identifier}/bookmarks/`;
  if (slug === "recordings" && child === "download" && identifier) return `/recordings/${identifier}/download/`;
  if (slug === "doubts" && child === "reply" && identifier) return `/doubts/${identifier}/reply/`;
  if (slug === "doubts" && child === "resolve" && identifier) return `/doubts/${identifier}/resolve/`;
  if (slug === "doubts" && child === "rate" && identifier) return `/doubts/${identifier}/rate/`;
  if (slug === "tutoring" && child === "manage-booking" && identifier && detailId) return `/private-tuition/bookings/${identifier}/${detailId}/`;
  if (page) return page.endpoint;
  return item?.endpoint ?? null;
}

function actionFor(role: PortalRole, section: string[]): { label: string; endpoint: string; method: string; payload: string } | null {
  const [slug, child, identifier] = section;
  const page = findPageLink(role, slug, child);
  if (page?.method) {
    return { label: page.label, endpoint: page.endpoint, method: page.method, payload: "{}" };
  }
  if (slug === "support" && !child) {
    return { label: "Create support ticket", endpoint: "/support/tickets/", method: "POST", payload: "{}" };
  }
  if (slug === "live-classes" && identifier) {
    const classActions: Record<string, { label: string; endpoint: string; payload: string }> = {
      chat: { label: "Send encrypted class message", endpoint: `/live-classes/${identifier}/chat/`, payload: '{"encrypted_content":"","is_teacher_mention":false}' },
      polls: { label: "Create a class poll", endpoint: `/live-classes/${identifier}/polls/`, payload: '{"question":"","options":[],"is_active":true}' },
      announcements: { label: "Post class announcement", endpoint: `/live-classes/${identifier}/announcements/`, payload: '{"message":""}' },
      issue: { label: "Report a technical issue", endpoint: `/live-classes/${identifier}/report-issue/`, payload: '{"description":""}' },
      leave: { label: "Leave the live class", endpoint: `/live-classes/${identifier}/leave/`, payload: "{}" },
      cancel: { label: "Cancel the scheduled class", endpoint: `/live-classes/${identifier}/cancel/`, payload: '{"reason":""}' },
      end: { label: "End the live class", endpoint: `/live-classes/${identifier}/end/`, payload: "{}" },
    };
    const classAction = classActions[child];
    if (classAction) return { ...classAction, method: "POST" };
  }
  if (role === "teacher" && slug === "tests" && child === "manage") {
    return { label: "Create test", endpoint: "/tests/manage/", method: "POST", payload: "{}" };
  }
  const postActions: Record<string, { label: string; endpoint: string; payload: string }> = {
    "student:doubts": { label: "Ask a doubt", endpoint: "/doubts/", payload: '{"batch":null,"source_type":"text","text_content":"","priority":"normal"}' },
    "student:payments": { label: "Request a refund", endpoint: "/payments/refunds/request/", payload: '{"order":"","reason":""}' },
    "teacher:content": { label: "Upload material", endpoint: "/content/create/", payload: '{"batch":"","chapter":null,"topic":null,"content_type":"note","title":"","description":"","file_url":"","file_size_bytes":0,"allow_download":false}' },
    "student:security": { label: "Change password", endpoint: "/auth/password/change/", payload: '{"old_password":"","new_password":""}' },
    "student:notifications": { label: "Update notification preferences", endpoint: "/notifications/preferences/", payload: "{}" },
    "teacher:notifications": { label: "Update notification preferences", endpoint: "/notifications/preferences/", payload: "{}" },
    "student:profile": { label: "Update profile", endpoint: "/auth/profile/", payload: "{}" },
    "teacher:profile": { label: "Update teaching profile", endpoint: "/teacher/profile/", payload: "{}" },
  };
  const key = `${role}:${slug}`;
  const spec = postActions[key];
  const method = key.endsWith(":profile") || key.endsWith(":notifications") ? "PATCH" : "POST";
  return spec ? { ...spec, method } : null;
}

export function PortalPageView({ role, section, pageKey, hasSession, user }: Props) {
  const slug = section[0] || "dashboard";
  const item = findNavigationItem(role, slug);
  if (!item && slug !== "dashboard") return <NotFound role={role} />;
  if (slug === "dashboard" && section.length === 1) return role === "student"
    ? <StudentDashboard hasSession={hasSession} />
    : <TeacherDashboard hasSession={hasSession} user={user} />;
  if (slug === "students" && section[1] === "roster" && section[2]) {
    return <ResourcePage key={pageKey} role={role} section={section} hasSession={hasSession} />;
  }
  if (slug === "tests" && section[1] === "attempts" && section[2]) {
    return <ResourcePage key={pageKey} role={role} section={["tests", "result", section[2]]} hasSession={hasSession} />;
  }
  return <ResourcePage key={pageKey} role={role} section={section} hasSession={hasSession} />;
}

function ResourcePage({ role, section, hasSession }: { role: PortalRole; section: string[]; hasSession: boolean }) {
  const [slug, child, identifier] = section;
  const item = findNavigationItem(role, slug);
  const childItem = findPageLink(role, slug, child);
  const endpoint = endpointFor(role, section);
  const action = actionFor(role, section);
  const mutationOnly = Boolean((childItem?.method && childItem.method !== "GET") || (action?.method && action.method !== "GET" && slug === "live-classes" && ["polls", "announcements", "leave", "issue", "cancel", "end"].includes(child)));
  const [state, setState] = useState<LoadState>(mutationOnly ? (hasSession ? "ready" : "error") : "loading");
  const [error, setError] = useState(mutationOnly && !hasSession ? "Sign in before sending changes to your account." : "");
  const [data, setData] = useState<unknown>(null);
  const [query, setQuery] = useState("");
  const [showAction, setShowAction] = useState(mutationOnly);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [actionResponse, setActionResponse] = useState<ApiRecord | null>(null);
  const [detail, setDetail] = useState<ApiRecord | null>(null);

  const pageTitle = childItem?.label
    ?? (slug === "students" && child === "roster" ? "Batch roster"
      : slug === "discover" && child === "batch" ? "Batch details"
        : child ? `${titleCase(child)} · ${item?.label ?? titleCase(slug)}`
          : item?.label ?? titleCase(slug));
  const load = useCallback(async () => {
    if (!endpoint) {
      setState("ready");
      return;
    }
    if (mutationOnly) {
      if (!hasSession) {
        setState("error");
        setError("Sign in before sending changes to your account.");
      } else {
        setState("ready");
      }
      return;
    }
    if (!hasSession && !isPublicEndpoint(endpoint)) {
      setState("error");
      setError("Sign in to fetch private account data.");
      setData(null);
      return;
    }
    setState("loading");
    setError("");
    setNotice("");
    try {
      const result = await apiRequest<unknown>(endpoint);
      setData(result);
      setState("ready");
    } catch (reason) {
      setState("error");
      setError(reason instanceof Error ? reason.message : "The API request failed.");
    }
  }, [endpoint, hasSession, mutationOnly]);

  useEffect(() => { void load(); }, [load]);

  async function submitAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasSession) {
      setError("Sign in before sending changes to your account.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const selectedEndpoint = String(form.get("endpoint") ?? action?.endpoint ?? endpoint);
    const method = String(form.get("method") ?? action?.method ?? "POST");
    const body = selectedEndpoint === "/support/tickets/"
      ? JSON.stringify({
        category: String(form.get("category") ?? ""),
        priority: String(form.get("priority") ?? "medium"),
        subject: String(form.get("subject") ?? "").trim(),
        description: String(form.get("description") ?? "").trim(),
        attachment_url: String(form.get("attachment_url") ?? "").trim(),
      })
      : String(form.get("body") ?? "{}");
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest<unknown>(selectedEndpoint, {
        method,
        body: method === "GET" ? undefined : body,
      });
      setData(result);
      if (isRecord(result)) setActionResponse(result);
      setNotice("The API accepted the request.");
      setShowAction(false);
      if (!mutationOnly) await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The API rejected the request.");
    } finally {
      setBusy(false);
    }
  }

  const records = useMemo(() => normaliseList(data), [data]);
  const filteredRecords = useMemo(() => records.filter(record => !query || JSON.stringify(record).toLowerCase().includes(query.toLowerCase())), [records, query]);
  const pageEndpoint = endpoint ?? "—";
  const displayError = !hasSession && !isPublicEndpoint(pageEndpoint)
    ? "Sign in to fetch private account data."
    : error;
  const kind = pageKind(role, slug, child);

  return <>
    <header className="resource-page-heading"><div><span className="eyebrow">{role === "student" ? "STUDENT SPACE" : "TEACHER SPACE"}{childItem ? ` · ${item?.label.toUpperCase()}` : ""}</span><h1>{pageTitle}</h1><p>{pageDescription(role, slug, child, identifier)}</p></div><div className="resource-heading-actions">
      {action && !mutationOnly && <button className="button button-primary" type="button" onClick={() => setShowAction(value => !value)}><Plus size={15} /> {action.label}</button>}
      {!mutationOnly && <button className="icon-button" type="button" aria-label="Refresh live data" onClick={() => void load()}><RefreshCw size={15} /></button>}
    </div></header>
    <div className="live-endpoint-bar"><span className={`endpoint-pip ${state}`} /><span>{state === "loading" ? "Fetching from backend" : state === "error" ? "Backend request needs attention" : mutationOnly ? "Action endpoint" : "Live backend data"}</span><code>{action && mutationOnly ? action.method : "GET"} {pageEndpoint}</code></div>
    <PageFeedback state={state} error={displayError} hasSession={hasSession} onRetry={() => void load()} />
    {error && state !== "error" && <div className="inline-error" role="alert"><CircleAlert size={15} />{error}</div>}
    {notice && <div className="success-banner"><Check size={15} />{notice}</div>}
    {showAction && action && hasSession && <ApiActionForm action={action} busy={busy} onSubmit={submitAction} onCancel={() => setShowAction(false)} />}
    {!mutationOnly && <div className="resource-toolbar"><label className="list-search"><Search size={15} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${pageTitle.toLowerCase()}…`} /></label><span className="resource-result-count">{state === "ready" ? `${filteredRecords.length} result${filteredRecords.length === 1 ? "" : "s"}` : ""}</span></div>}
    {slug === "tests" && role === "student" && child !== "result" && child !== "history" && <TestsList records={filteredRecords} state={state} onSelect={record => setDetail(record)} hasSession={hasSession} onError={setError} />}
    {slug === "tests" && role === "student" && child === "history" && <TestHistoryList records={filteredRecords} state={state} />}
    {slug === "live-classes" && child === "manage" && <LiveClassManager role={role} record={records[0] ?? null} state={state} onError={setError} onRefresh={() => void load()} />}
    {slug === "live-classes" && !mutationOnly && child !== "manage" && <LiveClassList role={role} records={filteredRecords} state={state} allowJoin={child !== "history" && child !== "batch"} onSelect={record => setDetail(record)} onError={setError} onRefresh={() => void load()} />}
    {slug === "batches" && role === "teacher" && child !== "manage" && child !== "create" && <BatchList records={filteredRecords} state={state} role={role} section={section} />}
    {slug === "discover" && !child && <BatchList records={filteredRecords} state={state} role="student" section={section} />}
    {slug === "my-courses" && <EnrollmentList records={filteredRecords} state={state} />}
    {slug === "students" && <TeacherStudentList records={filteredRecords} state={state} section={section} onSelect={record => setDetail(record)} />}
    {kind === "standard" && <RecordList records={filteredRecords} state={state} pageTitle={pageTitle} onSelect={record => setDetail(record)} />}
    {slug === "discover" && child === "batch" && records[0] && <BatchDetails record={records[0]} hasSession={hasSession} onError={setError} />}
    {slug === "discover" && child === "compare" && <BatchCompare records={filteredRecords} onError={setError} />}
    {slug === "tests" && child === "result" && <TestResult record={firstObject(data)} state={state} />}
    {slug === "doubts" && child === "thread" && <DoubtThread record={firstObject(data)} />}
    {slug === "batches" && child === "manage" && <RecordList records={records} state={state} pageTitle={pageTitle} onSelect={setDetail} />}
    {!mutationOnly && <div className="endpoint-note"><span>Live endpoint</span><code>{pageEndpoint}</code></div>}
    {detail && <RecordDialog record={detail} onClose={() => setDetail(null)} />}
    {actionResponse && <RecordDialog record={actionResponse} title="Backend response" onClose={() => setActionResponse(null)} />}
  </>;
}

function pageDescription(role: PortalRole, slug: string, child?: string, identifier?: string) {
  if (slug === "students" && child === "roster") return `Currently enrolled students for batch ${identifier}.`;
  if (slug === "discover" && child === "batch") return `Full batch information, syllabus, schedule, and enrollment status.`;
  const text = descriptions[slug] ?? "Live information from your LGION account.";
  if (child) return `${childItemTitle(child)} · ${text}`;
  return text;
}

function childItemTitle(child: string) {
  return titleCase(child).toLowerCase();
}

function pageKind(role: PortalRole, slug: string, child?: string) {
  if (slug === "tests" && child === "result") return "result";
  if (role === "teacher" && slug === "tests") return "standard";
  if (slug === "tests") return "tests";
  if (slug === "live-classes" && child === "manage") return "class-manager";
  if (slug === "live-classes" && (!child || ["upcoming", "history", "batch"].includes(child))) return "classes";
  if (slug === "batches" && child === "manage") return "batch-detail";
  if (slug === "batches" && role === "teacher") return "batches";
  if (slug === "students" && role === "teacher") return "students";
  if (slug === "discover" && child === "batch") return "batch-detail";
  if (slug === "discover" && child === "compare") return "batch-compare";
  if (slug === "discover" && !child) return "batches";
  if (slug === "my-courses") return "enrollments";
  if (slug === "doubts" && child === "thread") return "thread";
  return "standard";
}

function normaliseList(value: unknown): ApiRecord[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (!isRecord(value)) return [];
  const candidate = value.results ?? value.data ?? value.attempts ?? value.questions ?? value.items;
  if (Array.isArray(candidate)) return candidate.filter(isRecord);
  return Object.keys(value).length ? [value] : [];
}

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function firstObject(value: unknown): ApiRecord | null {
  if (!isRecord(value)) return null;
  return value;
}

function recordTitle(record: ApiRecord) {
  const batch = isRecord(record.batch) ? record.batch : null;
  const course = isRecord(record.course) ? record.course : null;
  return displayValue(record.title ?? record.full_name ?? record.student_name ?? record.test_title ?? record.name ?? batch?.title ?? course?.title ?? record.subject ?? record.email, "Untitled");
}

function secondaryText(record: ApiRecord) {
  const course = isRecord(record.course) ? displayValue(record.course.title) : "";
  const teacher = isRecord(record.primary_teacher) ? displayValue(record.primary_teacher.full_name) : "";
  const fields = [record.batch_title, course, teacher, record.status, record.scheduled_start, record.category, record.created_at, record.enrolled_at].filter(Boolean);
  return fields.map(value => displayValue(value)).join(" · ") || "From your LGION account";
}

function iconForRecord(record: ApiRecord) {
  if (record.scheduled_start) return <Video size={16} />;
  if (record.student_name || record.total_students !== undefined) return <Users size={16} />;
  if (record.amount !== undefined || record.amount_paid !== undefined) return <CreditCard size={16} />;
  if (record.text_content || record.reply_count !== undefined) return <MessageCircle size={16} />;
  if (record.title) return <BookOpen size={16} />;
  return <FileText size={16} />;
}

function PageFeedback({ state, error, hasSession, onRetry }: { state: LoadState; error: string; hasSession: boolean; onRetry: () => void }) {
  if (state === "loading") return <div className="api-loading"><span className="spinner" /> Loading live data from the LGION backend…</div>;
  if (state !== "error" || !error) return null;
  const needsLogin = !hasSession || /token|authentication|credentials|sign in/i.test(error);
  return <div className="api-error" role="alert"><span className="api-error-icon"><CircleAlert size={17} /></span><div><b>{needsLogin ? "Sign in required" : "Could not load live data"}</b><p>{needsLogin ? "Sign in to fetch private batches, enrollments, classes, and account data." : error}</p></div>{needsLogin ? <Link className="button button-primary" href="/login">Sign in <ArrowRight size={14} /></Link> : <button className="button button-light" onClick={onRetry} type="button"><RefreshCw size={14} /> Retry</button>}</div>;
}

function RecordList({ records, state, pageTitle, onSelect }: { records: ApiRecord[]; state: LoadState; pageTitle: string; onSelect: (record: ApiRecord) => void }) {
  if (state === "loading" || state === "error") return null;
  if (!records.length) return <EmptyCollection title={pageTitle} />;
  return <div className="live-record-list">{records.map((record, index) => <article className="live-record-card" key={String(record.public_id ?? record.id ?? index)}><div className="live-record-icon">{iconForRecord(record)}</div><div className="live-record-main"><span className="record-kicker">{displayValue(record.category ?? record.status ?? record.type, "LGION RECORD")}</span><h2>{recordTitle(record)}</h2><p>{secondaryText(record)}</p><p className="record-description">{displayValue(record.description ?? record.text_content ?? record.comment, "")}</p></div><button className="button button-light record-detail-button" type="button" onClick={() => onSelect(record)}>Details <ArrowRight size={14} /></button></article>)}</div>;
}

function EmptyCollection({ title }: { title: string }) {
  return <div className="empty-state"><div className="empty-orbit"><BookOpen size={24} /></div><span className="eyebrow">LIVE ACCOUNT DATA</span><h2>No {title.toLowerCase()} returned.</h2><p>This page is connected to the backend. When your account has matching records, they will appear here.</p></div>;
}

function BatchList({ records, state, role, section }: { records: ApiRecord[]; state: LoadState; role: PortalRole; section: string[] }) {
  if (state === "loading" || state === "error") return null;
  if (!records.length) return <EmptyCollection title="batches" />;
  return <div className="live-record-list">{records.map((record, index) => {
    const slug = displayValue(record.slug, "");
    const identifier = slug;
    const course = isRecord(record.course) ? record.course : null;
    const teacher = isRecord(record.primary_teacher) ? record.primary_teacher : null;
    const detailPath = role === "teacher" ? routeFor(role, "batches", `manage/${identifier}`) : routeFor(role, "discover", `batch/${slug}`);
    return <article className="live-record-card batch-record-card" key={String(record.public_id ?? index)}><div className="live-record-icon"><GraduationCap size={18} /></div><div className="live-record-main"><span className="record-kicker">{displayValue(course?.category ?? record.status, "BATCH")}</span><h2>{recordTitle(record)}</h2><p>{[displayValue(course?.title, ""), displayValue(teacher?.full_name, ""), displayValue(record.language, ""), record.seats_available !== undefined ? `${displayValue(record.seats_available)} seats available` : ""].filter(Boolean).join(" · ")}</p><p className="record-description">{displayValue(record.description, "")}</p>{record.effective_price !== undefined && <strong className="record-price">{displayValue(record.effective_price)}</strong>}</div><div className="record-actions">{role === "teacher" && section[0] === "students" ? <Link className="button button-primary" href={routeFor(role, "students", `roster/${identifier}`)}>View roster <Users size={14} /></Link> : <Link className="button button-primary" href={detailPath}>{role === "teacher" ? "Manage batch" : "View batch"} <ArrowRight size={14} /></Link>}</div></article>;
  })}</div>;
}

function EnrollmentList({ records, state }: { records: ApiRecord[]; state: LoadState }) {
  if (state === "loading" || state === "error") return null;
  if (!records.length) return <EmptyCollection title="enrollments" />;
  return <div className="live-record-list">{records.map((record,index) => {
    const batch = isRecord(record.batch) ? record.batch : {};
    const slug = typeof batch.slug === "string" ? batch.slug : "";
    const classHistoryHref = slug ? routeFor("student", "live-classes", `batch/${slug}`) : "";
    return <article className="live-record-card" key={String(record.public_id ?? index)}><div className="live-record-icon"><BookOpen size={17} /></div><div className="live-record-main"><span className="record-kicker">{record.is_active ? "ACTIVE ENROLLMENT" : "PAST ENROLLMENT"}</span><h2>{displayValue(batch.title, "Enrolled batch")}</h2><p>{[displayValue(record.enrolled_at), displayValue(record.expires_at), `Paid ${displayValue(record.amount_paid)}`].filter(Boolean).join(" · ")}</p></div><div className="record-actions">{classHistoryHref && <Link className="button button-light" href={classHistoryHref}>Class history <CalendarDays size={14} /></Link>}<Link className="button button-primary" href="/student/live-classes">Upcoming classes <ArrowRight size={14} /></Link></div></article>;
  })}</div>;
}

function TestHistoryList({ records, state }: { records: ApiRecord[]; state: LoadState }) {
  if (state === "loading" || state === "error") return null;
  if (!records.length) return <EmptyCollection title="test attempts" />;
  return <div className="live-record-list">{records.map((record, index) => {
    const attemptId = String(record.public_id ?? record.attempt_id ?? record.id ?? "");
    return <article className="live-record-card" key={attemptId || index}>
      <div className="live-record-icon"><FileText size={17} /></div>
      <div className="live-record-main"><span className="record-kicker">{displayValue(record.status, "TEST ATTEMPT")}</span><h2>{displayValue(record.test_title ?? record.title, "Test attempt")}</h2><p>{[formatDate(record.started_at), displayValue(record.total_score), displayValue(record.accuracy_percent)].filter(Boolean).join(" · ")}</p></div>
      {attemptId && <Link className="button button-primary" href={routeFor("student", "tests", `attempts/${attemptId}`)}>View result <ArrowRight size={14} /></Link>}
    </article>;
  })}</div>;
}

function BatchCompare({ records, onError }: { records: ApiRecord[]; onError: (message: string) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [results, setResults] = useState<ApiRecord[]>([]);
  const [busy, setBusy] = useState(false);
  async function compare() {
    if (selected.length < 2 || selected.length > 4) {
      onError("Choose between two and four batches to compare.");
      return;
    }
    setBusy(true);
    onError("");
    try {
      const response = await apiRequest<unknown>(`/batches/compare/?slugs=${encodeURIComponent(selected.join(","))}`);
      setResults(normaliseList(response));
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : "Batch comparison failed.");
    } finally {
      setBusy(false);
    }
  }
  return <section className="compare-panel"><div><span className="eyebrow">COMPARE PUBLISHED BATCHES</span><h2>Choose batches from the live catalogue</h2><p>Compare requires 2–4 batch slugs. Options below are fetched from the batch endpoint.</p></div><div className="compare-options">{records.map(record => {
    const slug = String(record.slug ?? "");
    return <label key={slug}><input type="checkbox" checked={selected.includes(slug)} onChange={event => setSelected(old => event.target.checked ? [...old, slug].slice(-4) : old.filter(item => item !== slug))} />{recordTitle(record)}</label>;
  })}</div><button className="button button-primary" type="button" disabled={busy || records.length === 0} onClick={() => void compare()}>{busy ? "Comparing…" : "Compare selected batches"} <ArrowRight size={14} /></button>{results.length > 0 && <div className="compare-results">{results.map((record,index)=><RecordList records={[record]} state="ready" pageTitle={`Batch ${index+1}`} key={String(record.public_id??index)} onSelect={()=>{}} />)}</div>}</section>;
}

function TeacherStudentList({ records, state, section, onSelect }: { records: ApiRecord[]; state: LoadState; section: string[]; onSelect: (record: ApiRecord) => void }) {
  if (section[1] === "roster") return <RecordList records={records} state={state} pageTitle="Students" onSelect={onSelect} />;
  return <BatchList records={records} state={state} role="teacher" section={section} />;
}

function TestsList({ records, state, onSelect, hasSession, onError }: { records: ApiRecord[]; state: LoadState; onSelect: (record: ApiRecord) => void; hasSession: boolean; onError: (message: string) => void }) {
  const [starting, setStarting] = useState("");
  const [attempt, setAttempt] = useState<ApiRecord | null>(null);
  if (state === "loading" || state === "error") return null;
  if (!records.length) return <EmptyCollection title="tests" />;
  async function start(testId: string) {
    if (!hasSession) {
      onError("Sign in before starting a test.");
      return;
    }
    setStarting(testId);
    onError("");
    try {
      const response = await apiRequest<ApiRecord>(`/tests/${testId}/start/`, { method: "POST", body: "{}" });
      const attemptId = String(response.attempt_id);
      const test = await apiRequest<ApiRecord>(`/tests/${testId}/questions/`);
      setAttempt({ ...test, attempt_id: attemptId });
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : "The test could not be started.");
    } finally {
      setStarting("");
    }
  }
  return <>
    <div className="live-record-list">{records.map((record, index) => <article className="live-record-card" key={String(record.public_id ?? index)}><div className="live-record-icon"><FileText size={17} /></div><div className="live-record-main"><span className="record-kicker">{displayValue(record.test_type, "TEST")}</span><h2>{recordTitle(record)}</h2><p>{[displayValue(record.chapter_title, ""), `${displayValue(record.duration_minutes)} min`, `${displayValue(record.total_marks)} marks`, `Attempts: ${displayValue(record.max_attempts_allowed)}`].join(" · ")}</p><p className="record-description">{record.has_attempted ? "You have attempted this test before." : "This test is available to your account."}</p></div><div className="record-actions"><button className="button button-light" type="button" onClick={() => onSelect(record)}>Details</button>{typeof record.public_id === "string" && <button className="button button-primary" type="button" disabled={starting === record.public_id} onClick={() => void start(String(record.public_id))}>{starting === record.public_id ? "Starting…" : "Start test"} <ArrowRight size={14} /></button>}</div></article>)}</div>
    {attempt && <TestAttempt record={attempt} onClose={() => setAttempt(null)} onError={onError} />}
  </>;
}

function TestAttempt({ record, onClose, onError }: { record: ApiRecord; onClose: () => void; onError: (message: string) => void }) {
  const questions = Array.isArray(record.questions) ? record.questions.filter(isRecord) : [];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  async function submit() {
    setSubmitting(true);
    onError("");
    try {
      for (const question of questions) {
        const id = String(question.public_id ?? "");
        if (!id) continue;
        await apiRequest(`/tests/attempts/${String(record.attempt_id)}/answer/`, {
          method: "POST",
          body: JSON.stringify({
            test_question_id: id,
            selected_answer: answers[id] ?? null,
            mark_status: answers[id] ? "answered" : "not_answered",
            time_spent_seconds: 0,
          }),
        });
      }
      await apiRequest(`/tests/attempts/${String(record.attempt_id)}/submit/`, { method: "POST", body: "{}" });
      onClose();
      window.location.assign(`/student/tests/attempts/${String(record.attempt_id)}/result`);
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : "The test could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }
  return <div className="record-modal-backdrop"><section className="record-modal test-attempt-dialog" role="dialog" aria-modal="true"><button className="record-modal-close" type="button" aria-label="Close test" onClick={onClose}>×</button><span className="eyebrow">LIVE TEST · SAVED TO YOUR ATTEMPT</span><h2>{displayValue(record.title, "Your test")}</h2>{record.instructions !== undefined && record.instructions !== null ? <p>{displayValue(record.instructions)}</p> : null}<div className="test-question-list">{questions.map((question, index) => {
    const nested = isRecord(question.question) ? question.question : question;
    const id = String(question.public_id ?? "");
    return <div className="test-question" key={id || index}><span>QUESTION {index + 1}</span><p>{displayValue(nested.question_text)}</p>{Array.isArray(nested.options) && <div className="test-options">{nested.options.map((option, optionIndex) => {
      const optionValue = isRecord(option) ? String(option.id ?? option.text ?? optionIndex) : String(option);
      const label = isRecord(option) ? String(option.text ?? option.label ?? option.id) : String(option);
      return <label key={optionValue}><input type="radio" name={id} value={optionValue} checked={answers[id] === optionValue} onChange={() => setAnswers(current => ({ ...current, [id]: optionValue }))} />{label}</label>;
    })}</div>}</div>;
  })}</div><button className="button button-primary" type="button" disabled={submitting} onClick={() => void submit()}>{submitting ? "Submitting…" : "Submit test"} <ArrowRight size={14} /></button></section></div>;
}

function BatchDetails({ record, hasSession, onError }: { record: ApiRecord; hasSession: boolean; onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [paymentState, setPaymentState] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [paymentMessage, setPaymentMessage] = useState("");
  const schedules = Array.isArray(record.schedules) ? record.schedules.filter(isRecord) : [];

  const batchId = String(record.public_id ?? "");
  const batchPrice = record.effective_price ?? record.price;

  useEffect(() => {
    const check = () => setCheckoutReady(typeof window !== "undefined" && typeof getRazorpay() === "function");
    check();
    const timer = window.setInterval(check, 300);
    return () => window.clearInterval(timer);
  }, []);

  async function createOrder() {
    if (!hasSession) {
      onError("Sign in before enrolling in a batch.");
      return;
    }
    if (!batchId) {
      onError("This batch does not have a valid public ID.");
      return;
    }
    if (typeof window === "undefined" || typeof getRazorpay() !== "function") {
      onError("Razorpay Checkout is still loading. Please wait a moment and try again.");
      return;
    }

    setBusy(true);
    setPaymentState("idle");
    setPaymentMessage("");
    onError("");

    try {
      // IMPORTANT: the backend calculates the authoritative batch price.
      // The frontend sends only the purchase type and batch ID.
      const order = await apiRequest<ApiRecord>("/payments/orders/create/", {
        method: "POST",
        body: JSON.stringify({
          purchase_type: "batch_enrollment",
          batch_id: batchId,
        }),
      });

      const orderId = String(order.order_id ?? order.razorpay_order_id ?? "");
      const key = String(order.key ?? "");
      const currency = String(order.currency ?? "INR");
      const amountRupees = Number(order.amount);
      const amountPaise = Number.isFinite(amountRupees) && amountRupees > 0
        ? Math.round(amountRupees * 100)
        : 0;

      if (!orderId || !key || !amountPaise) {
        throw new Error("The payment order response is incomplete. Please try again.");
      }

      const Razorpay = getRazorpay();
    if (!Razorpay) {
      onError("Razorpay Checkout is not available. Please refresh and try again.");
      setBusy(false);
      return;
    }

    const razorpay = new Razorpay({
        key,
        amount: amountPaise,
        currency,
        name: "LGIONRISE",
        description: `Batch enrollment: ${recordTitle(record)}`,
        order_id: orderId,
        prefill: {
          name: String(record.user_name ?? ""),
          email: String(record.user_email ?? ""),
          contact: String(record.user_phone ?? ""),
        },
        notes: {
          batch_id: batchId,
          purchase_type: "batch_enrollment",
        },
        theme: {
          color: "#2F6BFF",
        },
        modal: {
          ondismiss: () => {
            if (paymentState !== "verifying" && paymentState !== "success") {
              setBusy(false);
              setPaymentMessage("Payment window closed. No payment was submitted.");
            }
          },
        },
        handler: async (response) => {
          setPaymentState("verifying");
          setPaymentMessage("Payment received. Verifying payment and activating your enrollment…");
          setBusy(true);
          onError("");

          try {
            // The backend verifies the Razorpay signature and synchronously
            // activates the Enrollment before returning success.
            await apiRequest("/payments/orders/verify/", {
              method: "POST",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            setPaymentState("success");
            setPaymentMessage("Payment verified and your batch enrollment is active.");
            setBusy(false);

            window.setTimeout(() => {
              window.location.assign(`/student/discover/batch/${batchId}`);
            }, 1200);
          } catch (reason) {
            setPaymentState("error");
            setBusy(false);
            const message = reason instanceof Error
              ? reason.message
              : "Payment was received, but verification failed. Please contact support with your Razorpay payment reference.";
            setPaymentMessage(message);
            onError(message);
          }
        },
      });

      razorpay.open();
    } catch (reason) {
      setBusy(false);
      const message = reason instanceof Error ? reason.message : "The checkout order could not be created.";
      setPaymentState("error");
      setPaymentMessage(message);
      onError(message);
    }
  }

  return <>
    <Script
      src="https://checkout.razorpay.com/v1/checkout.js"
      strategy="afterInteractive"
      onLoad={() => setCheckoutReady(true)}
    />
    <section className="batch-detail-panel">
      <div className="batch-detail-main">
        <span className="eyebrow">BATCH DETAILS FROM API</span>
        <h2>{recordTitle(record)}</h2>
        <p>{displayValue(record.description, "No description provided.")}</p>
        <dl className="batch-facts">
          {["language", "effective_price", "validity_start", "validity_end", "seats_available", "average_rating"]
            .filter(key => record[key] !== undefined)
            .map(key => <div key={key}><dt>{titleCase(key.replaceAll("_", "-"))}</dt><dd>{displayValue(record[key])}</dd></div>)}
        </dl>
        <button
          type="button"
          className="button button-primary"
          disabled={busy || !checkoutReady}
          onClick={() => void createOrder()}
        >
          {busy ? "Processing payment…" : !checkoutReady ? "Loading secure checkout…" : "Enroll & Pay with Razorpay"}
          {busy ? <LoaderCircle size={14} className="spin" /> : <CreditCard size={14} />}
        </button>
        {batchPrice !== undefined && (
          <small className="form-help">Final amount is calculated by the server at checkout.</small>
        )}
        {paymentMessage && (
          <div className={`payment-status payment-status-${paymentState}`} role={paymentState === "error" ? "alert" : "status"}>
            {paymentState === "success" ? <Check size={16} /> : paymentState === "error" ? <CircleAlert size={16} /> : paymentState === "verifying" ? <LoaderCircle size={16} className="spin" /> : null}
            <span>{paymentMessage}</span>
          </div>
        )}
      </div>
      <div className="batch-schedule">
        <h3><CalendarDays size={16} /> Schedule</h3>
        {schedules.length
          ? schedules.map((slot, index) => <p key={String(slot.public_id ?? index)}>{displayValue(slot.day_of_week)} · {displayValue(slot.start_time)}–{displayValue(slot.end_time)} · {displayValue(slot.subject)}</p>)
          : <p>No schedule slots returned.</p>}
      </div>
    </section>
  </>;
}
function TestResult({ record, state }: { record: ApiRecord | null; state: LoadState }) {
  if (state === "loading") return null;
  if (!record) return <EmptyCollection title="test result" />;
  const responses = Array.isArray(record.responses) ? record.responses.filter(isRecord) : [];
  return <section className="result-panel"><span className="eyebrow">YOUR TEST RESULT</span><h2>{displayValue(record.test_title)}</h2><div className="result-metrics">{["total_score", "accuracy_percent", "rank_in_batch", "percentile"].map(key => <div key={key}><span>{titleCase(key.replaceAll("_", "-"))}</span><b>{displayValue(record[key])}</b></div>)}</div><h3>Question review</h3>{responses.map((response,index)=><article className="result-question" key={String(response.public_id ?? index)}><b>{index + 1}. {displayValue(response.question_text)}</b><p>Your answer: {displayValue(response.selected_answer)}</p><p>Correct answer: {displayValue(response.correct_answer)}</p><p>{displayValue(response.solution_text)}</p></article>)}</section>;
}

function DoubtThread({ record }: { record: ApiRecord | null }) {
  if (!record) return <EmptyCollection title="doubt replies" />;
  const replies = Array.isArray(record.replies) ? record.replies.filter(isRecord) : [];
  return <section className="result-panel"><span className="eyebrow">DOUBT THREAD</span><h2>{displayValue(record.text_content)}</h2><p>Status: {displayValue(record.status)}</p><div className="thread-replies">{replies.map((reply,index)=><article className="thread-reply" key={String(reply.public_id ?? index)}><b>{displayValue(reply.sender_name)}</b><p>{displayValue(reply.text_content)}</p><small>{formatDate(reply.created_at)}</small></article>)}</div></section>;
}

function ApiActionForm({ action, busy, onSubmit, onCancel }: { action: NonNullable<ReturnType<typeof actionFor>>; busy: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  const isSupportTicket = action.endpoint === "/support/tickets/";
  return <form className={`action-form live-action-form${isSupportTicket ? " support-ticket-form" : ""}`} onSubmit={onSubmit}><div className="action-form-heading"><div><span className="eyebrow">{isSupportTicket ? "WE'RE HERE TO HELP" : "SEND A REAL REQUEST"}</span><h2>{action.label}</h2></div>{action.method === "POST" && <span className="endpoint-method">{action.method}</span>}</div><input type="hidden" name="endpoint" value={action.endpoint} /><input type="hidden" name="method" value={action.method} />{isSupportTicket ? <><p>Tell us what happened. We’ll send your request securely to the support team.</p><div className="support-ticket-fields"><label>What do you need help with?<select name="category" defaultValue="" required><option value="" disabled>Select a category</option><option value="technical">Technical issue</option><option value="payment">Payment</option><option value="content">Course or content</option><option value="account">Account</option></select></label><label>How urgent is it?<select name="priority" defaultValue="medium" required><option value="low">Low</option><option value="medium">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label><label className="support-ticket-wide">Subject<input name="subject" type="text" maxLength={255} placeholder="Briefly describe the issue" required /></label><label className="support-ticket-wide">Details<textarea name="description" rows={5} placeholder="Share the details so we can help you faster" required /></label><label className="support-ticket-wide">Attachment link <span>Optional</span><input name="attachment_url" type="url" placeholder="https://…" /></label></div><p>Your ticket will be submitted automatically. No JSON or technical details needed.</p></> : <><label>JSON request body <span>Required fields depend on this endpoint</span></label><textarea name="body" defaultValue={action.payload} rows={7} spellCheck={false} required /><p>Data is sent directly to the configured Django API. The server response or validation errors will be shown here.</p></>}<div className="action-form-buttons"><button className="button button-primary" type="submit" disabled={busy || !action.endpoint}>{busy ? "Sending…" : isSupportTicket ? "Send support ticket" : "Send request"} {busy ? <LoaderCircle size={14} className="spin" /> : <ArrowRight size={14} />}</button><button className="button button-light" type="button" onClick={onCancel}>Cancel</button></div></form>;
}

function RecordDialog({ record, title, onClose }: { record: ApiRecord; title?: string; onClose: () => void }) {
  return <div className="record-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section className="record-modal" role="dialog" aria-modal="true"><button className="record-modal-close" type="button" aria-label="Close details" onClick={onClose}>×</button><span className="eyebrow">LIVE API RESPONSE</span><h2>{title ?? recordTitle(record)}</h2><div className="record-fields">{Object.entries(record).filter(([,value])=>value!==null&&value!==undefined).map(([key,value])=><div key={key}><span>{key.replaceAll("_"," ")}</span><p>{typeof value === "object" ? JSON.stringify(value) : displayValue(value)}</p></div>)}</div><button className="button button-primary" type="button" onClick={onClose}>Close <Check size={14} /></button></section></div>;
}

function NotFound({ role }: { role: PortalRole }) {
  return <section className="empty-state"><div className="empty-orbit"><CircleAlert size={24} /></div><span className="eyebrow">PAGE NOT FOUND</span><h2>This page isn’t in your {role} space.</h2><Link className="button button-primary" href={routeFor(role, "dashboard")}>Back to overview <ArrowRight size={14} /></Link></section>;
}

function formatDate(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}
