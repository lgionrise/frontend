"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, LoaderCircle, Users, Video } from "lucide-react";
import { apiRequest, displayValue, type ApiRecord } from "@/lib/api";
import { routeFor, type PortalRole } from "@/lib/navigation";
import { AgoraClassroom } from "@/components/features/agora-classroom";

type LoadState = "loading" | "ready" | "error";

type LiveClassListProps = {
  role: PortalRole;
  records: ApiRecord[];
  state: LoadState;
  allowJoin: boolean;
  onSelect: (record: ApiRecord) => void;
  onError: (message: string) => void;
  onRefresh: () => void;
};

export function LiveClassList({ role, records, state, allowJoin, onSelect, onError, onRefresh }: LiveClassListProps) {
  const [busyId, setBusyId] = useState("");
  const [response, setResponse] = useState<ApiRecord | null>(null);
  const [roomClassId, setRoomClassId] = useState("");
  const [confirmEndId, setConfirmEndId] = useState("");

  if (state === "loading" || state === "error") return null;
  if (!records.length) return <EmptyClasses />;

  async function join(publicId: string) {
    setBusyId(publicId);
    onError("");
    try {
      const result = await apiRequest<ApiRecord>(`/live-classes/${publicId}/join/`, { method: "POST", body: "{}" });
      setResponse(result);
      setRoomClassId(publicId);
      onRefresh();
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : "Could not join this class.");
    } finally {
      setBusyId("");
    }
  }

  async function end(publicId: string) {
    setBusyId(publicId);
    onError("");
    try {
      await apiRequest(`/live-classes/${publicId}/end/`, { method: "POST", body: "{}" });
      setResponse(null);
      setRoomClassId("");
      setConfirmEndId("");
      onRefresh();
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : "Could not end this class.");
    } finally {
      setBusyId("");
    }
  }

  return <>
    <div className="live-record-list">{records.map((record, index) => {
      const publicId = typeof record.public_id === "string" ? record.public_id : "";
      const isLive = String(record.status ?? "").toLowerCase() === "live";
      const manageHref = routeFor("teacher", "live-classes", `manage/${publicId}`);
      return <article className="live-record-card" key={publicId || index}>
        <div className="live-record-icon live-class-icon"><Video size={18} /></div>
        <div className="live-record-main">
          <span className="record-kicker">{displayValue(record.status, "LIVE CLASS")}</span>
          <h2>{titleOf(record)}</h2>
          <p>{[displayValue(record.subject, ""), displayValue(record.batch_title, ""), displayValue(record.teacher_name, ""), formatDate(record.scheduled_start)].filter(Boolean).join(" · ")}</p>
          {typeof record.description === "string" && record.description && <p className="record-description">{record.description}</p>}
        </div>
        <div className="record-actions">
          {role === "teacher" && publicId
            ? <Link className="button button-light" href={manageHref}>Manage</Link>
            : <button className="button button-light" type="button" onClick={() => onSelect(record)}>Details</button>}
          {allowJoin && publicId && <button className="button button-primary" type="button" disabled={busyId === publicId} onClick={() => void join(publicId)}>
            {busyId === publicId ? <LoaderCircle size={14} className="spin" /> : role === "teacher" ? "Start / join" : "Join class"} <ArrowRight size={14} />
          </button>}
          {role === "teacher" && isLive && publicId && (confirmEndId === publicId
            ? <><button className="button button-danger" type="button" disabled={busyId === publicId} onClick={() => void end(publicId)}>{busyId === publicId ? "Ending…" : "Confirm end"}</button><button className="button button-light" type="button" onClick={() => setConfirmEndId("")}>Keep live</button></>
            : <button className="button button-danger" type="button" onClick={() => setConfirmEndId(publicId)}>End class</button>)}
        </div>
      </article>;
    })}</div>
    {response && roomClassId && <AgoraClassroom role={role} classId={roomClassId} credentials={response} onError={onError} onClose={() => { setResponse(null); setRoomClassId(""); }} />}
  </>;
}

type LiveClassManagerProps = {
  role: PortalRole;
  record: ApiRecord | null;
  state: LoadState;
  onError: (message: string) => void;
  onRefresh: () => void;
};

export function LiveClassManager({ role, record, state, onError, onRefresh }: LiveClassManagerProps) {
  const [busy, setBusy] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [response, setResponse] = useState<ApiRecord | null>(null);

  if (state === "loading" || state === "error" || !record) return null;
  const publicId = typeof record.public_id === "string" ? record.public_id : "";
  const isLive = String(record.status ?? "").toLowerCase() === "live";
  const isScheduled = String(record.status ?? "").toLowerCase() === "scheduled";

  async function startOrJoin() {
    if (!publicId) return;
    setBusy(true);
    onError("");
    try {
      const result = await apiRequest<ApiRecord>(`/live-classes/${publicId}/join/`, { method: "POST", body: "{}" });
      setResponse(result);
      onRefresh();
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : "Could not start or join this class.");
    } finally {
      setBusy(false);
    }
  }

  async function endClass() {
    if (!publicId || role !== "teacher") return;
    setBusy(true);
    onError("");
    try {
      await apiRequest(`/live-classes/${publicId}/end/`, { method: "POST", body: "{}" });
      setResponse(null);
      setConfirmEnd(false);
      onRefresh();
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : "Could not end this class.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="class-manager-panel">
    <span className="eyebrow">LIVE CLASS CONTROL ROOM</span>
    <h2>{titleOf(record)}</h2>
    <p className="class-manager-meta">{[displayValue(record.status), displayValue(record.batch_title), displayValue(record.subject), formatDate(record.scheduled_start)].filter(Boolean).join(" · ")}</p>
    {typeof record.description === "string" && record.description && <p>{record.description}</p>}
    <div className="record-actions">
      {(isScheduled || isLive) && publicId && <button className="button button-primary" type="button" disabled={busy} onClick={() => void startOrJoin()}>{busy ? <LoaderCircle size={14} className="spin" /> : <Video size={15} />}{role === "teacher" && isScheduled ? "Start class" : "Join class"} <ArrowRight size={14} /></button>}
      {role === "teacher" && isLive && (confirmEnd
        ? <><button className="button button-danger" type="button" disabled={busy} onClick={() => void endClass()}>{busy ? "Ending…" : "Confirm end class"}</button><button className="button button-light" type="button" onClick={() => setConfirmEnd(false)}>Cancel</button></>
        : <button className="button button-danger" type="button" onClick={() => setConfirmEnd(true)}>End class</button>)}
    </div>
    {response && <AgoraClassroom role={role} classId={publicId} credentials={response} onError={onError} onClose={() => setResponse(null)} />}
    {role === "teacher" && publicId && <div className="class-management-links">
      <Link href={routeFor(role, "live-classes", `attendance/${publicId}`)}><Users size={14} />Attendance</Link>
      <Link href={routeFor(role, "live-classes", `chat/${publicId}`)}>Class chat</Link>
      <Link href={routeFor(role, "live-classes", `polls/${publicId}`)}>Create poll</Link>
      <Link href={routeFor(role, "live-classes", `announcements/${publicId}`)}>Announcement</Link>
    </div>}
  </section>;
}

function EmptyClasses() {
  return <div className="empty-state"><div className="empty-orbit"><CalendarDays size={24} /></div><span className="eyebrow">LIVE ACCOUNT DATA</span><h2>No live classes returned.</h2><p>Classes from your real account will appear here when the backend returns them.</p></div>;
}

function titleOf(record: ApiRecord) {
  const title = record.title ?? record.name ?? record.subject;
  return typeof title === "string" && title ? title : "Live class";
}

function formatDate(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}
