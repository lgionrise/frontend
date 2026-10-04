"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Bell, ChevronDown, GraduationCap, LogOut, Menu, MoreHorizontal, Search,
} from "lucide-react";
import { apiRequest, getAccessToken, getStoredUser, type ApiRecord } from "@/lib/api";
import { PortalPageView } from "@/components/portal-pages";
import { findNavigationItem, findPageLink, navigationFor, routeFor, type PortalRole } from "@/lib/navigation";

type Props = { role: PortalRole; section: string[] };

function fullName(user: ApiRecord | null) {
  if (!user) return "";
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return name || (typeof user.email === "string" ? user.email : "");
}

export function Portal({ role, section }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<ApiRecord | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [hasSession, setHasSession] = useState(false);
  const activeSlug = section[0] || "dashboard";
  const childSlug = section[1];
  const groups = navigationFor(role);
  const activeItem = findNavigationItem(role, activeSlug);
  const activeChild = findPageLink(role, activeSlug, childSlug);
  const name = fullName(user);
  const initials = name ? name.slice(0, 1).toUpperCase() : "?";
  const activeTitle = activeChild?.label ?? activeItem?.label ?? "Page not found";
  const pageKey = useMemo(() => section.join("/"), [section]);

  useEffect(() => {
    setUser(getStoredUser());
    setHasSession(Boolean(getAccessToken()));
  }, []);

  async function logout() {
    setLogoutError("");
    try {
      const refresh = window.localStorage.getItem("lgion_refresh");
      if (refresh) await apiRequest("/auth/logout/", { method: "POST", body: JSON.stringify({ refresh }) });
    } catch (reason) {
      setLogoutError(reason instanceof Error ? reason.message : "The server session could not be revoked.");
    } finally {
      for (const key of ["lgion_access", "lgion_refresh", "lgion_user", "lgion_device"]) {
        window.localStorage.removeItem(key);
      }
      setHasSession(false);
      setUser(null);
      router.push("/login");
    }
  }

  return (
    <main className="portal-shell">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <Link className="brand sidebar-brand" href="/"><span className="brand-mark"><GraduationCap size={20} /></span> lgion<span className="brand-dot">.</span></Link>
        <div className="workspace-switch"><span className={`workspace-avatar ${role}`}>{role === "student" ? "S" : "T"}</span><span><b>{role === "student" ? "Student space" : "Teacher space"}</b><small>{role === "student" ? "Your learning" : "Your teaching"}</small></span><ChevronDown size={14} /></div>
        <nav className="sidebar-nav" aria-label={`${role} navigation`}>
          {groups.map(group => <div className="nav-group" key={group.label}>
            <span className="nav-group-label">{group.label}</span>
            {group.items.map(item => {
              const Icon = item.icon;
              const selected = activeSlug === item.slug;
              return <div className="nav-entry" key={item.slug}>
                <Link href={routeFor(role, item.slug)} onClick={() => setMobileOpen(false)} className={`sidebar-link ${selected ? "active" : ""}`} aria-current={selected && !childSlug ? "page" : undefined}>
                  <Icon size={17} strokeWidth={selected ? 2.1 : 1.8} /><span>{item.label}</span>
                </Link>
                {selected && item.children?.length ? <div className="sidebar-sublinks">{item.children.map(child => <Link key={child.slug} href={routeFor(role, item.slug, child.slug)} onClick={() => setMobileOpen(false)} className={`sidebar-sublink ${childSlug === child.slug ? "active" : ""}`} aria-current={childSlug === child.slug ? "page" : undefined}>{child.label}</Link>)}</div> : null}
              </div>;
            })}
          </div>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-streak"><span>✳</span><div><b>{role === "student" ? "Your learning, your pace" : "Your classroom, your impact"}</b><small>Live from your LGION account</small></div></div>
          <button className="sidebar-user" type="button" onClick={() => router.push(routeFor(role, role === "teacher" ? "profile" : "profile"))}><span className={`user-avatar ${role}`}>{initials}</span><span><b>{name || "Sign in to LGION"}</b><small>{hasSession ? role : "Account"}</small></span><MoreHorizontal size={18} /></button>
        </div>
      </aside>
      {mobileOpen && <button aria-label="Close navigation" className="sidebar-scrim" onClick={() => setMobileOpen(false)} />}
      <section className="portal-main">
        <header className="portal-topbar">
          <button className="mobile-menu" type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="breadcrumbs"><span>{role === "student" ? "Student space" : "Teacher space"}</span><span className="crumb-slash">/</span><b>{activeTitle}</b></div>
          <div className="topbar-actions">
            <label className="global-search"><Search size={16} /><input aria-label="Search this page" placeholder="Search this page…" /><kbd>⌘ K</kbd></label>
            <Link className="topbar-icon" aria-label="Notifications" href={routeFor(role, "notifications")}><Bell size={18} /></Link>
            <span className={`user-avatar top-avatar ${role}`}>{initials}</span>
          </div>
        </header>
        <div className="portal-content">
          {logoutError && <div className="inline-error" role="status">{logoutError}</div>}
          <PortalPageView role={role} section={section} pageKey={pageKey} hasSession={hasSession} user={user} />
        </div>
        <footer className="portal-footer"><span>LGION · Learn and grow</span>{hasSession ? <button type="button" onClick={() => void logout()}><LogOut size={14} /> Sign out</button> : <Link href="/login">Sign in <ArrowRight size={13} /></Link>}</footer>
      </section>
    </main>
  );
}
