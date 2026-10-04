"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, BookOpen, GraduationCap, Sparkles, Video } from "lucide-react";
import { apiRequest, asList, type ApiRecord } from "@/lib/api";
import { DashboardMetric, DashboardRecords, DashboardStatus } from "@/components/features/dashboard-widgets";

export function StudentDashboard({ hasSession }: { hasSession: boolean }) {
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
    const endpoints = ["/batches/my-enrollments/", "/live-classes/upcoming/", "/gamification/points/", "/gamification/streaks/"];
    const results = await Promise.allSettled(endpoints.map(endpoint => apiRequest<unknown>(endpoint)));
    const values: Record<string, unknown> = {};
    const errors: string[] = [];
    results.forEach((result, index) => {
      const key = ["enrollments", "classes", "points", "streaks"][index];
      if (result.status === "fulfilled") values[key] = result.value;
      else errors.push(result.reason instanceof Error ? result.reason.message : "A dashboard request failed.");
    });
    setData(values);
    setError(errors.join(" · "));
    setLoading(false);
  }, [hasSession]);

  useEffect(() => { void load(); }, [load]);

  const enrollments = asList(data.enrollments);
  const classes = asList(data.classes);
  const points = firstRecord(data.points);
  const streak = firstRecord(data.streaks);

  return <>
    <header className="dashboard-hero">
      <div><span className="eyebrow">YOUR LEARNING OVERVIEW</span><h1>Your learning,<br />all in one place.</h1><p>Your enrollments, live sessions, and progress—straight from your account.</p></div>
      <div className="dashboard-hero-art" aria-hidden="true"><div className="dashboard-art-circle"><GraduationCap size={51} /></div><span>✳</span></div>
      <Link className="button button-primary dashboard-primary-action" href="/student/discover">Browse batches <ArrowRight size={15} /></Link>
    </header>
    <DashboardStatus loading={loading} error={error} hasSession={hasSession} onRetry={() => void load()} />
    {hasSession && !loading && <><div className="dashboard-stats-grid">
      <DashboardMetric label="My enrollments" value={enrollments.length} icon={BookOpen} />
      <DashboardMetric label="Upcoming classes" value={classes.length} icon={Video} />
      <DashboardMetric label="Points" value={points?.total_points ?? points?.points} icon={Sparkles} />
      <DashboardMetric label="Current streak" value={streak?.current_streak ?? streak?.streak_days} icon={Activity} />
    </div><div className="dashboard-two-columns">
      <DashboardRecords title="My enrollments" eyebrow="MY LEARNING" records={enrollments} href="/student/my-courses" />
      <DashboardRecords title="Upcoming live classes" eyebrow="MY SCHEDULE" records={classes} href="/student/live-classes" />
    </div></>}
  </>;
}

function firstRecord(value: unknown): ApiRecord | null {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as ApiRecord;
  return null;
}
