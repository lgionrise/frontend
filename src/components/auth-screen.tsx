"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpenCheck, GraduationCap, LoaderCircle, Sparkles } from "lucide-react";
import { requestAuth } from "@/lib/api";

type AuthScreenProps = { mode: "login" | "register" };

export function AuthScreen({ mode }: AuthScreenProps) {
  const router = useRouter();
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [twoFactorEmail, setTwoFactorEmail] = useState("");
  const isRegister = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    try {
      const result = await requestAuth<Record<string, unknown>>(
        twoFactorEmail ? "login/verify-2fa" : isRegister ? "register" : "login",
        twoFactorEmail ? { email: twoFactorEmail, code: String(form.get("code") ?? "") } : {
        email,
        password: String(form.get("password") ?? ""),
        ...(isRegister ? {
          first_name: String(form.get("first_name") ?? ""),
          last_name: String(form.get("last_name") ?? ""),
          username: email.split("@")[0],
          role,
        } : {
          device_id: getDeviceId(),
          device_type: "web",
        }),
      });
      if (!isRegister && result.requires_2fa) {
        setTwoFactorEmail(email);
        setError("");
        return;
      }
      if (!isRegister && result.access) {
        window.localStorage.setItem("lgion_access", String(result.access));
        if (result.refresh) window.localStorage.setItem("lgion_refresh", String(result.refresh));
        if (result.user) window.localStorage.setItem("lgion_user", JSON.stringify(result.user));
      }
      const user = (result.user && typeof result.user === "object" ? result.user : {}) as Record<string, unknown>;
      if (isRegister) {
        setError("Your account is ready. Please verify your email, then sign in to continue.");
      } else {
        router.push(user.role === "teacher" ? "/teacher/dashboard" : `/${role}/dashboard`);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We couldn't complete that request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <aside className="auth-aside">
        <Link className="brand" href="/"><span className="brand-mark"><GraduationCap size={21} /></span> lgion<span className="brand-dot">.</span></Link>
        <div className="auth-aside-content"><span className="eyebrow"><Sparkles size={14} /> YOUR NEXT CHAPTER STARTS HERE</span><h1>Learning should feel like <span>possibility.</span></h1><p>Come for the classes. Stay for the feeling that you can.</p><div className="auth-aside-art"><span>✳</span><div><BookOpenCheck size={48} /></div><i>learn a little.<br />grow a lot.</i></div></div>
        <span className="auth-aside-foot">A brighter way to learn & teach.</span>
      </aside>
      <section className="auth-main">
        <Link href="/" className="auth-back"><ArrowLeft size={15} /> Back to home</Link>
        <div className="auth-form-wrap">
          <span className="eyebrow auth-form-eyebrow">{twoFactorEmail ? "ONE LAST STEP" : isRegister ? "LET'S GET YOU STARTED" : "GOOD TO HAVE YOU BACK"}</span>
          <h2>{twoFactorEmail ? "Check it’s really you." : isRegister ? "Make yourself at home." : "Welcome back."}</h2>
          <p className="auth-subtitle">{twoFactorEmail ? `Enter the verification code sent to ${twoFactorEmail}.` : isRegister ? "A few details and your learning space is ready." : "Your next big idea can pick up right where you left off."}</p>
          {!twoFactorEmail && <div className="auth-role-switch"><button type="button" className={role === "student" ? "selected" : ""} onClick={() => setRole("student")}><BookOpenCheck size={15} /> I&apos;m a student</button><button type="button" className={role === "teacher" ? "selected" : ""} onClick={() => setRole("teacher")}><GraduationCap size={16} /> I&apos;m a teacher</button></div>}
          <form className="auth-form" onSubmit={submit}>
            {!twoFactorEmail && isRegister && <div className="name-fields"><label>First name<input name="first_name" placeholder="Your first name" autoComplete="given-name" required /></label><label>Last name<input name="last_name" placeholder="Your last name" autoComplete="family-name" required /></label></div>}
            {!twoFactorEmail && <label>Email address<input name="email" type="email" placeholder="you@example.com" autoComplete="email" required /></label>}
            {twoFactorEmail && <label>Verification code<input name="code" inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" minLength={6} maxLength={6} required /></label>}
            {!twoFactorEmail && <label>Password<input name="password" type="password" placeholder={isRegister ? "At least 8 characters" : "Enter your password"} autoComplete={isRegister ? "new-password" : "current-password"} minLength={8} required /></label>}
            {!isRegister && !twoFactorEmail && <div className="form-between"><label className="check-label"><input type="checkbox" /> Remember me</label><Link href="/forgot-password">Forgot password?</Link></div>}
            {error && <div className={error.startsWith("Your account") ? "form-notice" : "form-error"} role="alert">{error}</div>}
            <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? <LoaderCircle size={17} className="spin" /> : null}{busy ? "One moment…" : twoFactorEmail ? "Verify & log in" : isRegister ? "Create my account" : "Log in"}{!busy && <ArrowRight size={16} />}</button>
          </form>
          <p className="auth-switch">{twoFactorEmail ? <button className="inline-link" type="button" onClick={() => { setTwoFactorEmail(""); setError(""); }}>Use another sign-in method</button> : <>{isRegister ? "Already have an account?" : "New around here?"} <Link href={isRegister ? "/login" : "/register"}>{isRegister ? "Log in" : "Create an account"}</Link></>}</p>
        </div>
        <span className="auth-legal">By continuing, you agree to our Terms of Service and Privacy Policy.</span>
      </section>
    </main>
  );
}

function getDeviceId() {
  const existing = window.localStorage.getItem("lgion_device");
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem("lgion_device", created);
  return created;
}
