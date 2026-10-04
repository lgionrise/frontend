"use client";

import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpenCheck, GraduationCap, Search, Sparkles, Video } from "lucide-react";

export function LandingPage() {
  return (
    <main className="landing">
      <header className="landing-nav">
        <Link className="brand brand-dark" href="/"><span className="brand-mark"><GraduationCap size={21} /></span> lgion<span className="brand-dot">.</span></Link>
        <nav><a href="#how-it-works">Our approach</a><a href="#for-everyone">For learners</a><a href="#for-everyone">For teachers</a></nav>
        <div className="nav-actions"><Link className="nav-login" href="/login">Log in</Link><Link className="button button-dark button-small" href="/register">Get started <ArrowRight size={15} /></Link></div>
      </header>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> A little more you, every day</div>
          <h1>Big dreams.<br /><span>Bright beginnings.</span></h1>
          <p className="hero-lede">Classes that click. Teachers who care. A learning journey that feels like yours.</p>
          <div className="hero-actions"><Link href="/register" className="button button-primary">Start learning <ArrowRight size={17} /></Link><Link href="/student/discover" className="button button-quiet"><Search size={15} /> Browse batches</Link></div>
          <div className="hero-proof"><span><strong>One space for learning and teaching.</strong><br />Sign in to see your own courses, classes, and progress.</span></div>
        </div>
        <div className="hero-art">
          <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
          <div className="art-note note-top"><span className="note-icon note-orange"><Video size={17} /></span><span><b>Live learning</b><small>Find your class, right here</small></span></div>
          <div className="art-portrait"><div className="portrait-sun" /><div className="portrait-shape portrait-back" /><div className="portrait-shape portrait-body" /><div className="portrait-head" /><div className="portrait-book"><BookOpenCheck size={28} /></div></div>
          <div className="art-note note-bottom"><span className="note-icon note-green"><GraduationCap size={18} /></span><span><b>Your learning space</b><small>Courses and progress, together</small></span></div>
          <div className="floating-star star-one">✳</div><div className="floating-star star-two">✦</div><div className="floating-star star-three">✳</div>
        </div>
        <a className="scroll-hint" href="#for-everyone"><ArrowDown size={14} /> A better way to learn</a>
      </section>
      <section className="audience-section" id="for-everyone">
        <div className="section-intro"><div className="eyebrow">A place to find your flow</div><h2>Learning looks good<br />on <span>everyone.</span></h2><p>Whether you&apos;re here to master a new subject or share what you know, you&apos;re in the right place.</p></div>
        <div className="audience-cards">
          <article className="audience-card student-card"><div className="audience-icon"><BookOpenCheck size={21} /></div><span className="card-overline">FOR THE CURIOUS</span><h3>Hey, learner.</h3><p>Pick up where you left off, find your next favourite class, and celebrate every little win.</p><Link href="/student/dashboard">Your learning space <ArrowUpRight size={16} /></Link><div className="card-decoration student-decoration"><div /><div /><div /></div></article>
          <article className="audience-card teacher-card"><div className="audience-icon"><GraduationCap size={22} /></div><span className="card-overline">FOR THE INSPIRING</span><h3>Hey, teacher.</h3><p>Bring your classes to life, get to know your students, and see your impact grow.</p><Link href="/teacher/dashboard">Your teaching space <ArrowUpRight size={16} /></Link><div className="teacher-decoration-shape">✳</div></article>
        </div>
      </section>
      <section className="how-section" id="how-it-works"><div className="how-kicker"><span>01</span><i /> MADE FOR YOUR NEXT CHAPTER</div><div className="how-layout"><h2>Not just another<br />classroom. <span>Your kind<br />of classroom.</span></h2><div className="how-points"><div><span>01</span><p><b>Find your people.</b><br />Great teachers. Good company. Your pace.</p></div><div><span>02</span><p><b>Make progress yours.</b><br />Practice, ask, revisit, and grow.</p></div><div><span>03</span><p><b>Let every win count.</b><br />Big breakthroughs. Tiny victories. All yours.</p></div></div></div></section>
      <footer className="landing-footer"><Link className="brand brand-dark" href="/"><span className="brand-mark"><GraduationCap size={19} /></span> lgion<span className="brand-dot">.</span></Link><span>Made for the joy of learning.</span><div><Link href="/login">Log in</Link><Link href="/register">Create an account</Link></div></footer>
    </main>
  );
}
