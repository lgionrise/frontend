"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, GraduationCap, LoaderCircle, MailCheck } from "lucide-react";
import { apiRequest } from "@/lib/api";

export function PasswordResetScreen() {
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await apiRequest("/auth/password/reset/request/", {
        method: "POST",
        body: JSON.stringify({ identifier }),
      });
      setSent(true);
      setSuccess("If the account exists, a reset code was sent to your email.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We couldn't request a reset code.");
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await apiRequest("/auth/password/reset/confirm/", {
        method: "POST",
        body: JSON.stringify({ identifier, otp, new_password: newPassword }),
      });
      setSuccess("Your password has been reset. You can now sign in.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We couldn't reset the password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="reset-page">
      <header className="reset-header"><Link className="brand brand-dark" href="/"><span className="brand-mark"><GraduationCap size={20} /></span> lgion<span className="brand-dot">.</span></Link><Link href="/login" className="auth-back reset-login"><ArrowLeft size={15} /> Back to log in</Link></header>
      <section className="reset-card">
        <span className="reset-icon"><MailCheck size={23} /></span>
        <span className="eyebrow">A FRESH START</span>
        <h1>{sent ? "A new password, soon." : "Let’s get you back in."}</h1>
        <p>{sent ? "Enter the code we sent and choose a new password that feels right." : "Share your account email and we’ll send you a little reset code."}</p>
        {!sent ? <form className="auth-form reset-form" onSubmit={requestCode}><label>Email address<input type="email" value={identifier} onChange={event => setIdentifier(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></label><button className="button button-primary auth-submit" disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" /> : null}{busy ? "Sending…" : "Send a reset code"}{!busy && <ArrowRight size={15} />}</button></form> : <form className="auth-form reset-form" onSubmit={resetPassword}><label>Email address<input type="email" value={identifier} onChange={event => setIdentifier(event.target.value)} required /></label><label>6-digit verification code<input value={otp} onChange={event => setOtp(event.target.value)} inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={6} required /></label><label>New password<input type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label><button className="button button-primary auth-submit" disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" /> : null}{busy ? "Updating…" : "Set a new password"}{!busy && <ArrowRight size={15} />}</button></form>}
        {error && <div className="form-error reset-feedback" role="alert">{error}</div>}{success && <div className="form-notice reset-feedback" role="status">{success}</div>}
        <Link className="reset-back-link" href="/login">Back to sign in <ArrowRight size={13} /></Link>
      </section>
    </main>
  );
}
