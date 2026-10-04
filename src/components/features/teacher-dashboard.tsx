"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CreditCard, GraduationCap, Users, Video } from "lucide-react";
import { apiRequest, asList, type ApiRecord } from "@/lib/api";
import { DashboardMetric, DashboardRecords, DashboardStatus } from "@/components/features/dashboard-widgets";

export function TeacherDashboard({ hasSession, user }: { hasSession: boolean; user: ApiRecord | null }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<Record<string, unknown>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    if (!hasSession) {
      setData({});
      setLoading(false);
      return;
    }
    const endpoints = ["/teacher/dashboard/", "/batches/mine/", "/live-classes/upcoming/", "/doubts/", "/private-tuition/bookings/teacher/"];
    const results = await Promise.allSettled(endpoints.map(endpoint => apiRequest<unknown>(endpoint)));
    const values: Record<string, unknown> = {};
    const errors: string[] = [];
    results.forEach((result, index) => {
      const key = ["summary", "batches", "classes", "doubts", "bookings"][index];
      if (result.status === "fulfilled") values[key] = result.value;
      else errors.push(result.reason instanceof Error ? result.reason.message : "A dashboard request failed.");
    });
    setData(values);
    setError(errors.join(" · "));
    setLoading(false);
  }, [hasSession]);

  useEffect(() => { void load(); }, [load]);

  const summary = firstRecord(data.summary);
  const batches = asList(data.batches);
  const classes = asList(data.classes);
  const doubts = asList(data.doubts);
  const bookings = asList(data.bookings);
  const name = [user?.first_name, user?.last_name].filter(value => typeof value === "string" && value).join(" ");

  return <>
    <header className="dashboard-hero teacher-hero">
      <div><span className="eyebrow">TEACHING OVERVIEW</span><h1>Your classroom,<br />{name || "your way"}.</h1><p>Your classes, learners, and teaching activity—straight from your account.</p></div>
      <div className="dashboard-hero-art" aria-hidden="true"><div className="dashboard-art-circle"><GraduationCap size={51} /></div><span>✳</span></div>
      <Link className="button button-primary dashboard-primary-action" href="/teacher/batches">Open my batches <ArrowRight size={15} /></Link>
    </header>
    <DashboardStatus loading={loading} error={error} hasSession={hasSession} onRetry={() => void load()} />
    {hasSession && !loading && <><div className="dashboard-stats-grid">
      <DashboardMetric label="Students" value={summary?.total_students} icon={Users} />
      <DashboardMetric label="My batches" value={summary?.total_batches} icon={BookOpen} />
      <DashboardMetric label="Upcoming classes" value={summary?.upcoming_classes_count} icon={Video} />
      <DashboardMetric label="Monthly earnings" value={summary?.current_month_earnings} icon={CreditCard} />
    </div><div className="dashboard-two-columns">
      <DashboardRecords title="My batches" eyebrow="YOUR TEACHING" records={batches} href="/teacher/batches" />
      <DashboardRecords title="Upcoming live classes" eyebrow="YOUR SCHEDULE" records={classes} href="/teacher/live-classes" />
      <DashboardRecords title="Student questions" eyebrow="NEEDS YOUR RESPONSE" records={doubts} href="/teacher/doubts" />
      <DashboardRecords title="Private tutoring requests" eyebrow="ONE-TO-ONE LEARNING" records={bookings} href="/teacher/tutoring" />
    </div></>}
  </>;
}

function firstRecord(value: unknown): ApiRecord | null {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as ApiRecord;
  return null;
}
