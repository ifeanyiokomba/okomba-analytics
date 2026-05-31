
import { useState, useEffect, useRef, useCallback } from "react";

/* ============================================================
   OKOMBA ANALYTICS — Premium Digital Ecosystem
   Stages 1–9 | Production-Grade | Mobile-First
   ============================================================ */

// ─── GOOGLE FONTS ───────────────────────────────────────────
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Mono:wght@300;400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg-deep:    #060910;
      --bg-dark:    #0B0F1A;
      --bg-card:    #0F1420;
      --bg-glass:   rgba(15,20,32,0.72);
      --bg-border:  rgba(255,255,255,0.06);
      --gold:       #F0A500;
      --gold-light: #F7C24A;
      --gold-dim:   rgba(240,165,0,0.15);
      --blue:       #2D7CF6;
      --blue-light: #5B9EFF;
      --blue-dim:   rgba(45,124,246,0.12);
      --teal:       #00C9A7;
      --teal-dim:   rgba(0,201,167,0.12);
      --text-1:     #F2F4F8;
      --text-2:     #9BA3B5;
      --text-3:     #5C6478;
      --radius:     14px;
      --radius-lg:  20px;
      --shadow-sm:  0 2px 12px rgba(0,0,0,0.4);
      --shadow-md:  0 8px 32px rgba(0,0,0,0.5);
      --shadow-lg:  0 20px 60px rgba(0,0,0,0.6);
      --transition: all 0.32s cubic-bezier(0.4,0,0.2,1);
    }

    html { scroll-behavior: smooth; font-size: 16px; }

    body {
      background: var(--bg-deep);
      color: var(--text-1);
      font-family: 'DM Sans', system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
      line-height: 1.6;
    }

    h1,h2,h3,h4,h5,h6 {
      font-family: 'Syne', sans-serif;
      font-weight: 700;
      line-height: 1.15;
      letter-spacing: -0.02em;
    }

    code, .mono { font-family: 'DM Mono', monospace; }

    ::selection { background: var(--gold-dim); color: var(--gold); }
    :focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; border-radius: 4px; }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: var(--bg-dark); }
    ::-webkit-scrollbar-thumb { background: var(--text-3); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--gold); }

    /* ─── ANIMATIONS ─── */
    @keyframes fadeUp {
      from { opacity:0; transform:translateY(28px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity:0; } to { opacity:1; }
    }
    @keyframes float {
      0%,100% { transform:translateY(0px); }
      50%      { transform:translateY(-12px); }
    }
    @keyframes pulse-ring {
      0%   { transform:scale(0.9); opacity:0.7; }
      70%  { transform:scale(1.1); opacity:0; }
      100% { opacity:0; }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
    @keyframes gradient-shift {
      0%,100% { background-position: 0% 50%; }
      50%      { background-position: 100% 50%; }
    }
    @keyframes spin { to { transform:rotate(360deg); } }
    @keyframes slide-in-right {
      from { transform:translateX(100%); opacity:0; }
      to   { transform:translateX(0);    opacity:1; }
    }
    @keyframes slide-in-left {
      from { transform:translateX(-100%); opacity:0; }
      to   { transform:translateX(0);     opacity:1; }
    }
    @keyframes slide-in-up {
      from { transform:translateY(20px); opacity:0; }
      to   { transform:translateY(0);    opacity:1; }
    }
    @keyframes draw-line {
      from { stroke-dashoffset: 1000; }
      to   { stroke-dashoffset: 0; }
    }
    @keyframes orbit {
      from { transform: rotate(0deg) translateX(60px) rotate(0deg); }
      to   { transform: rotate(360deg) translateX(60px) rotate(-360deg); }
    }
    @keyframes glow-pulse {
      0%,100% { box-shadow: 0 0 20px rgba(240,165,0,0.3); }
      50%      { box-shadow: 0 0 40px rgba(240,165,0,0.6), 0 0 80px rgba(240,165,0,0.2); }
    }
    @keyframes count-up { from { opacity:0; } to { opacity:1; } }

    .animate-fadeUp   { animation: fadeUp 0.6s ease both; }
    .animate-float    { animation: float 6s ease-in-out infinite; }
    .animate-shimmer  {
      background: linear-gradient(90deg, transparent 0%, rgba(240,165,0,0.15) 50%, transparent 100%);
      background-size: 200% auto;
      animation: shimmer 3s linear infinite;
    }
    .gradient-text {
      background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 40%, var(--blue-light) 80%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .gradient-text-teal {
      background: linear-gradient(135deg, var(--teal) 0%, var(--blue-light) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* ─── LAYOUT ─── */
    .container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    @media(min-width:768px)  { .container { padding: 0 32px; } }
    @media(min-width:1280px) { .container { padding: 0 48px; } }

    .section { padding: 80px 0; }
    @media(min-width:768px) { .section { padding: 120px 0; } }

    /* ─── GLASSMORPHISM ─── */
    .glass {
      background: var(--bg-glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--bg-border);
    }
    .glass-gold {
      background: rgba(240,165,0,0.06);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(240,165,0,0.18);
    }

    /* ─── BUTTONS ─── */
    .btn {
      display: inline-flex; align-items:center; justify-content:center;
      gap: 8px; padding: 12px 24px; border-radius: 10px;
      font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500;
      cursor: pointer; transition: var(--transition); border: none;
      text-decoration: none; white-space: nowrap; position: relative; overflow: hidden;
    }
    .btn::before {
      content:''; position:absolute; inset:0;
      background: rgba(255,255,255,0.06); opacity:0;
      transition: opacity 0.2s; border-radius: inherit;
    }
    .btn:hover::before { opacity:1; }
    .btn:active { transform: scale(0.97); }

    .btn-primary {
      background: linear-gradient(135deg, var(--gold) 0%, #E09000 100%);
      color: #0B0F1A; font-weight: 600;
      box-shadow: 0 4px 20px rgba(240,165,0,0.3);
    }
    .btn-primary:hover { box-shadow: 0 8px 32px rgba(240,165,0,0.45); transform: translateY(-1px); }

    .btn-secondary {
      background: transparent; color: var(--text-1);
      border: 1px solid var(--bg-border);
    }
    .btn-secondary:hover { border-color: var(--gold); color: var(--gold); }

    .btn-ghost {
      background: transparent; color: var(--text-2);
      padding: 8px 16px;
    }
    .btn-ghost:hover { color: var(--text-1); }

    .btn-sm { padding: 8px 18px; font-size: 13px; }
    .btn-lg { padding: 16px 36px; font-size: 16px; border-radius: 12px; }

    /* ─── BADGES ─── */
    .badge {
      display: inline-flex; align-items:center; gap:6px;
      padding: 5px 12px; border-radius: 999px;
      font-size: 12px; font-weight: 500; font-family:'DM Mono',monospace;
      letter-spacing: 0.04em;
    }
    .badge-gold { background: var(--gold-dim); color: var(--gold); border: 1px solid rgba(240,165,0,0.25); }
    .badge-blue { background: var(--blue-dim); color: var(--blue-light); border: 1px solid rgba(45,124,246,0.25); }
    .badge-teal { background: var(--teal-dim); color: var(--teal); border: 1px solid rgba(0,201,167,0.25); }

    /* ─── INPUT ─── */
    .input-field {
      width: 100%; padding: 13px 16px;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--bg-border);
      border-radius: 10px; color: var(--text-1);
      font-family: 'DM Sans',sans-serif; font-size: 15px;
      transition: var(--transition); outline: none;
    }
    .input-field::placeholder { color: var(--text-3); }
    .input-field:focus { border-color: var(--gold); background: rgba(240,165,0,0.04); }
    .input-field.error { border-color: #EF4444; }

    .input-label {
      display: block; font-size: 13px; font-weight: 500;
      color: var(--text-2); margin-bottom: 7px; letter-spacing: 0.02em;
    }
    .input-error { font-size: 12px; color: #EF4444; margin-top: 5px; }
    .input-group { margin-bottom: 18px; }

    select.input-field {
      appearance: none; cursor: pointer;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239BA3B5' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 14px center;
      padding-right: 36px;
    }
    select.input-field option { background: var(--bg-card); color: var(--text-1); }

    /* ─── DIVIDER ─── */
    .divider {
      border: none; border-top: 1px solid var(--bg-border); margin: 0;
    }

    /* ─── CARD ─── */
    .card {
      background: var(--bg-card);
      border: 1px solid var(--bg-border);
      border-radius: var(--radius-lg);
      transition: var(--transition);
    }
    .card:hover {
      border-color: rgba(240,165,0,0.2);
      box-shadow: 0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(240,165,0,0.08);
      transform: translateY(-3px);
    }

    /* ─── NOISE OVERLAY ─── */
    .noise {
      position: fixed; inset:0; pointer-events:none; z-index:999;
      opacity: 0.025;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    }

    /* ─── MODAL ─── */
    .modal-overlay {
      position: fixed; inset:0; z-index:1000;
      background: rgba(6,9,16,0.85);
      backdrop-filter: blur(12px);
      display: flex; align-items:center; justify-content:center;
      padding: 16px; animation: fadeIn 0.25s ease;
    }
    .modal-box {
      width: 100%; max-width: 560px; max-height: 90vh;
      overflow-y: auto; border-radius: var(--radius-lg);
      background: var(--bg-card);
      border: 1px solid rgba(240,165,0,0.15);
      box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(240,165,0,0.05);
      animation: slide-in-up 0.35s cubic-bezier(0.4,0,0.2,1);
    }

    /* ─── TOAST ─── */
    .toast {
      position: fixed; bottom:24px; right:24px; z-index:1100;
      padding: 14px 20px; border-radius: 12px; max-width: 360px;
      display: flex; align-items:center; gap:12px;
      box-shadow: var(--shadow-lg); animation: slide-in-right 0.4s ease;
      font-size: 14px; font-weight: 500;
    }
    .toast-success {
      background: rgba(0,201,167,0.12);
      border: 1px solid rgba(0,201,167,0.3);
      color: var(--teal);
    }
    .toast-error {
      background: rgba(239,68,68,0.12);
      border: 1px solid rgba(239,68,68,0.3);
      color: #EF4444;
    }

    /* ─── NAV ─── */
    .navbar {
      position: fixed; top:0; left:0; right:0; z-index: 900;
      height: 68px; display:flex; align-items:center;
      transition: var(--transition);
    }
    .navbar.scrolled {
      background: rgba(6,9,16,0.9);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--bg-border);
      box-shadow: 0 4px 24px rgba(0,0,0,0.4);
    }
    .nav-inner {
      display:flex; align-items:center; justify-content:space-between;
      width:100%; max-width:1200px; margin:0 auto; padding:0 20px;
    }
    @media(min-width:768px) { .nav-inner { padding: 0 32px; } }

    .nav-logo { display:flex; align-items:center; gap:10px; cursor:pointer; text-decoration:none; }
    .nav-logo-mark {
      width:38px; height:38px; border-radius:10px;
      background: linear-gradient(135deg, var(--gold) 0%, #E09000 100%);
      display:flex; align-items:center; justify-content:center;
      font-family:'Syne',sans-serif; font-size:15px; font-weight:800;
      color:#0B0F1A; letter-spacing:-0.03em;
      box-shadow: 0 4px 16px rgba(240,165,0,0.35);
      transition: var(--transition);
    }
    .nav-logo:hover .nav-logo-mark { box-shadow: 0 6px 24px rgba(240,165,0,0.5); transform:scale(1.05); }
    .nav-logo-text { font-family:'Syne',sans-serif; font-size:16px; font-weight:700; letter-spacing:-0.01em; }
    .nav-logo-text span { color: var(--gold); }

    .nav-links { display:none; align-items:center; gap:4px; }
    @media(min-width:900px) { .nav-links { display:flex; } }
    .nav-link {
      padding: 8px 14px; border-radius:8px; font-size:14px; font-weight:500;
      color:var(--text-2); cursor:pointer; transition:var(--transition); border:none;
      background:transparent; text-decoration:none;
    }
    .nav-link:hover { color:var(--text-1); background:rgba(255,255,255,0.04); }
    .nav-link.active { color:var(--gold); }

    .nav-actions { display:flex; align-items:center; gap:10px; }
    .hamburger { background:none; border:none; cursor:pointer; padding:8px; display:flex; flex-direction:column; gap:5px; }
    @media(min-width:900px) { .hamburger { display:none; } }
    .hamburger span {
      display:block; height:2px; border-radius:2px; background:var(--text-2);
      transition: var(--transition);
    }
    .hamburger span:nth-child(1) { width:22px; }
    .hamburger span:nth-child(2) { width:16px; }
    .hamburger span:nth-child(3) { width:22px; }
    .hamburger.open span:nth-child(1) { transform:translateY(7px) rotate(45deg); width:22px; background:var(--gold); }
    .hamburger.open span:nth-child(2) { opacity:0; transform:scaleX(0); }
    .hamburger.open span:nth-child(3) { transform:translateY(-7px) rotate(-45deg); width:22px; background:var(--gold); }

    /* Mobile Menu */
    .mobile-menu {
      position:fixed; inset:0; top:68px; z-index:850;
      background:rgba(6,9,16,0.97); backdrop-filter:blur(20px);
      padding:24px 20px; overflow-y:auto;
      transform:translateX(-100%); transition:transform 0.35s cubic-bezier(0.4,0,0.2,1);
    }
    .mobile-menu.open { transform:translateX(0); }

    /* ─── HERO ─── */
    .hero {
      min-height: 100vh; display:flex; align-items:center;
      position:relative; overflow:hidden; padding-top:68px;
    }
    .hero-bg {
      position:absolute; inset:0; overflow:hidden; pointer-events:none;
    }
    .hero-orb {
      position:absolute; border-radius:50%; filter:blur(120px); opacity:0.18;
      animation: float 10s ease-in-out infinite;
    }
    .hero-grid {
      position:absolute; inset:0;
      background-image:
        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
      background-size: 60px 60px;
      mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 100%);
    }

    /* ─── SERVICES ─── */
    .service-grid {
      display:grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    @media(max-width:640px) { .service-grid { grid-template-columns: 1fr; } }
    @media(min-width:1100px) { .service-grid { grid-template-columns: repeat(3,1fr); } }

    .service-card {
      background: var(--bg-card);
      border: 1px solid var(--bg-border);
      border-radius: var(--radius-lg);
      padding: 28px; cursor:pointer;
      transition: var(--transition);
      position:relative; overflow:hidden;
    }
    .service-card::before {
      content:''; position:absolute; inset:0; opacity:0;
      transition: opacity 0.4s;
      background: radial-gradient(ellipse at top left, rgba(240,165,0,0.08) 0%, transparent 60%);
    }
    .service-card:hover::before { opacity:1; }
    .service-card:hover {
      border-color: rgba(240,165,0,0.25);
      box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(240,165,0,0.1);
      transform: translateY(-4px);
    }

    .service-icon-wrap {
      width:52px; height:52px; border-radius:14px; margin-bottom:18px;
      display:flex; align-items:center; justify-content:center;
      font-size:24px; transition: var(--transition);
    }
    .service-card:hover .service-icon-wrap { transform:scale(1.08); }

    .service-title { font-size:17px; font-weight:700; margin-bottom:8px; font-family:'Syne',sans-serif; }
    .service-desc  { font-size:13.5px; color:var(--text-2); line-height:1.65; margin-bottom:16px; }
    .service-tags  { display:flex; flex-wrap:wrap; gap:6px; }
    .service-tag   {
      font-size:11.5px; font-family:'DM Mono',monospace;
      padding:3px 9px; border-radius:5px;
      background:rgba(255,255,255,0.04);
      color:var(--text-3);
      border: 1px solid rgba(255,255,255,0.05);
    }

    .service-cta {
      margin-top:20px; display:flex; align-items:center; gap:6px;
      font-size:13px; font-weight:500; color:var(--gold);
      opacity:0; transition: var(--transition); transform:translateX(-8px);
    }
    .service-card:hover .service-cta { opacity:1; transform:translateX(0); }

    /* ─── STATS ─── */
    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--bg-border);
      border-radius:var(--radius-lg); padding:28px 24px; text-align:center;
    }
    .stat-number { font-size:42px; font-weight:800; font-family:'Syne',sans-serif; line-height:1; margin-bottom:6px; }
    .stat-label  { font-size:13px; color:var(--text-2); font-weight:500; }

    /* ─── SECTION HEADERS ─── */
    .section-eyebrow {
      font-size:12px; font-family:'DM Mono',monospace;
      letter-spacing:0.1em; text-transform:uppercase;
      color:var(--gold); margin-bottom:14px; display:flex;
      align-items:center; gap:10px;
    }
    .section-eyebrow::before {
      content:''; display:inline-block; width:28px; height:1px;
      background:var(--gold);
    }
    .section-title { font-size:clamp(28px,4vw,48px); font-weight:800; margin-bottom:16px; }
    .section-subtitle { font-size:16px; color:var(--text-2); max-width:600px; line-height:1.7; }

    /* ─── FEATURES ─── */
    .feature-item {
      display:flex; gap:16px; padding:20px 0;
      border-bottom:1px solid var(--bg-border);
    }
    .feature-item:last-child { border-bottom:none; }
    .feature-icon {
      width:40px; height:40px; border-radius:10px;
      background:var(--gold-dim); display:flex; align-items:center; justify-content:center;
      flex-shrink:0; font-size:18px;
    }

    /* ─── CONTACT ─── */
    .contact-method {
      display:flex; align-items:center; gap:14px; padding:18px 20px;
      background:var(--bg-card); border:1px solid var(--bg-border);
      border-radius:var(--radius); cursor:pointer;
      transition:var(--transition); text-decoration:none;
      color:var(--text-1);
    }
    .contact-method:hover {
      border-color:rgba(240,165,0,0.3);
      background:rgba(240,165,0,0.04);
      transform:translateX(4px);
    }
    .contact-method-icon {
      width:44px; height:44px; border-radius:12px;
      display:flex; align-items:center; justify-content:center;
      font-size:20px; flex-shrink:0;
    }

    /* ─── FOOTER ─── */
    .footer {
      background:var(--bg-dark); border-top:1px solid var(--bg-border);
      padding:64px 0 32px;
    }
    .footer-grid {
      display:grid; grid-template-columns:1fr;
      gap:40px; margin-bottom:48px;
    }
    @media(min-width:640px) { .footer-grid { grid-template-columns:1fr 1fr; } }
    @media(min-width:1024px) { .footer-grid { grid-template-columns:2fr 1fr 1fr 1fr; } }

    .footer-link {
      font-size:14px; color:var(--text-3); cursor:pointer;
      display:block; margin-bottom:10px; text-decoration:none;
      transition:color 0.2s;
    }
    .footer-link:hover { color:var(--text-1); }

    /* ─── ADMIN ─── */
    .admin-sidebar {
      width:240px; background:var(--bg-dark); border-right:1px solid var(--bg-border);
      height:100vh; position:fixed; left:0; top:0; z-index:50;
      padding:24px 16px; overflow-y:auto; flex-shrink:0;
      transition: transform 0.3s ease;
    }
    @media(max-width:768px) {
      .admin-sidebar { transform:translateX(-100%); }
      .admin-sidebar.open { transform:translateX(0); }
    }
    .admin-main {
      margin-left:240px; min-height:100vh; padding:32px;
      background:var(--bg-deep);
    }
    @media(max-width:768px) { .admin-main { margin-left:0; padding:20px; } }
    .admin-nav-item {
      display:flex; align-items:center; gap:10px; padding:10px 12px;
      border-radius:10px; font-size:14px; font-weight:500;
      color:var(--text-2); cursor:pointer; transition:var(--transition);
      border:none; background:none; width:100%; text-align:left;
    }
    .admin-nav-item:hover { color:var(--text-1); background:rgba(255,255,255,0.04); }
    .admin-nav-item.active { color:var(--gold); background:var(--gold-dim); }

    .admin-metric {
      background:var(--bg-card); border:1px solid var(--bg-border);
      border-radius:var(--radius-lg); padding:24px;
    }
    .admin-table {
      width:100%; border-collapse:collapse;
    }
    .admin-table th {
      padding:12px 16px; text-align:left; font-size:12px; font-weight:600;
      color:var(--text-3); letter-spacing:0.06em; text-transform:uppercase;
      border-bottom:1px solid var(--bg-border);
    }
    .admin-table td {
      padding:14px 16px; font-size:14px; border-bottom:1px solid var(--bg-border);
      vertical-align:middle;
    }
    .admin-table tr:last-child td { border-bottom:none; }
    .admin-table tr:hover td { background:rgba(255,255,255,0.02); }

    /* ─── SCROLL REVEAL ─── */
    .reveal {
      opacity:0; transform:translateY(30px);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
    .reveal.visible { opacity:1; transform:translateY(0); }
    .reveal-delay-1 { transition-delay:0.1s; }
    .reveal-delay-2 { transition-delay:0.2s; }
    .reveal-delay-3 { transition-delay:0.3s; }
    .reveal-delay-4 { transition-delay:0.4s; }
    .reveal-delay-5 { transition-delay:0.5s; }

    /* ─── UTILITIES ─── */
    .flex-center { display:flex; align-items:center; justify-content:center; }
    .flex-between { display:flex; align-items:center; justify-content:space-between; }
    .text-gold { color: var(--gold); }
    .text-muted { color: var(--text-2); }
    .text-subtle { color: var(--text-3); }
    .fw-bold { font-weight:700; }
    .mb-4 { margin-bottom:4px; }
    .mb-8 { margin-bottom:8px; }
    .mb-12 { margin-bottom:12px; }
    .mb-16 { margin-bottom:16px; }
    .mb-24 { margin-bottom:24px; }
    .mb-32 { margin-bottom:32px; }
    .mb-48 { margin-bottom:48px; }
    .mt-8  { margin-top:8px; }
    .mt-16 { margin-top:16px; }
    .mt-24 { margin-top:24px; }
    .mt-32 { margin-top:32px; }
    .gap-8  { gap:8px; }
    .gap-12 { gap:12px; }
    .gap-16 { gap:16px; }
    .gap-24 { gap:24px; }
    .w-full { width:100%; }
    .text-center { text-align:center; }
    .text-sm { font-size:13px; }
    .text-xs { font-size:12px; }
    .overflow-hidden { overflow:hidden; }
    .relative { position:relative; }
    .inline-flex { display:inline-flex; align-items:center; }
    .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    @media(max-width:480px) { .grid-2 { grid-template-columns:1fr; } }
    .sr-only {
      position:absolute; width:1px; height:1px; padding:0; margin:-1px;
      overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0;
    }
    .logo-svg-container {
      display:flex; align-items:center; justify-content:center;
      width:100%; height:100%; border-radius:inherit; overflow:hidden;
    }

    /* ─── TICKER ─── */
    .ticker-wrap {
      overflow:hidden; border-top:1px solid var(--bg-border);
      border-bottom:1px solid var(--bg-border);
      background:rgba(6,9,16,0.5); padding:12px 0;
    }
    .ticker-track {
      display:flex; gap:48px; width:max-content;
      animation: marquee 30s linear infinite;
    }
    @keyframes marquee {
      from { transform:translateX(0); }
      to   { transform:translateX(-50%); }
    }
    .ticker-item {
      display:flex; align-items:center; gap:10px; white-space:nowrap;
      font-size:13px; color:var(--text-3); font-family:'DM Mono',monospace;
    }
    .ticker-dot { width:5px; height:5px; border-radius:50%; background:var(--gold); opacity:0.5; }

    /* ─── PROGRESS BAR ─── */
    .progress-bar {
      height:3px; background:rgba(255,255,255,0.06); border-radius:3px;
      overflow:hidden; margin-top:8px;
    }
    .progress-fill {
      height:100%; background:linear-gradient(90deg,var(--gold),var(--gold-light));
      border-radius:3px; transition:width 1.2s cubic-bezier(0.4,0,0.2,1);
    }

    /* ─── HERO CTA PULSE ─── */
    .pulse-btn {
      position:relative;
    }
    .pulse-btn::after {
      content:''; position:absolute; inset:0; border-radius:inherit;
      border:2px solid var(--gold); opacity:0;
      animation: pulse-ring 2.5s ease-out infinite;
    }

    /* Categories filter */
    .filter-btn {
      padding:8px 16px; border-radius:8px; font-size:13px; font-weight:500;
      cursor:pointer; transition:var(--transition); border:1px solid var(--bg-border);
      background:transparent; color:var(--text-2); white-space:nowrap;
    }
    .filter-btn:hover { color:var(--text-1); border-color:rgba(255,255,255,0.12); }
    .filter-btn.active { background:var(--gold-dim); color:var(--gold); border-color:rgba(240,165,0,0.3); }

    /* Trust badges row */
    .trust-row {
      display:flex; flex-wrap:wrap; gap:12px; align-items:center; justify-content:center;
    }
    .trust-item {
      display:flex; align-items:center; gap:8px; padding:8px 16px;
      background:rgba(255,255,255,0.03); border:1px solid var(--bg-border);
      border-radius:999px; font-size:13px; color:var(--text-2);
    }
    .trust-item .dot { width:6px; height:6px; border-radius:50%; }

    @media(prefers-reduced-motion:reduce) {
      *, *::before, *::after { animation-duration:0.001ms !important; transition-duration:0.001ms !important; }
    }
  `}</style>
);

// ─── SVG LOGO MARK ──────────────────────────────────────────
const OkombaLogo = ({ size = 38, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="OKOMBA Analytics Logo">
    <rect width="100" height="100" rx="22" fill="url(#logoGrad)"/>
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F0A500"/>
        <stop offset="100%" stopColor="#E09000"/>
      </linearGradient>
    </defs>
    {/* O */}
    <circle cx="38" cy="50" r="16" stroke="#0B0F1A" strokeWidth="7" fill="none"/>
    {/* A */}
    <path d="M62 66 L72 34 L82 66" stroke="#0B0F1A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M64.5 55 H79.5" stroke="#0B0F1A" strokeWidth="5" strokeLinecap="round"/>
    {/* Data spark */}
    <circle cx="18" cy="28" r="3.5" fill="#0B0F1A" opacity="0.5"/>
    <circle cx="25" cy="22" r="2.5" fill="#0B0F1A" opacity="0.4"/>
    <circle cx="13" cy="36" r="2" fill="#0B0F1A" opacity="0.3"/>
  </svg>
);

const OkombaLogoFull = ({ height = 36 }) => (
  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
    <OkombaLogo size={height} />
    <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:`${height*0.45}px`, letterSpacing:"-0.02em", color:"#F2F4F8" }}>
      OKOMBA <span style={{ color:"#F0A500" }}>ANALYTICS</span>
    </span>
  </div>
);

// ─── ICONS ──────────────────────────────────────────────────
const Icon = ({ name, size=20, color="currentColor", style={} }) => {
  const icons = {
    code: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
    payment: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    zap: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    settings: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    calendar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    book: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
    video: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
    image: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    database: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
    cpu: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
    heart: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    headphones: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>,
    briefcase: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    mail: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    phone: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    whatsapp: <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>,
    arrow_right: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}><polyline points="20 6 9 17 4 12"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    menu: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    shield: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    globe: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    trending_up: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    bar_chart: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
    layers: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
    star: <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1" style={style}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    lock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    log_out: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    inbox: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
    activity: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    loader: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{...style, animation:'spin 1s linear infinite'}}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>,
    external: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  };
  return icons[name] || null;
};

// ─── SERVICES DATA ───────────────────────────────────────────
const SERVICES = [
  {
    id:"web-dev", title:"Web & Mobile App Development",
    icon:"code", color:"#2D7CF6", bg:"rgba(45,124,246,0.1)",
    desc:"Custom digital solutions from concept to deployment — web, mobile, and full-stack.",
    tags:["Web Apps","Mobile","Full-Stack","Fintech"],
    subs:["Custom Web Application Development","Mobile App Development","Full-Stack Development","Business Website Development","Responsive Website Design","UI Implementation","Startup Product Development","Admin Dashboard Development","Fintech Solution Development"],
    category:"Technology"
  },
  {
    id:"fintech", title:"Fintech & Digital Payment Services",
    icon:"payment", color:"#F0A500", bg:"rgba(240,165,0,0.1)",
    desc:"Comprehensive digital payment operations — local and international transfer coordination.",
    tags:["Remita","Quickteller","Payments","Finance"],
    subs:["Remita Payment Processing","Quickteller Payment Support","Bill Payment Services","Local Fund Transfer Coordination","International Fund Transfer Support","Financial Workflow Management","Digital Transaction Support"],
    category:"Finance"
  },
  {
    id:"payment-int", title:"Payment System Integration",
    icon:"zap", color:"#00C9A7", bg:"rgba(0,201,167,0.1)",
    desc:"Seamless payment gateway integration and digital payment infrastructure setup.",
    tags:["Gateway","Integration","Collection","Automation"],
    subs:["Payment Gateway Integration","Digital Payment Setup","Payment Collection Systems","International Payment Infrastructure","Fintech Operations Support","Payment Automation Assistance"],
    category:"Finance"
  },
  {
    id:"digital-ops", title:"Digital Operations & Admin Support",
    icon:"settings", color:"#8B5CF6", bg:"rgba(139,92,246,0.1)",
    desc:"End-to-end digital workflow management and administrative coordination.",
    tags:["Workflow","Documentation","Scheduling","Operations"],
    subs:["Digital Workflow Management","Administrative Coordination","Documentation Management","Scheduling Systems","Stakeholder Coordination","Workflow Optimization"],
    category:"Operations"
  },
  {
    id:"events", title:"Event & Program Coordination",
    icon:"calendar", color:"#EC4899", bg:"rgba(236,72,153,0.1)",
    desc:"Virtual and physical event management with registration and logistics support.",
    tags:["Virtual Events","Registration","Certificates","Logistics"],
    subs:["Virtual Event Coordination","Physical Event Management","Participant Registration Systems","Certificate Distribution","Event Logistics","Presentation Coordination"],
    category:"Operations"
  },
  {
    id:"education", title:"Educational & Online Application Support",
    icon:"book", color:"#F59E0B", bg:"rgba(245,158,11,0.1)",
    desc:"Guided support for JAMB, scholarship, admission, and educational portal applications.",
    tags:["JAMB","Admissions","Scholarships","Applications"],
    subs:["JAMB Registration Assistance","Educational Applications","Scholarship Application Support","Admission Portal Guidance","Registration Workflow Assistance"],
    category:"Education"
  },
  {
    id:"video", title:"Video Design & Media Services",
    icon:"video", color:"#EF4444", bg:"rgba(239,68,68,0.1)",
    desc:"Professional video editing, motion graphics, and multimedia content production.",
    tags:["Video Editing","Motion Graphics","Social Media","Promos"],
    subs:["Video Editing","Promotional Video Creation","Motion Graphics","Social Media Video Content","Event Media Production"],
    category:"Creative"
  },
  {
    id:"graphic", title:"Graphic Design & Brand Support",
    icon:"image", color:"#06B6D4", bg:"rgba(6,182,212,0.1)",
    desc:"Premium design services for CVs, branding, marketing materials, and presentations.",
    tags:["CVs","Flyers","Branding","Marketing"],
    subs:["Resume/CV Design","Flyers","Banners","Brand Materials","Presentation Design","Marketing Assets"],
    category:"Creative"
  },
  {
    id:"research", title:"Research, Data & Documentation",
    icon:"database", color:"#10B981", bg:"rgba(16,185,129,0.1)",
    desc:"Structured data analysis, research support, and professional documentation services.",
    tags:["Data Analysis","Reports","Documentation","Records"],
    subs:["Data Analysis","Information Management","Report Preparation","Documentation Support","Records Organization"],
    category:"Operations"
  },
  {
    id:"training", title:"Training & Digital Facilitation",
    icon:"cpu", color:"#6366F1", bg:"rgba(99,102,241,0.1)",
    desc:"ICT training, digital literacy programs, and technology mentorship for youth.",
    tags:["ICT Training","Digital Literacy","Mentorship","Tech"],
    subs:["ICT Training","Digital Literacy Training","Technical Guidance","Computer Studies Instruction","Youth Mentorship"],
    category:"Education"
  },
  {
    id:"healthcare", title:"Healthcare & Laboratory Support",
    icon:"heart", color:"#F43F5E", bg:"rgba(244,63,94,0.1)",
    desc:"Clinical documentation, laboratory assistance, and diagnostic support services.",
    tags:["Laboratory","Clinical Docs","Diagnostics","Healthcare"],
    subs:["Laboratory Assistance","Clinical Documentation","Diagnostic Support","Sample Handling Support"],
    category:"Healthcare"
  },
  {
    id:"tech-support", title:"Technical & Digital Support",
    icon:"headphones", color:"#3B82F6", bg:"rgba(59,130,246,0.1)",
    desc:"Responsive technical support, software assistance, and technology consultation.",
    tags:["Tech Support","Software","Troubleshooting","Consultation"],
    subs:["Technical Support","Software Assistance","Digital Troubleshooting","Technology Consultation"],
    category:"Technology"
  },
  {
    id:"consulting", title:"Business & Digital Consultation",
    icon:"briefcase", color:"#D97706", bg:"rgba(217,119,6,0.1)",
    desc:"Strategic guidance for digital transformation, startup growth, and automation.",
    tags:["Consulting","Startups","Automation","Strategy"],
    subs:["Digital Solutions Consultation","Startup Technology Guidance","Business Operations Consultation","Automation Consultation"],
    category:"Business"
  },
  {
    id:"client-acq", title:"Client Acquisition & Business Support",
    icon:"users", color:"#7C3AED", bg:"rgba(124,58,237,0.1)",
    desc:"Automated lead collection, client onboarding, and communication workflow systems.",
    tags:["Lead Generation","Onboarding","Automation","CRM"],
    subs:["Lead Collection Systems","Client Onboarding","Automated Communication Systems","Customer Workflow Support"],
    category:"Business"
  },
];

const CATEGORIES = ["All","Technology","Finance","Operations","Creative","Education","Business","Healthcare"];

// ─── LOCAL STORAGE HELPERS ──────────────────────────────────
const STORAGE_KEY = "okomba_inquiries";
const getInquiries = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
};
const saveInquiry = (data) => {
  const list = getInquiries();
  list.unshift({ ...data, id: Date.now(), timestamp: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

// ─── HOOKS ───────────────────────────────────────────────────
const useScrolled = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return scrolled;
};

const useReveal = () => {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); } });
    }, { threshold: 0.12 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
};

// ─── NAVBAR ──────────────────────────────────────────────────
const Navbar = ({ onNavigate, currentPage, onRequestService }) => {
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = [
    { label:"Services", id:"services" },
    { label:"About", id:"about" },
    { label:"Process", id:"process" },
    { label:"Contact", id:"contact" },
  ];
  const handleNav = (id) => {
    setMenuOpen(false);
    if (currentPage !== "home") { onNavigate("home"); setTimeout(() => scrollToSection(id), 400); }
    else scrollToSection(id);
  };
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior:"smooth", block:"start" });
  };
  return (
    <>
      <nav className={`navbar${scrolled?" scrolled":""}`} role="navigation" aria-label="Main navigation">
        <div className="nav-inner">
          <button className="nav-logo" onClick={() => onNavigate("home")} aria-label="OKOMBA Analytics Home">
            <OkombaLogo size={38}/>
            <span className="nav-logo-text">OKOMBA <span>ANALYTICS</span></span>
          </button>
          <div className="nav-links" role="menubar">
            {navLinks.map(l => (
              <button key={l.id} className="nav-link" onClick={() => handleNav(l.id)} role="menuitem">{l.label}</button>
            ))}
          </div>
          <div className="nav-actions">
            <button className="btn btn-primary btn-sm" onClick={() => onRequestService(null)} style={{display:"none"}} aria-label="Get Started">Get Started</button>
            <button className="btn btn-primary btn-sm" onClick={() => onRequestService(null)} style={{ fontSize:"13px" }}>Get Started</button>
            <button className={`hamburger${menuOpen?" open":""}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" aria-expanded={menuOpen}>
              <span/><span/><span/>
            </button>
          </div>
        </div>
      </nav>
      {/* Mobile Menu */}
      <div className={`mobile-menu${menuOpen?" open":""}`} role="dialog" aria-label="Mobile navigation" aria-modal="true">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"32px" }}>
          <OkombaLogoFull height={32}/>
        </div>
        <hr className="divider" style={{ marginBottom:"24px" }}/>
        {navLinks.map(l => (
          <button key={l.id} className="nav-link" onClick={() => handleNav(l.id)}
            style={{ display:"block", width:"100%", textAlign:"left", padding:"14px 16px", fontSize:"16px", borderRadius:"10px", marginBottom:"4px" }}>
            {l.label}
          </button>
        ))}
        <div style={{ marginTop:"24px", display:"flex", flexDirection:"column", gap:"12px" }}>
          <button className="btn btn-primary" onClick={() => { setMenuOpen(false); onRequestService(null); }} style={{ width:"100%", padding:"14px" }}>
            Get Started <Icon name="arrow_right" size={16}/>
          </button>
          <a href="https://wa.me/2348088948657" target="_blank" rel="noopener noreferrer"
             className="btn btn-secondary" style={{ width:"100%", padding:"14px", justifyContent:"center" }}>
            <Icon name="whatsapp" size={16} color="#00C9A7"/> WhatsApp Us
          </a>
        </div>
        <div style={{ marginTop:"32px", padding:"20px", background:"rgba(240,165,0,0.04)", border:"1px solid rgba(240,165,0,0.1)", borderRadius:"12px" }}>
          <p style={{ fontSize:"12px", color:"var(--text-3)", marginBottom:"8px", fontFamily:"'DM Mono',monospace", letterSpacing:"0.06em", textTransform:"uppercase" }}>Quick Contact</p>
          <p style={{ fontSize:"14px", color:"var(--text-2)" }}>support@okomba.com</p>
          <p style={{ fontSize:"14px", color:"var(--text-2)" }}>+234 808 894 8657</p>
        </div>
      </div>
    </>
  );
};

// ─── HERO SECTION ────────────────────────────────────────────
const Hero = ({ onRequestService }) => (
  <section className="hero" id="hero" aria-label="Hero section">
    <div className="hero-bg">
      <div className="hero-grid"/>
      <div className="hero-orb" style={{width:600,height:600,background:"#F0A500",top:"-200px",right:"-200px",animationDelay:"0s"}}/>
      <div className="hero-orb" style={{width:400,height:400,background:"#2D7CF6",bottom:"-100px",left:"-100px",animationDelay:"3s"}}/>
      <div className="hero-orb" style={{width:300,height:300,background:"#00C9A7",top:"40%",left:"30%",animationDelay:"6s",opacity:0.08}}/>
      {/* Floating particles */}
      {[...Array(6)].map((_,i) => (
        <div key={i} style={{
          position:"absolute", width:4, height:4, borderRadius:"50%",
          background:`rgba(240,165,0,${0.2+i*0.06})`,
          left:`${15+i*14}%`, top:`${20+i*10}%`,
          animation:`float ${5+i}s ease-in-out infinite`,
          animationDelay:`${i*0.8}s`
        }}/>
      ))}
    </div>
    <div className="container" style={{ position:"relative", zIndex:1, paddingTop:"60px", paddingBottom:"60px" }}>
      <div style={{ maxWidth:"800px" }}>
        {/* Eyebrow */}
        <div style={{ marginBottom:"24px", animation:"fadeUp 0.6s 0.1s both" }}>
          <span className="badge badge-gold">
            <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--gold)", display:"inline-block" }}/>
            Digital Operations Ecosystem · Est. Nigeria
          </span>
        </div>
        {/* Headline */}
        <h1 style={{ fontSize:"clamp(36px,6vw,72px)", fontWeight:800, lineHeight:1.08, marginBottom:"24px", animation:"fadeUp 0.6s 0.2s both", letterSpacing:"-0.03em" }}>
          Premium Digital<br/>
          <span className="gradient-text">Services &amp; Solutions</span><br/>
          <span style={{ color:"var(--text-2)", fontWeight:600, fontSize:"clamp(24px,4vw,52px)" }}>Built for Growth</span>
        </h1>
        {/* Subtitle */}
        <p style={{ fontSize:"clamp(16px,2vw,20px)", color:"var(--text-2)", lineHeight:1.7, maxWidth:"600px", marginBottom:"36px", animation:"fadeUp 0.6s 0.3s both" }}>
          OKOMBA ANALYTICS is a full-spectrum digital ecosystem — combining web development,
          fintech solutions, automation, media, and business operations into one elite platform.
        </p>
        {/* CTAs */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:"12px", marginBottom:"48px", animation:"fadeUp 0.6s 0.4s both" }}>
          <button className="btn btn-primary btn-lg pulse-btn" onClick={() => onRequestService(null)}>
            Start Your Project <Icon name="arrow_right" size={18}/>
          </button>
          <a href="#services" onClick={e => { e.preventDefault(); document.getElementById("services")?.scrollIntoView({behavior:"smooth"}); }}
             className="btn btn-secondary btn-lg">
            Explore Services
          </a>
          <a href="https://wa.me/2348088948657" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-lg" style={{ color:"var(--teal)" }}>
            <Icon name="whatsapp" size={18} color="var(--teal)"/> WhatsApp
          </a>
        </div>
        {/* Trust row */}
        <div className="trust-row" style={{ justifyContent:"flex-start", animation:"fadeUp 0.6s 0.5s both" }}>
          {[
            { dot:"#00C9A7", label:"14+ Service Categories" },
            { dot:"#F0A500", label:"Fintech-Ready" },
            { dot:"#2D7CF6", label:"Mobile-First" },
            { dot:"#8B5CF6", label:"International Standard" },
          ].map((t,i) => (
            <div key={i} className="trust-item">
              <span className="dot" style={{ background:t.dot }}/>
              {t.label}
            </div>
          ))}
        </div>
      </div>
      {/* Stats float */}
      <div style={{ position:"absolute", right:"20px", top:"50%", transform:"translateY(-50%)", display:"none", flexDirection:"column", gap:"16px" }} className="hero-stats-desktop">
        <div style={{ display:"flex", gap:"16px" }}>
          {[
            { num:"200+", label:"Projects Delivered", icon:"💼" },
            { num:"50+", label:"Happy Clients", icon:"⭐" },
          ].map((s,i) => (
            <div key={i} className="glass" style={{ padding:"20px 24px", borderRadius:"16px", textAlign:"center", minWidth:"140px", animation:`fadeUp 0.6s ${0.5+i*0.1}s both` }}>
              <div style={{ fontSize:"24px", marginBottom:"8px" }}>{s.icon}</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"28px", fontWeight:800, color:"var(--gold)" }}>{s.num}</div>
              <div style={{ fontSize:"12px", color:"var(--text-3)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
    {/* Ticker */}
    <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:2 }}>
      <Ticker/>
    </div>
  </section>
);

// ─── TICKER ──────────────────────────────────────────────────
const Ticker = () => {
  const items = ["Web Development","Fintech Solutions","Payment Integration","Digital Operations","Event Coordination","Educational Support","Video Production","Graphic Design","Data Research","ICT Training","Healthcare Support","Technical Assistance","Business Consulting","Client Acquisition"];
  const doubled = [...items, ...items];
  return (
    <div className="ticker-wrap" aria-hidden="true">
      <div className="ticker-track">
        {doubled.map((item, i) => (
          <div key={i} className="ticker-item">
            <span className="ticker-dot"/>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── STATS SECTION ───────────────────────────────────────────
const StatsSection = () => (
  <section style={{ padding:"60px 0", background:"var(--bg-dark)", borderTop:"1px solid var(--bg-border)", borderBottom:"1px solid var(--bg-border)" }}>
    <div className="container">
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"20px" }}>
        {[
          { num:"14+", label:"Service Categories", icon:"layers", color:"var(--gold)" },
          { num:"200+", label:"Projects Completed", icon:"trending_up", color:"var(--teal)" },
          { num:"50+", label:"Satisfied Clients", icon:"star", color:"var(--blue-light)" },
          { num:"5+", label:"Years Experience", icon:"shield", color:"#8B5CF6" },
        ].map((s,i) => (
          <div key={i} className={`stat-card reveal reveal-delay-${i+1}`}>
            <div style={{ fontSize:"28px", marginBottom:"10px" }}>
              <Icon name={s.icon} size={28} color={s.color}/>
            </div>
            <div className="stat-number" style={{ color:s.color }}>{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
    <style>{`@media(min-width:640px){.container > div { grid-template-columns: repeat(4,1fr); }}`}</style>
  </section>
);

// ─── SERVICES SECTION ────────────────────────────────────────
const ServicesSection = ({ onRequestService }) => {
  const [active, setActive] = useState("All");
  const [expanded, setExpanded] = useState(null);
  const filtered = active === "All" ? SERVICES : SERVICES.filter(s => s.category === active);
  return (
    <section className="section" id="services" aria-labelledby="services-heading">
      <div className="container">
        <div className="text-center mb-48">
          <p className="section-eyebrow" style={{ justifyContent:"center" }}>Our Expertise</p>
          <h2 className="section-title reveal" id="services-heading">
            Complete <span className="gradient-text">Service Ecosystem</span>
          </h2>
          <p className="section-subtitle reveal reveal-delay-1" style={{ margin:"0 auto" }}>
            14 specialized service domains engineered to power your growth, operations, and digital transformation — all under one premium platform.
          </p>
        </div>
        {/* Filter */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"36px", justifyContent:"center" }} role="group" aria-label="Service category filter">
          {CATEGORIES.map(cat => (
            <button key={cat} className={`filter-btn${active===cat?" active":""}`} onClick={() => setActive(cat)} aria-pressed={active===cat}>
              {cat}
            </button>
          ))}
        </div>
        {/* Grid */}
        <div className="service-grid">
          {filtered.map((svc, i) => (
            <ServiceCard key={svc.id} svc={svc} index={i} expanded={expanded===svc.id}
              onExpand={() => setExpanded(expanded===svc.id ? null : svc.id)}
              onRequest={() => onRequestService(svc)} />
          ))}
        </div>
        {/* CTA */}
        <div className="text-center mt-32 reveal">
          <p style={{ color:"var(--text-2)", marginBottom:"20px", fontSize:"16px" }}>
            Don't see exactly what you need? We offer custom solutions.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => onRequestService(null)}>
            Request Custom Solution <Icon name="arrow_right" size={18}/>
          </button>
        </div>
      </div>
    </section>
  );
};

// ─── SERVICE CARD ────────────────────────────────────────────
const ServiceCard = ({ svc, index, expanded, onExpand, onRequest }) => (
  <article className={`service-card reveal reveal-delay-${(index%5)+1}`}
    style={{ animationDelay:`${index*0.06}s` }}
    aria-expanded={expanded}>
    <div className="service-icon-wrap" style={{ background: svc.bg }}>
      <Icon name={svc.icon} size={24} color={svc.color}/>
    </div>
    <h3 className="service-title">{svc.title}</h3>
    <p className="service-desc">{svc.desc}</p>
    <div className="service-tags" aria-label="Service tags">
      {svc.tags.map(t => <span key={t} className="service-tag">{t}</span>)}
    </div>
    {/* Expanded subs */}
    {expanded && (
      <div style={{ marginTop:"18px", padding:"16px", background:"rgba(255,255,255,0.03)", borderRadius:"10px", border:"1px solid var(--bg-border)", animation:"slide-in-up 0.25s ease" }}>
        <p style={{ fontSize:"12px", fontFamily:"'DM Mono',monospace", color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"12px" }}>Included Services</p>
        <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:"7px" }} aria-label={`Subservices for ${svc.title}`}>
          {svc.subs.map(sub => (
            <li key={sub} style={{ display:"flex", alignItems:"center", gap:"8px", fontSize:"13.5px", color:"var(--text-2)" }}>
              <span style={{ color:`${svc.color}`, flexShrink:0 }}><Icon name="check" size={13} color={svc.color}/></span>
              {sub}
            </li>
          ))}
        </ul>
      </div>
    )}
    <div style={{ display:"flex", gap:"8px", marginTop:"18px" }}>
      <button className="btn btn-primary btn-sm" onClick={onRequest} style={{ flex:1, background:`linear-gradient(135deg,${svc.color},${svc.color}cc)`, boxShadow:`0 4px 16px ${svc.color}30` }}
        aria-label={`Request ${svc.title}`}>
        Get Started
      </button>
      <button className="btn btn-secondary btn-sm" onClick={onExpand} aria-label={expanded?"Hide details":"View details"}>
        {expanded ? "Less" : "Details"}
      </button>
    </div>
    <div className="service-cta" aria-hidden="true">
      <Icon name="arrow_right" size={14} color="var(--gold)"/>
      <span>Request this service</span>
    </div>
  </article>
);

// ─── ABOUT SECTION ───────────────────────────────────────────
const AboutSection = () => (
  <section className="section" id="about" style={{ background:"var(--bg-dark)" }} aria-labelledby="about-heading">
    <div className="container">
      <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:"60px", alignItems:"center" }}>
        <div>
          <p className="section-eyebrow">Our Mission</p>
          <h2 className="section-title reveal" id="about-heading">
            Built for the<br/>
            <span className="gradient-text">Modern Digital Economy</span>
          </h2>
          <p style={{ color:"var(--text-2)", fontSize:"16px", lineHeight:1.75, marginBottom:"28px" }} className="reveal reveal-delay-1">
            OKOMBA ANALYTICS is a premier digital services company delivering world-class technology solutions,
            fintech operations, creative services, and business automation to clients across Nigeria and internationally.
          </p>
          <p style={{ color:"var(--text-2)", fontSize:"16px", lineHeight:1.75, marginBottom:"36px" }} className="reveal reveal-delay-2">
            We combine strategic thinking, technical excellence, and premium execution to help businesses scale,
            automate operations, and dominate their digital presence — with the reliability of a global tech company.
          </p>
          {[
            { icon:"shield", title:"Trust & Reliability", desc:"Every engagement backed by professional standards, transparent communication, and guaranteed outcomes." },
            { icon:"zap", title:"Speed & Precision", desc:"Rapid delivery without compromise — we move fast while maintaining elite quality benchmarks." },
            { icon:"globe", title:"International Standards", desc:"Our work meets global benchmarks, making your brand competitive on the international stage." },
          ].map((f,i) => (
            <div key={i} className={`feature-item reveal reveal-delay-${i+2}`}>
              <div className="feature-icon"><Icon name={f.icon} size={20} color="var(--gold)"/></div>
              <div>
                <h4 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, marginBottom:"4px", fontSize:"15px" }}>{f.title}</h4>
                <p style={{ color:"var(--text-2)", fontSize:"14px", lineHeight:1.6 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Visual */}
        <div className="reveal reveal-delay-2">
          <div style={{ position:"relative" }}>
            <div className="glass" style={{ borderRadius:"24px", padding:"32px", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at top right, rgba(240,165,0,0.08) 0%, transparent 60%)", pointerEvents:"none" }}/>
              <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"24px" }}>
                <OkombaLogo size={44}/>
                <div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"16px" }}>OKOMBA ANALYTICS</div>
                  <div style={{ fontSize:"12px", color:"var(--text-3)" }}>Digital Services Ecosystem</div>
                </div>
                <span className="badge badge-teal" style={{ marginLeft:"auto" }}>Active</span>
              </div>
              <hr className="divider" style={{ marginBottom:"20px" }}/>
              {[
                { label:"Web & Mobile Dev", val:95, color:"var(--blue)" },
                { label:"Fintech Solutions", val:90, color:"var(--gold)" },
                { label:"Digital Operations", val:88, color:"var(--teal)" },
                { label:"Creative Services", val:85, color:"#8B5CF6" },
                { label:"Business Consulting", val:92, color:"#EC4899" },
              ].map((item,i) => (
                <div key={i} style={{ marginBottom:"16px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                    <span style={{ fontSize:"13px", color:"var(--text-2)" }}>{item.label}</span>
                    <span style={{ fontSize:"13px", color:item.color, fontFamily:"'DM Mono',monospace" }}>{item.val}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width:`${item.val}%`, background:`linear-gradient(90deg,${item.color},${item.color}cc)` }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    <style>{`@media(min-width:900px){ .container > div { grid-template-columns: 1fr 1fr; } }`}</style>
  </section>
);

// ─── PROCESS SECTION ────────────────────────────────────────
const ProcessSection = () => (
  <section className="section" id="process" aria-labelledby="process-heading">
    <div className="container">
      <div className="text-center mb-48">
        <p className="section-eyebrow" style={{ justifyContent:"center" }}>How We Work</p>
        <h2 className="section-title reveal" id="process-heading">
          Our <span className="gradient-text">Premium Process</span>
        </h2>
        <p className="section-subtitle reveal reveal-delay-1" style={{ margin:"0 auto" }}>
          A systematic, transparent workflow designed to deliver exceptional results on time.
        </p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:"20px" }}>
        {[
          { step:"01", title:"Initial Consultation", desc:"We begin with a detailed discovery call to understand your goals, challenges, and requirements. No assumptions — just precise alignment.", icon:"phone", color:"var(--gold)" },
          { step:"02", title:"Strategic Planning", desc:"Our team maps out a comprehensive solution architecture with clear timelines, deliverables, and cost estimates.", icon:"layers", color:"var(--blue)" },
          { step:"03", title:"Expert Execution", desc:"Premium execution with regular progress updates, quality checks, and iterative refinement to exceed expectations.", icon:"zap", color:"var(--teal)" },
          { step:"04", title:"Delivery & Support", desc:"Professional delivery with thorough documentation, handover support, and ongoing assistance to ensure long-term success.", icon:"shield", color:"#8B5CF6" },
        ].map((p,i) => (
          <div key={i} className={`reveal reveal-delay-${i+1}`}
            style={{ display:"flex", gap:"24px", padding:"28px", background:"var(--bg-card)", border:"1px solid var(--bg-border)", borderRadius:"var(--radius-lg)", alignItems:"flex-start", transition:"var(--transition)" }}>
            <div style={{ background:p.color+"18", border:`1px solid ${p.color}30`, borderRadius:"14px", padding:"12px", flexShrink:0 }}>
              <Icon name={p.icon} size={22} color={p.color}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"11px", color:p.color, letterSpacing:"0.1em", marginBottom:"6px" }}>STEP {p.step}</div>
              <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"17px", marginBottom:"8px" }}>{p.title}</h3>
              <p style={{ color:"var(--text-2)", fontSize:"14px", lineHeight:1.65 }}>{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
    <style>{`@media(min-width:900px){ .container > div:last-child { grid-template-columns: repeat(2,1fr); } }`}</style>
  </section>
);

// ─── CONTACT SECTION ────────────────────────────────────────
const ContactSection = ({ onRequestService }) => (
  <section className="section" id="contact" style={{ background:"var(--bg-dark)" }} aria-labelledby="contact-heading">
    <div className="container">
      <div className="text-center mb-48">
        <p className="section-eyebrow" style={{ justifyContent:"center" }}>Get In Touch</p>
        <h2 className="section-title reveal" id="contact-heading">
          Ready to <span className="gradient-text">Get Started?</span>
        </h2>
        <p className="section-subtitle reveal reveal-delay-1" style={{ margin:"0 auto" }}>
          Reach out through any channel — we respond fast and professionally to every inquiry.
        </p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:"40px", alignItems:"start" }}>
        {/* Contact Methods */}
        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"20px", marginBottom:"8px" }}>Direct Contact</h3>
          <a href="mailto:support@okomba.com" className="contact-method" aria-label="Email us">
            <div className="contact-method-icon" style={{ background:"rgba(45,124,246,0.12)", color:"var(--blue)" }}>
              <Icon name="mail" size={20} color="var(--blue)"/>
            </div>
            <div>
              <div style={{ fontWeight:600, fontSize:"15px", marginBottom:"3px" }}>Email Support</div>
              <div style={{ fontSize:"13px", color:"var(--text-2)" }}>support@okomba.com</div>
            </div>
            <Icon name="external" size={14} color="var(--text-3)" style={{ marginLeft:"auto" }}/>
          </a>
          <a href="tel:+2348088948657" className="contact-method" aria-label="Call us">
            <div className="contact-method-icon" style={{ background:"rgba(240,165,0,0.12)", color:"var(--gold)" }}>
              <Icon name="phone" size={20} color="var(--gold)"/>
            </div>
            <div>
              <div style={{ fontWeight:600, fontSize:"15px", marginBottom:"3px" }}>Phone Call</div>
              <div style={{ fontSize:"13px", color:"var(--text-2)" }}>+234 808 894 8657</div>
            </div>
            <Icon name="external" size={14} color="var(--text-3)" style={{ marginLeft:"auto" }}/>
          </a>
          <a href="https://wa.me/2348088948657" target="_blank" rel="noopener noreferrer" className="contact-method" aria-label="WhatsApp us">
            <div className="contact-method-icon" style={{ background:"rgba(0,201,167,0.12)", color:"var(--teal)" }}>
              <Icon name="whatsapp" size={20} color="var(--teal)"/>
            </div>
            <div>
              <div style={{ fontWeight:600, fontSize:"15px", marginBottom:"3px" }}>WhatsApp</div>
              <div style={{ fontSize:"13px", color:"var(--text-2)" }}>+234 808 894 8657 · Fast Response</div>
            </div>
            <Icon name="external" size={14} color="var(--text-3)" style={{ marginLeft:"auto" }}/>
          </a>
          {/* CTA Block */}
          <div className="glass-gold" style={{ borderRadius:"var(--radius-lg)", padding:"28px", marginTop:"8px" }}>
            <h4 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"18px", marginBottom:"10px" }}>Start a Project</h4>
            <p style={{ color:"var(--text-2)", fontSize:"14px", lineHeight:1.65, marginBottom:"20px" }}>
              Fill out our smart inquiry form and our team will contact you within 24 hours with a tailored proposal.
            </p>
            <button className="btn btn-primary" onClick={() => onRequestService(null)} style={{ width:"100%" }}>
              Submit Inquiry <Icon name="arrow_right" size={16}/>
            </button>
          </div>
        </div>
        {/* Quick Info */}
        <div>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"20px", marginBottom:"20px" }}>Why Choose OKOMBA?</h3>
          {[
            { icon:"⚡", title:"Fast Turnaround", desc:"Rapid delivery without sacrificing quality" },
            { icon:"🔒", title:"Confidential & Secure", desc:"Your data and projects are handled with utmost discretion" },
            { icon:"🌍", title:"Globally Competitive", desc:"International-standard work at accessible pricing" },
            { icon:"📞", title:"24/7 Support Ready", desc:"We're available when you need us most" },
            { icon:"✅", title:"Result-Driven", desc:"Every engagement is focused on measurable outcomes" },
          ].map((item,i) => (
            <div key={i} className={`reveal reveal-delay-${i+1}`}
              style={{ display:"flex", gap:"14px", padding:"16px 0", borderBottom:"1px solid var(--bg-border)" }}>
              <span style={{ fontSize:"22px", flexShrink:0 }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight:600, fontSize:"15px", marginBottom:"3px" }}>{item.title}</div>
                <div style={{ color:"var(--text-2)", fontSize:"13px" }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    <style>{`@media(min-width:900px){ .container > div:last-child { grid-template-columns: 1fr 1fr; } }`}</style>
  </section>
);

// ─── FOOTER ──────────────────────────────────────────────────
const Footer = ({ onNavigate, onRequestService }) => (
  <footer className="footer" aria-label="Site footer">
    <div className="container">
      <div className="footer-grid">
        {/* Brand */}
        <div>
          <OkombaLogoFull height={32}/>
          <p style={{ color:"var(--text-3)", fontSize:"14px", lineHeight:1.7, marginTop:"16px", maxWidth:"280px" }}>
            A premium digital services ecosystem built for modern businesses — combining technology, fintech, media, and operations.
          </p>
          <div style={{ display:"flex", gap:"12px", marginTop:"20px" }}>
            <a href="mailto:support@okomba.com" aria-label="Email" className="btn btn-secondary btn-sm" style={{ padding:"8px" }}>
              <Icon name="mail" size={16}/>
            </a>
            <a href="tel:+2348088948657" aria-label="Phone" className="btn btn-secondary btn-sm" style={{ padding:"8px" }}>
              <Icon name="phone" size={16}/>
            </a>
            <a href="https://wa.me/2348088948657" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="btn btn-secondary btn-sm" style={{ padding:"8px" }}>
              <Icon name="whatsapp" size={16} color="var(--teal)"/>
            </a>
          </div>
        </div>
        {/* Services */}
        <div>
          <h4 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"14px", letterSpacing:"0.04em", marginBottom:"16px", color:"var(--text-1)" }}>Services</h4>
          {["Web Development","Fintech Solutions","Payment Integration","Digital Operations","Event Coordination","Creative Services","Business Consulting"].map(s => (
            <a key={s} className="footer-link" href="#services" onClick={e => { e.preventDefault(); document.getElementById("services")?.scrollIntoView({behavior:"smooth"}); }}>{s}</a>
          ))}
        </div>
        {/* Company */}
        <div>
          <h4 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"14px", letterSpacing:"0.04em", marginBottom:"16px", color:"var(--text-1)" }}>Company</h4>
          {["About Us","Our Process","Contact","Start a Project"].map(s => (
            <a key={s} className="footer-link" href="#" onClick={e => { e.preventDefault(); }}>{s}</a>
          ))}
        </div>
        {/* Contact */}
        <div>
          <h4 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"14px", letterSpacing:"0.04em", marginBottom:"16px", color:"var(--text-1)" }}>Contact</h4>
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            <a href="mailto:support@okomba.com" style={{ color:"var(--text-3)", fontSize:"14px", textDecoration:"none", display:"flex", alignItems:"center", gap:"8px" }} className="footer-link">
              <Icon name="mail" size={14} color="var(--gold)"/> support@okomba.com
            </a>
            <a href="tel:+2348088948657" style={{ color:"var(--text-3)", fontSize:"14px", textDecoration:"none", display:"flex", alignItems:"center", gap:"8px" }} className="footer-link">
              <Icon name="phone" size={14} color="var(--gold)"/> +234 808 894 8657
            </a>
            <a href="https://wa.me/2348088948657" target="_blank" rel="noopener noreferrer" style={{ color:"var(--teal)", fontSize:"14px", textDecoration:"none", display:"flex", alignItems:"center", gap:"8px" }} className="footer-link">
              <Icon name="whatsapp" size={14} color="var(--teal)"/> WhatsApp Direct
            </a>
          </div>
          <button className="btn btn-primary btn-sm" style={{ marginTop:"20px", width:"100%" }} onClick={() => onRequestService(null)}>
            Get Started
          </button>
        </div>
      </div>
      <hr className="divider"/>
      <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"space-between", alignItems:"center", paddingTop:"24px", gap:"12px" }}>
        <p style={{ color:"var(--text-3)", fontSize:"13px" }}>
          © {new Date().getFullYear()} OKOMBA ANALYTICS. All rights reserved.
        </p>
        <div style={{ display:"flex", gap:"16px" }}>
          {["Privacy Policy","Terms of Service"].map(l => (
            <a key={l} href="#" style={{ color:"var(--text-3)", fontSize:"13px", textDecoration:"none" }} onClick={e => e.preventDefault()}>{l}</a>
          ))}
        </div>
        <span className="badge badge-gold" style={{ fontSize:"11px" }}>
          <Icon name="shield" size={10} color="var(--gold)"/>
          Secure & Trusted
        </span>
      </div>
    </div>
  </footer>
);

// ─── INQUIRY MODAL ───────────────────────────────────────────
const INITIAL_FORM = { name:"", email:"", phone:"", whatsapp:"", service:"", addlService:"", message:"" };

const InquiryModal = ({ service, onClose, onSubmit }) => {
  const [form, setForm] = useState({ ...INITIAL_FORM, service: service?.title || "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    if (!form.service.trim()) e.service = "Please select a service";
    if (!form.message.trim()) e.message = "Please add a message";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    saveInquiry(form);
    setLoading(false);
    setSuccess(true);
    onSubmit(form);
    setTimeout(() => { setSuccess(false); onClose(); }, 2500);
  };

  const set = (key, val) => { setForm(f => ({ ...f, [key]:val })); if (errors[key]) setErrors(e => ({ ...e, [key]:undefined })); };

  if (success) return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Success message">
      <div className="modal-box" style={{ textAlign:"center", padding:"48px 36px" }} onClick={e => e.stopPropagation()}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:"rgba(0,201,167,0.12)", border:"2px solid rgba(0,201,167,0.4)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px" }}>
          <Icon name="check" size={32} color="var(--teal)"/>
        </div>
        <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"22px", marginBottom:"12px" }}>Inquiry Submitted!</h3>
        <p style={{ color:"var(--text-2)", fontSize:"15px", lineHeight:1.6, marginBottom:"20px" }}>
          Thank you, <strong style={{ color:"var(--text-1)" }}>{form.name}</strong>! Your request for <strong style={{ color:"var(--gold)" }}>{form.service}</strong> has been received. We'll be in touch shortly.
        </p>
        <p style={{ color:"var(--text-3)", fontSize:"13px" }}>A confirmation has been saved. Our team responds within 24 hours.</p>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding:"28px 28px 0", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <OkombaLogo size={36}/>
            <div>
              <h2 id="modal-title" style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"18px", marginBottom:"2px" }}>Service Inquiry</h2>
              <p style={{ color:"var(--text-3)", fontSize:"12px" }}>We respond within 24 hours</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding:"6px", borderRadius:"8px" }} aria-label="Close modal">
            <Icon name="x" size={18} color="var(--text-2)"/>
          </button>
        </div>
        {service && (
          <div style={{ padding:"14px 28px 0" }}>
            <div style={{ padding:"12px 14px", background:`${service.color}10`, border:`1px solid ${service.color}25`, borderRadius:"10px", display:"flex", alignItems:"center", gap:"10px" }}>
              <Icon name={service.icon} size={16} color={service.color}/>
              <span style={{ fontSize:"13px", color:service.color, fontWeight:500 }}>{service.title}</span>
            </div>
          </div>
        )}
        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={{ padding:"24px 28px 28px" }}>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label" htmlFor="m-name">Full Name <span style={{ color:"#EF4444" }}>*</span></label>
              <input id="m-name" className={`input-field${errors.name?" error":""}`} type="text" placeholder="Your full name"
                value={form.name} onChange={e => set("name",e.target.value)} autoComplete="name"/>
              {errors.name && <p className="input-error" role="alert">{errors.name}</p>}
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="m-email">Email Address <span style={{ color:"#EF4444" }}>*</span></label>
              <input id="m-email" className={`input-field${errors.email?" error":""}`} type="email" placeholder="your@email.com"
                value={form.email} onChange={e => set("email",e.target.value)} autoComplete="email"/>
              {errors.email && <p className="input-error" role="alert">{errors.email}</p>}
            </div>
          </div>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label" htmlFor="m-phone">Phone Number <span style={{ color:"#EF4444" }}>*</span></label>
              <input id="m-phone" className={`input-field${errors.phone?" error":""}`} type="tel" placeholder="+234..."
                value={form.phone} onChange={e => set("phone",e.target.value)} autoComplete="tel"/>
              {errors.phone && <p className="input-error" role="alert">{errors.phone}</p>}
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="m-wa">WhatsApp Number</label>
              <input id="m-wa" className="input-field" type="tel" placeholder="Same or different?"
                value={form.whatsapp} onChange={e => set("whatsapp",e.target.value)}/>
            </div>
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="m-svc">Selected Service <span style={{ color:"#EF4444" }}>*</span></label>
            <select id="m-svc" className={`input-field${errors.service?" error":""}`}
              value={form.service} onChange={e => set("service",e.target.value)}>
              <option value="">— Select a service category —</option>
              {SERVICES.map(s => <option key={s.id} value={s.title}>{s.title}</option>)}
              <option value="Custom / Other">Custom / Other Requirement</option>
            </select>
            {errors.service && <p className="input-error" role="alert">{errors.service}</p>}
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="m-add">Additional Service Request</label>
            <input id="m-add" className="input-field" type="text" placeholder="Any additional services needed?"
              value={form.addlService} onChange={e => set("addlService",e.target.value)}/>
          </div>
          <div className="input-group">
            <label className="input-label" htmlFor="m-msg">Notes / Message <span style={{ color:"#EF4444" }}>*</span></label>
            <textarea id="m-msg" className={`input-field${errors.message?" error":""}`} rows={4}
              placeholder="Describe your project, requirements, timeline, or any questions..."
              value={form.message} onChange={e => set("message",e.target.value)}
              style={{ resize:"vertical", minHeight:"100px" }}/>
            {errors.message && <p className="input-error" role="alert">{errors.message}</p>}
          </div>
          <button type="submit" className="btn btn-primary" style={{ width:"100%", padding:"15px", fontSize:"15px", fontWeight:600 }} disabled={loading}>
            {loading ? <><Icon name="loader" size={18} color="#0B0F1A"/> Processing...</> : <>Submit Inquiry <Icon name="arrow_right" size={18}/></>}
          </button>
          <p style={{ textAlign:"center", color:"var(--text-3)", fontSize:"12px", marginTop:"12px" }}>
            By submitting, you agree to be contacted by OKOMBA ANALYTICS. No spam, ever.
          </p>
        </form>
      </div>
    </div>
  );
};

// ─── TOAST NOTIFICATION ──────────────────────────────────────
const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, []);
  return (
    <div className={`toast toast-${type}`} role="status" aria-live="polite">
      <Icon name={type==="success"?"check":"x"} size={18}/>
      <span>{msg}</span>
      <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", marginLeft:"auto", padding:"2px" }} aria-label="Dismiss notification">
        <Icon name="x" size={14}/>
      </button>
    </div>
  );
};

// ─── ADMIN DASHBOARD ─────────────────────────────────────────
// Credentials are set via Vite environment variables at build time.
// Set VITE_ADMIN_EMAIL and VITE_ADMIN_PASSWORD in your .env file
// or in the Cloudflare Pages environment variables dashboard.
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? "";

const AdminLogin = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    await new Promise(r => setTimeout(r, 800));
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) onLogin();
    else setError("Invalid credentials. Access denied.");
    setLoading(false);
  };
  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-deep)", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
      <div style={{ width:"100%", maxWidth:"420px" }}>
        <div style={{ textAlign:"center", marginBottom:"36px" }}>
          <OkombaLogo size={56} style={{ margin:"0 auto 16px" }}/>
          <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"22px", marginBottom:"6px" }}>Admin Access</div>
          <p style={{ color:"var(--text-3)", fontSize:"14px" }}>OKOMBA ANALYTICS · Secure Portal</p>
        </div>
        <div className="glass" style={{ borderRadius:"var(--radius-lg)", padding:"36px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"10px 14px", background:"rgba(240,165,0,0.06)", border:"1px solid rgba(240,165,0,0.15)", borderRadius:"10px", marginBottom:"24px" }}>
            <Icon name="lock" size={14} color="var(--gold)"/>
            <span style={{ fontSize:"12px", color:"var(--gold)", fontFamily:"'DM Mono',monospace" }}>RESTRICTED ACCESS</span>
          </div>
          <form onSubmit={handleLogin} noValidate>
            <div className="input-group">
              <label className="input-label" htmlFor="a-email">Admin Email</label>
              <input id="a-email" className="input-field" type="email" placeholder="admin@okomba.com"
                value={email} onChange={e => setEmail(e.target.value)} autoComplete="username"/>
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="a-pass">Password</label>
              <input id="a-pass" className="input-field" type="password" placeholder="••••••••••••"
                value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"/>
            </div>
            {error && (
              <div style={{ padding:"10px 14px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"8px", marginBottom:"16px" }}>
                <p style={{ color:"#EF4444", fontSize:"13px" }} role="alert">{error}</p>
              </div>
            )}
            <button type="submit" className="btn btn-primary" style={{ width:"100%", padding:"14px" }} disabled={loading}>
              {loading ? <><Icon name="loader" size={16} color="#0B0F1A"/> Verifying...</> : "Access Dashboard"}
            </button>
          </form>
        </div>
        <p style={{ textAlign:"center", color:"var(--text-3)", fontSize:"12px", marginTop:"16px" }}>
          Unauthorized access is strictly prohibited.
        </p>
      </div>
    </div>
  );
};

const AdminDashboard = ({ onLogout }) => {
  const [tab, setTab] = useState("overview");
  const [inquiries] = useState(getInquiries());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const serviceCounts = SERVICES.reduce((acc, s) => { acc[s.title] = inquiries.filter(i => i.service === s.title).length; return acc; }, {});
  const topService = Object.entries(serviceCounts).sort((a,b) => b[1]-a[1])[0];

  const tabs = [
    { id:"overview", label:"Overview", icon:"bar_chart" },
    { id:"inquiries", label:"Inquiries", icon:"inbox" },
    { id:"services", label:"Services", icon:"layers" },
    { id:"analytics", label:"Analytics", icon:"activity" },
  ];

  const NavItem = ({ t }) => (
    <button className={`admin-nav-item${tab===t.id?" active":""}`} onClick={() => { setTab(t.id); setSidebarOpen(false); }}>
      <Icon name={t.icon} size={16} color={tab===t.id?"var(--gold)":"currentColor"}/> {t.label}
    </button>
  );

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"'DM Sans',sans-serif" }}>
      {/* Sidebar */}
      <aside className={`admin-sidebar${sidebarOpen?" open":""}`} aria-label="Admin navigation">
        <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"28px", paddingBottom:"20px", borderBottom:"1px solid var(--bg-border)" }}>
          <OkombaLogo size={32}/>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"13px" }}>OKOMBA</div>
            <div style={{ fontSize:"11px", color:"var(--text-3)" }}>Admin Portal</div>
          </div>
        </div>
        <nav aria-label="Admin sections">
          <p style={{ fontSize:"11px", color:"var(--text-3)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"8px", paddingLeft:"12px" }}>Dashboard</p>
          {tabs.map(t => <NavItem key={t.id} t={t}/>)}
        </nav>
        <div style={{ marginTop:"32px", paddingTop:"24px", borderTop:"1px solid var(--bg-border)" }}>
          <div style={{ padding:"12px", background:"rgba(255,255,255,0.02)", borderRadius:"10px", marginBottom:"12px" }}>
            <p style={{ fontSize:"12px", color:"var(--text-3)", marginBottom:"3px" }}>Logged in as</p>
            <p style={{ fontSize:"13px", color:"var(--gold)", fontFamily:"'DM Mono',monospace" }}>support@okomba.com</p>
          </div>
          <button className="admin-nav-item" onClick={onLogout} style={{ color:"#EF4444" }}>
            <Icon name="log_out" size={16} color="#EF4444"/> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main" role="main">
        {/* Mobile top bar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display:"none" }} aria-label="Toggle sidebar">
            <Icon name="menu" size={18}/>
          </button>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"20px" }}>
            {tabs.find(t=>t.id===tab)?.label}
          </h1>
          <span className="badge badge-gold">Live</span>
        </div>
        <style>{`@media(max-width:768px){ .admin-main button[aria-label="Toggle sidebar"]{ display:flex!important; } }`}</style>

        {/* Overview Tab */}
        {tab === "overview" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"16px", marginBottom:"28px" }}>
              {[
                { label:"Total Inquiries", val:inquiries.length, icon:"inbox", color:"var(--gold)", change:"+12%" },
                { label:"Services Requested", val:new Set(inquiries.map(i=>i.service).filter(Boolean)).size, icon:"layers", color:"var(--teal)", change:"Active" },
                { label:"Latest Inquiry", val:inquiries[0] ? new Date(inquiries[0].timestamp).toLocaleDateString() : "None", icon:"activity", color:"var(--blue)", change:"Recent" },
                { label:"Top Service", val:topService?.[0]?.split("&")[0]?.trim().slice(0,12)+"..." || "N/A", icon:"star", color:"#8B5CF6", change:topService?.[1]+" req" || "0 req" },
              ].map((m,i) => (
                <div key={i} className="admin-metric">
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"16px" }}>
                    <div style={{ background:`${m.color}15`, borderRadius:"10px", padding:"10px" }}>
                      <Icon name={m.icon} size={18} color={m.color}/>
                    </div>
                    <span style={{ fontSize:"12px", color:"var(--teal)", background:"var(--teal-dim)", padding:"3px 8px", borderRadius:"999px" }}>{m.change}</span>
                  </div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"28px", color:m.color }}>{m.val}</div>
                  <div style={{ fontSize:"13px", color:"var(--text-2)", marginTop:"4px" }}>{m.label}</div>
                </div>
              ))}
            </div>
            <style>{`@media(min-width:640px){ div[style*="repeat(2,1fr)"] { grid-template-columns: repeat(4,1fr)!important; } }`}</style>
            {/* Recent Inquiries */}
            <div className="admin-metric">
              <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"16px", marginBottom:"20px" }}>Recent Inquiries</h3>
              {inquiries.length === 0 ? (
                <div style={{ textAlign:"center", padding:"40px", color:"var(--text-3)" }}>
                  <Icon name="inbox" size={32} color="var(--text-3)"/>
                  <p style={{ marginTop:"12px", fontSize:"14px" }}>No inquiries yet. They will appear here when submitted.</p>
                </div>
              ) : (
                <div style={{ overflowX:"auto" }}>
                  <table className="admin-table">
                    <thead>
                      <tr><th>Name</th><th>Service</th><th>Email</th><th>Date</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {inquiries.slice(0,8).map((inq,i) => (
                        <tr key={inq.id || i}>
                          <td style={{ fontWeight:500 }}>{inq.name}</td>
                          <td><span style={{ fontSize:"12px", color:"var(--gold)", background:"var(--gold-dim)", padding:"3px 8px", borderRadius:"5px" }}>{inq.service?.slice(0,25)}...</span></td>
                          <td style={{ color:"var(--text-2)", fontFamily:"'DM Mono',monospace", fontSize:"12px" }}>{inq.email}</td>
                          <td style={{ color:"var(--text-3)", fontSize:"12px" }}>{new Date(inq.timestamp).toLocaleDateString()}</td>
                          <td><span className="badge badge-teal" style={{ fontSize:"11px" }}>New</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inquiries Tab */}
        {tab === "inquiries" && (
          <div className="admin-metric">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"24px", flexWrap:"wrap", gap:"12px" }}>
              <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"16px" }}>All Inquiries ({inquiries.length})</h3>
              <span className="badge badge-gold">{inquiries.length} Records</span>
            </div>
            {inquiries.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px", color:"var(--text-3)" }}>
                <Icon name="inbox" size={40} color="var(--text-3)"/>
                <p style={{ marginTop:"16px", fontSize:"15px" }}>No inquiries yet.</p>
                <p style={{ fontSize:"13px", marginTop:"8px" }}>Inquiries submitted via the website will appear here.</p>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
                {inquiries.map((inq,i) => (
                  <div key={inq.id||i} style={{ padding:"20px", background:"rgba(255,255,255,0.02)", border:"1px solid var(--bg-border)", borderRadius:"12px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:"8px", marginBottom:"12px" }}>
                      <div>
                        <span style={{ fontWeight:600, fontSize:"15px" }}>{inq.name}</span>
                        <span style={{ fontSize:"12px", color:"var(--text-3)", marginLeft:"10px", fontFamily:"'DM Mono',monospace" }}>{new Date(inq.timestamp).toLocaleString()}</span>
                      </div>
                      <span style={{ fontSize:"12px", color:"var(--gold)", background:"var(--gold-dim)", padding:"4px 10px", borderRadius:"6px" }}>{inq.service}</span>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"12px" }}>
                      <div><span style={{ color:"var(--text-3)", fontSize:"12px" }}>Email: </span><span style={{ fontSize:"13px", fontFamily:"'DM Mono',monospace" }}>{inq.email}</span></div>
                      <div><span style={{ color:"var(--text-3)", fontSize:"12px" }}>Phone: </span><span style={{ fontSize:"13px" }}>{inq.phone}</span></div>
                      {inq.whatsapp && <div><span style={{ color:"var(--text-3)", fontSize:"12px" }}>WhatsApp: </span><span style={{ fontSize:"13px" }}>{inq.whatsapp}</span></div>}
                      {inq.addlService && <div><span style={{ color:"var(--text-3)", fontSize:"12px" }}>Additional: </span><span style={{ fontSize:"13px" }}>{inq.addlService}</span></div>}
                    </div>
                    {inq.message && (
                      <div style={{ padding:"12px", background:"rgba(255,255,255,0.02)", borderRadius:"8px" }}>
                        <p style={{ fontSize:"13px", color:"var(--text-2)", lineHeight:1.6 }}>{inq.message}</p>
                      </div>
                    )}
                    <div style={{ display:"flex", gap:"8px", marginTop:"12px" }}>
                      <a href={`mailto:${inq.email}`} className="btn btn-secondary btn-sm"><Icon name="mail" size={13}/> Reply</a>
                      <a href={`tel:${inq.phone}`} className="btn btn-secondary btn-sm"><Icon name="phone" size={13}/> Call</a>
                      {inq.whatsapp && <a href={`https://wa.me/${inq.whatsapp?.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm"><Icon name="whatsapp" size={13} color="var(--teal)"/> WA</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Services Tab */}
        {tab === "services" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:"12px" }}>
              {SERVICES.map((svc,i) => (
                <div key={svc.id} style={{ display:"flex", alignItems:"center", gap:"16px", padding:"16px 20px", background:"var(--bg-card)", border:"1px solid var(--bg-border)", borderRadius:"12px" }}>
                  <div style={{ background:svc.bg, borderRadius:"10px", padding:"10px", flexShrink:0 }}>
                    <Icon name={svc.icon} size={18} color={svc.color}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:"14px", marginBottom:"2px" }}>{svc.title}</div>
                    <div style={{ fontSize:"12px", color:"var(--text-3)" }}>{svc.subs.length} sub-services · {svc.category}</div>
                  </div>
                  <div style={{ textAlign:"center", flexShrink:0 }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"22px", color:svc.color }}>{serviceCounts[svc.title]||0}</div>
                    <div style={{ fontSize:"11px", color:"var(--text-3)" }}>inquiries</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {tab === "analytics" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:"20px" }}>
              <div className="admin-metric">
                <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"16px", marginBottom:"20px" }}>Service Category Distribution</h3>
                {CATEGORIES.filter(c=>c!=="All").map(cat => {
                  const count = inquiries.filter(i => SERVICES.find(s=>s.title===i.service)?.category===cat).length;
                  const pct = inquiries.length ? Math.round(count/inquiries.length*100) : 0;
                  return (
                    <div key={cat} style={{ marginBottom:"14px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                        <span style={{ fontSize:"13px", color:"var(--text-2)" }}>{cat}</span>
                        <span style={{ fontSize:"13px", color:"var(--text-3)", fontFamily:"'DM Mono',monospace" }}>{count} · {pct}%</span>
                      </div>
                      <div className="progress-bar" style={{ height:"6px" }}>
                        <div className="progress-fill" style={{ width:`${pct||2}%` }}/>
                      </div>
                    </div>
                  );
                })}
                {inquiries.length === 0 && <p style={{ color:"var(--text-3)", fontSize:"13px", textAlign:"center", padding:"20px" }}>Analytics will populate as inquiries are received.</p>}
              </div>
              <div className="admin-metric">
                <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"16px", marginBottom:"16px" }}>System Info</h3>
                {[
                  { label:"Platform", val:"OKOMBA ANALYTICS" },
                  { label:"Admin Email", val:"support@okomba.com" },
                  { label:"Data Storage", val:"LocalStorage (Session)" },
                  { label:"Google Sheets", val:"Ready for Integration" },
                  { label:"Email Automation", val:"Architecture Prepared" },
                  { label:"Cloudflare Pages", val:"Deployment Ready" },
                ].map(item => (
                  <div key={item.label} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid var(--bg-border)" }}>
                    <span style={{ fontSize:"13px", color:"var(--text-3)" }}>{item.label}</span>
                    <span style={{ fontSize:"13px", color:"var(--text-1)", fontFamily:"'DM Mono',monospace" }}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// ─── SCROLL REVEAL HOOK ──────────────────────────────────────
const RevealWatcher = () => {
  useReveal();
  return null;
};

// ─── HOME PAGE ───────────────────────────────────────────────
const HomePage = ({ onRequestService }) => (
  <>
    <RevealWatcher/>
    <Hero onRequestService={onRequestService}/>
    <StatsSection/>
    <ServicesSection onRequestService={onRequestService}/>
    <AboutSection/>
    <ProcessSection/>
    <ContactSection onRequestService={onRequestService}/>
  </>
);

// ─── LOADING SCREEN ──────────────────────────────────────────
const LoadingScreen = ({ onDone }) => {
  const [prog, setProg] = useState(0);
  useEffect(() => {
    const steps = [20,45,70,90,100];
    let i = 0;
    const t = setInterval(() => {
      if (i < steps.length) { setProg(steps[i]); i++; }
      else { clearInterval(t); setTimeout(onDone, 300); }
    }, 200);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ position:"fixed", inset:0, background:"var(--bg-deep)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", zIndex:9999 }}>
      <div style={{ animation:"float 3s ease-in-out infinite", marginBottom:"28px" }}>
        <OkombaLogo size={72}/>
      </div>
      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"24px", marginBottom:"6px", letterSpacing:"-0.02em" }}>
        OKOMBA <span style={{ color:"var(--gold)" }}>ANALYTICS</span>
      </div>
      <p style={{ color:"var(--text-3)", fontSize:"13px", fontFamily:"'DM Mono',monospace", marginBottom:"32px" }}>
        Digital Services Ecosystem
      </p>
      <div style={{ width:"200px", height:"3px", background:"rgba(255,255,255,0.06)", borderRadius:"3px", overflow:"hidden" }}>
        <div style={{ height:"100%", background:"linear-gradient(90deg,var(--gold),var(--gold-light))", borderRadius:"3px", width:`${prog}%`, transition:"width 0.3s ease" }}/>
      </div>
      <p style={{ marginTop:"12px", fontSize:"12px", color:"var(--text-3)", fontFamily:"'DM Mono',monospace" }}>{prog}%</p>
    </div>
  );
};

// ─── ROOT APP ────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home"); // "home" | "admin"
  const [loading, setLoading] = useState(true);
  const [modalService, setModalService] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [toast, setToast] = useState(null);

  // Detect /admin route simulation
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#/admin") setPage("admin");
  }, []);

  const handleRequestService = useCallback((svc) => {
    setModalService(svc);
    setModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setTimeout(() => setModalService(null), 300);
  }, []);

  const handleSubmit = useCallback((data) => {
    setToast({ msg:`Thank you ${data.name}! Your inquiry has been received. We'll respond shortly.`, type:"success" });
  }, []);

  const handleNavigate = useCallback((pg) => {
    setPage(pg);
    window.scrollTo({ top:0, behavior:"smooth" });
  }, []);

  if (loading) return (
    <>
      <FontLoader/>
      <LoadingScreen onDone={() => setLoading(false)}/>
    </>
  );

  if (page === "admin") {
    return (
      <>
        <FontLoader/>
        <div className="noise" aria-hidden="true"/>
        {!adminLoggedIn
          ? <AdminLogin onLogin={() => setAdminLoggedIn(true)}/>
          : <AdminDashboard onLogout={() => { setAdminLoggedIn(false); handleNavigate("home"); }}/>
        }
      </>
    );
  }

  return (
    <>
      <FontLoader/>
      <div className="noise" aria-hidden="true"/>
      <a href="#main" style={{ position:"absolute", left:-9999, top:0, zIndex:9999, padding:"10px 20px", background:"var(--gold)", color:"#0B0F1A", fontWeight:700, borderRadius:"0 0 8px 0" }}
        onFocus={e => { e.currentTarget.style.left="0"; }} onBlur={e => { e.currentTarget.style.left="-9999px"; }}>
        Skip to main content
      </a>
      <Navbar onNavigate={handleNavigate} currentPage={page} onRequestService={handleRequestService}/>
      <main id="main" tabIndex={-1}>
        <HomePage onRequestService={handleRequestService}/>
      </main>
      <Footer onNavigate={handleNavigate} onRequestService={handleRequestService}/>
      {/* Admin link — hidden, discoverable only via URL */}
      <button onClick={() => setPage("admin")} aria-label="Admin portal"
        style={{ position:"fixed", bottom:16, right:16, width:36, height:36, background:"rgba(255,255,255,0.03)", border:"1px solid var(--bg-border)", borderRadius:"50%", cursor:"pointer", opacity:0.3, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Icon name="lock" size={14} color="var(--text-3)"/>
      </button>
      {modalOpen && (
        <InquiryModal service={modalService} onClose={handleModalClose} onSubmit={handleSubmit}/>
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}
    </>
  );
}
