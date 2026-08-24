"use client";

import {
  Code2,
  Wallet,
  Zap,
  Settings,
  CalendarDays,
  BookOpen,
  Video,
  Palette,
  Database,
  GraduationCap,
  HeartPulse,
  Headphones,
  Briefcase,
  Users,
  ClipboardList,
  Workflow,
  Rocket,
  Target,
  Layers,
  Gauge,
  ShieldCheck,
  Handshake,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  code: Code2,
  wallet: Wallet,
  zap: Zap,
  settings: Settings,
  calendar: CalendarDays,
  book: BookOpen,
  video: Video,
  palette: Palette,
  database: Database,
  graduation: GraduationCap,
  heart: HeartPulse,
  headphones: Headphones,
  briefcase: Briefcase,
  users: Users,
  clipboard: ClipboardList,
  workflow: Workflow,
  rocket: Rocket,
  target: Target,
  layers: Layers,
  gauge: Gauge,
  shield: ShieldCheck,
  handshake: Handshake,
  sparkles: Sparkles,
};

export function ServiceIcon({ name, size = 20, className }: { name: string; size?: number; className?: string }) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon size={size} className={className} strokeWidth={1.8} aria-hidden="true" />;
}
