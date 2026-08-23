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
 * Full horizontal logo lockup — official black pill wordmark
 * (Georgia serif "Okomba" + italic "Analytics"), preserved from the brand asset.
 */
export function OkombaLogoFull({ height = 34, className }: { height?: number; className?: string }) {
  const width = Math.round(height * 3.28);
  return (
    <svg
      width={width}
      height={height}
      viewBox="190 50 420 128"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Okomba Analytics"
    >
      <rect x="195" y="55" width="410" height="118" rx="22" fill="#000000" />
      <rect
        x="195"
        y="55"
        width="410"
        height="118"
        rx="22"
        fill="none"
        stroke="rgba(240,165,0,0.25)"
        strokeWidth="1"
      />
      <text
        x="400"
        y="135"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', Times, serif"
        fontSize="96"
        fontWeight="700"
        fill="#FFFFFF"
        letterSpacing="-1"
      >
        Okomba
      </text>
      <text
        x="585"
        y="162"
        fontFamily="Georgia, 'Times New Roman', Times, serif"
        fontSize="22"
        fontStyle="italic"
        fill="#F0A500"
        textAnchor="end"
      >
        Analytics
      </text>
    </svg>
  );
}

/**
 * Navbar lockup — mark + compact wordmark text. Crisp at small sizes.
 */
export function OkombaNavLogo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <OkombaMark size={36} />
      <span className="flex flex-col leading-none">
        <span
          className="text-[19px] font-bold text-foreground"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "-0.02em" }}
        >
          Okomba
        </span>
        <span className="eyebrow mt-1 text-[9px] text-gold">Analytics</span>
      </span>
    </span>
  );
}
