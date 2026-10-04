import {
  Activity, Award, BarChart3, BookOpen, BookOpenCheck, CalendarDays, CircleHelp,
  Clapperboard, ClipboardList, CreditCard, FileText, GraduationCap, Heart,
  LayoutDashboard, LifeBuoy, Medal, MessageCircle, Settings2, ShieldCheck,
  Sparkles, Users, Video, Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PortalRole = "student" | "teacher";
export type PageLink = { label: string; slug: string; endpoint: string; method?: string };
export type NavigationItem = { label: string; slug: string; icon: LucideIcon; endpoint?: string; children?: PageLink[] };
export type NavigationGroup = { label: string; items: NavigationItem[] };

const studentNavigation: NavigationGroup[] = [
  { label: "YOUR SPACE", items: [
    { label: "Overview", slug: "dashboard", icon: LayoutDashboard },
    { label: "Explore batches", slug: "discover", icon: GraduationCap, endpoint: "/batches/", children: [
      { label: "Compare batches", slug: "compare", endpoint: "/batches/compare/" },
      { label: "Find a teacher", slug: "teachers", endpoint: "/auth/teachers/" },
      { label: "Offers & coupons", slug: "offers", endpoint: "/coupons/active-offers/" },
    ] },
    { label: "My enrollments", slug: "my-courses", icon: BookOpenCheck, endpoint: "/batches/my-enrollments/" },
    { label: "Live classes", slug: "live-classes", icon: Video, endpoint: "/live-classes/upcoming/", children: [
      { label: "Upcoming", slug: "upcoming", endpoint: "/live-classes/upcoming/" },
    ] },
    { label: "Study library", slug: "library", icon: BookOpen, endpoint: "/content/", children: [
      { label: "Bookmarks", slug: "bookmarks", endpoint: "/content/bookmarks/" },
      { label: "Folders", slug: "folders", endpoint: "/content/folders/" },
      { label: "Recordings", slug: "recordings", endpoint: "/recordings/" },
      { label: "Offline downloads", slug: "downloads", endpoint: "/offline-sync/downloads/" },
      { label: "Storage quota", slug: "storage", endpoint: "/offline-sync/storage-quota/" },
    ] },
    { label: "Tests & practice", slug: "tests", icon: ClipboardList, endpoint: "/tests/", children: [
      { label: "Test catalogue", slug: "catalogue", endpoint: "/tests/" },
      { label: "Attempt history", slug: "history", endpoint: "/tests/attempts/history/" },
    ] },
    { label: "Ask a doubt", slug: "doubts", icon: MessageCircle, endpoint: "/doubts/" },
    { label: "1:1 tutoring", slug: "tutoring", icon: CalendarDays, endpoint: "/private-tuition/teachers/", children: [
      { label: "Find a teacher", slug: "teachers", endpoint: "/private-tuition/teachers/" },
      { label: "My bookings", slug: "bookings", endpoint: "/private-tuition/bookings/mine/" },
    ] },
  ] },
  { label: "YOUR GROWTH", items: [
    { label: "Achievements", slug: "achievements", icon: Medal, endpoint: "/gamification/points/", children: [
      { label: "Points", slug: "points", endpoint: "/gamification/points/" },
      { label: "Streaks", slug: "streaks", endpoint: "/gamification/streaks/" },
      { label: "Badges", slug: "badges", endpoint: "/gamification/badges/" },
      { label: "Leaderboard", slug: "leaderboard", endpoint: "/gamification/leaderboard/" },
      { label: "Rewards", slug: "rewards", endpoint: "/gamification/rewards/" },
      { label: "Redemptions", slug: "redemptions", endpoint: "/gamification/redemptions/" },
      { label: "Study goals", slug: "goals", endpoint: "/gamification/study-goals/" },
    ] },
    { label: "Certificates", slug: "certificates", icon: Award, endpoint: "/certificates/mine/" },
    { label: "Payments", slug: "payments", icon: CreditCard, endpoint: "/payments/orders/mine/", children: [
      { label: "Orders & invoices", slug: "orders", endpoint: "/payments/orders/mine/" },
      { label: "Subscription plans", slug: "plans", endpoint: "/payments/subscriptions/plans/" },
      { label: "My subscriptions", slug: "subscriptions", endpoint: "/payments/subscriptions/mine/" },
      { label: "Refund requests", slug: "refunds", endpoint: "/payments/refunds/request/" },
    ] },
    { label: "Saved batches", slug: "saved", icon: Heart, endpoint: "/batches/wishlist/" },
    { label: "Refer & earn", slug: "referrals", icon: Sparkles, endpoint: "/referrals/my-info/", children: [
      { label: "My referrals", slug: "activity", endpoint: "/referrals/my-referrals/" },
      { label: "Referral leaderboard", slug: "leaderboard", endpoint: "/referrals/leaderboard/" },
    ] },
  ] },
  { label: "ACCOUNT", items: [
    { label: "Notifications", slug: "notifications", icon: Activity, endpoint: "/notifications/", children: [
      { label: "Preferences", slug: "preferences", endpoint: "/notifications/preferences/" },
    ] },
    { label: "Help & support", slug: "support", icon: LifeBuoy, endpoint: "/support/tickets/", children: [
      { label: "Help articles", slug: "articles", endpoint: "/support/help-articles/" },
      { label: "FAQs", slug: "faqs", endpoint: "/support/faqs/" },
      { label: "Feature requests", slug: "features", endpoint: "/support/feature-requests/" },
    ] },
    { label: "My profile", slug: "profile", icon: Settings2, endpoint: "/auth/profile/" },
    { label: "Security & privacy", slug: "security", icon: ShieldCheck, endpoint: "/auth/devices/", children: [
      { label: "Signed-in devices", slug: "devices", endpoint: "/auth/devices/" },
      { label: "Two-step verification", slug: "two-factor", endpoint: "/auth/2fa/enable/", method: "POST" },
      { label: "Export my data", slug: "export", endpoint: "/auth/account/export-data/", method: "POST" },
      { label: "Delete account", slug: "delete-account", endpoint: "/auth/account/delete-request/", method: "POST" },
    ] },
  ] },
];

const teacherNavigation: NavigationGroup[] = [
  { label: "TEACHING", items: [
    { label: "Overview", slug: "dashboard", icon: LayoutDashboard, endpoint: "/teacher/dashboard/" },
    { label: "My batches", slug: "batches", icon: GraduationCap, endpoint: "/batches/mine/", children: [
      { label: "All my batches", slug: "mine", endpoint: "/batches/mine/" },
      { label: "Create a batch", slug: "create", endpoint: "/batches/create/", method: "POST" },
    ] },
    { label: "My students", slug: "students", icon: Users, endpoint: "/batches/mine/" },
    { label: "Live classes", slug: "live-classes", icon: Video, endpoint: "/live-classes/upcoming/", children: [
      { label: "Upcoming classes", slug: "upcoming", endpoint: "/live-classes/upcoming/" },
      { label: "Class history", slug: "history", endpoint: "/live-classes/history/" },
      { label: "Schedule a class", slug: "create", endpoint: "/live-classes/create/", method: "POST" },
    ] },
    { label: "Course catalogue", slug: "courses", icon: BookOpen, endpoint: "/courses/" },
    { label: "Study materials", slug: "content", icon: FileText, endpoint: "/content/", children: [
      { label: "All materials", slug: "all", endpoint: "/content/" },
      { label: "Folders", slug: "folders", endpoint: "/content/folders/" },
      { label: "Bookmarks", slug: "bookmarks", endpoint: "/content/bookmarks/" },
      { label: "Bulk upload", slug: "bulk-upload", endpoint: "/content/upload/bulk/", method: "POST" },
    ] },
    { label: "Video library", slug: "recordings", icon: Clapperboard, endpoint: "/recordings/mine/", children: [
      { label: "My recordings", slug: "mine", endpoint: "/recordings/mine/" },
      { label: "Upload recording", slug: "upload", endpoint: "/recordings/upload/initiate/", method: "POST" },
      { label: "YouTube upload", slug: "youtube-upload", endpoint: "/recordings/upload/youtube/", method: "POST" },
    ] },
    { label: "Tests & questions", slug: "tests", icon: ClipboardList, endpoint: "/tests/manage/", children: [
      { label: "Manage tests", slug: "manage", endpoint: "/tests/manage/" },
      { label: "Question bank", slug: "question-bank", endpoint: "/tests/question-bank/" },
    ] },
    { label: "Student questions", slug: "doubts", icon: MessageCircle, endpoint: "/doubts/" },
    { label: "Private tutoring", slug: "tutoring", icon: CalendarDays, endpoint: "/private-tuition/bookings/teacher/", children: [
      { label: "Booking requests", slug: "bookings", endpoint: "/private-tuition/bookings/teacher/" },
      { label: "Tutoring profile", slug: "profile", endpoint: "/private-tuition/my-profile/" },
      { label: "Availability", slug: "availability", endpoint: "/private-tuition/my-profile/availability/" },
    ] },
  ] },
  { label: "YOUR IMPACT", items: [
    { label: "Earnings", slug: "earnings", icon: Wallet, endpoint: "/teacher/earnings/" },
    { label: "Performance", slug: "performance", icon: BarChart3, endpoint: "/teacher/my-performance/" },
    { label: "Payouts & bank", slug: "payouts", icon: CreditCard, endpoint: "/payments/teacher/payouts/", children: [
      { label: "Payout history", slug: "history", endpoint: "/payments/teacher/payouts/" },
      { label: "Bank account", slug: "bank-account", endpoint: "/payments/teacher/bank-account/" },
    ] },
    { label: "Teacher profile", slug: "profile", icon: GraduationCap, endpoint: "/teacher/profile/" },
  ] },
  { label: "ACCOUNT", items: [
    { label: "Notifications", slug: "notifications", icon: Activity, endpoint: "/notifications/", children: [
      { label: "Preferences", slug: "preferences", endpoint: "/notifications/preferences/" },
    ] },
    { label: "Help & support", slug: "support", icon: CircleHelp, endpoint: "/support/tickets/", children: [
      { label: "Help articles", slug: "articles", endpoint: "/support/help-articles/" },
      { label: "FAQs", slug: "faqs", endpoint: "/support/faqs/" },
    ] },
    { label: "Settings", slug: "settings", icon: Settings2, endpoint: "/auth/profile/" },
  ] },
];

export function navigationFor(role: PortalRole) {
  return role === "student" ? studentNavigation : teacherNavigation;
}

export function routeFor(role: PortalRole, slug: string, child?: string) {
  return `/${role}/${slug}${child ? `/${child}` : ""}`;
}

export function findNavigationItem(role: PortalRole, slug: string) {
  return navigationFor(role).flatMap(group => group.items).find(item => item.slug === slug);
}

export function findPageLink(role: PortalRole, slug: string, child?: string) {
  if (!child) return null;
  return findNavigationItem(role, slug)?.children?.find(item => item.slug === child) ?? null;
}

export const flatNavigation = (role: PortalRole) => navigationFor(role).flatMap(group => group.items);
