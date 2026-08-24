import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Okomba logo mark — compact serif "O" initial inside a dark rounded square.
 * Derived from the official brand wordmark. Works on light & dark backgrounds.
 */
export function OkombaMark({ size = 38, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Okomba Analytics logo mark"
    >
      <rect width="100" height="100" rx="24" fill="#0B0F1A" />
      <rect width="100" height="100" rx="24" fill="none" stroke="rgba(240,165,0,0.28)" strokeWidth="1.5" />
      <text
        x="50"
        y="52"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="62"
        fontWeight="700"
        fill="#FFFFFF"
      >
        O
      </text>
      <circle cx="79" cy="24" r="5" fill="#F0A500" />
    </svg>
  );
}

/**
 * Official logo — the real brand asset (black squircle badge with white
 * "Okomba" serif wordmark + italic "Analytics"). Transparent PNG, 1308×428.
 * On dark surfaces pass onDark — a brighter hairline ring + soft lift
 * keeps the black badge crisply defined.
 */
export function OkombaLogo({
  height = 34,
  className,
  priority = false,
  onDark = false,
}: {
  height?: number;
  className?: string;
  priority?: boolean;
  onDark?: boolean;
}) {
  const width = Math.round(height * (1308 / 428));
  return (
    <span
      className={cn(
        "inline-flex overflow-hidden rounded-[22%/100%]",
        onDark ? "ring-1 ring-white/40" : "ring-1 ring-black/10",
        className
      )}
      style={{
        boxShadow: onDark
          ? "0 0 0 1px rgba(255,255,255,0.1), 0 0 0 3px rgba(255,255,255,0.05), 0 6px 22px rgba(0,0,0,0.6), 0 0 32px rgba(255,201,77,0.14)"
          : "0 2px 12px rgba(20,25,38,0.18)",
      }}
    >
      <Image
        src="/images/logo.png"
        alt="Okomba Analytics"
        width={width}
        height={height}
        priority={priority}
        className="block h-auto w-auto"
        sizes={`${width}px`}
      />
    </span>
  );
}

/**
 * Navbar lockup — official logo at nav size. Crisp, branded, compact.
 */
export function OkombaNavLogo({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <OkombaLogo height={36} priority onDark={onDark} />
    </span>
  );
}
