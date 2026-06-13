/**
 * BecaHub Logo Component
 * Premium scholarship portal branding.
 * Variants: full, mark, horizontal
 */

interface BecaHubLogoProps {
  variant?: "full" | "mark" | "horizontal";
  className?: string;
}

export function BecaHubLogo({ variant = "full", className = "" }: BecaHubLogoProps) {
  const baseClasses = className;

  if (variant === "mark") {
    return (
      <svg
        viewBox="0 0 64 64"
        className={`${baseClasses}`}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="BecaHub logo mark"
      >
        {/* Petróleo B */}
        <text
          x="32"
          y="45"
          fontSize="42"
          fontWeight="700"
          textAnchor="middle"
          fill="#004451"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          B
        </text>
        {/* Guinda H - slight overlap */}
        <text
          x="42"
          y="45"
          fontSize="36"
          fontWeight="700"
          fill="#800020"
          fontFamily="system-ui, -apple-system, sans-serif"
          opacity="0.85"
        >
          H
        </text>
        {/* Subtle curve lower arc */}
        <path
          d="M 12 50 Q 32 58 52 50"
          stroke="#800020"
          strokeWidth="1.5"
          fill="none"
          opacity="0.4"
        />
        {/* Sparkle */}
        <circle cx="50" cy="12" r="2" fill="#800020" opacity="0.6" />
        <line x1="50" y1="10" x2="50" y2="14" stroke="#800020" strokeWidth="1" opacity="0.6" />
        <line x1="48" y1="12" x2="52" y2="12" stroke="#800020" strokeWidth="1" opacity="0.6" />
      </svg>
    );
  }

  if (variant === "horizontal") {
    return (
      <svg
        viewBox="0 0 240 64"
        className={`${baseClasses}`}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="BecaHub logo horizontal"
      >
        {/* Petróleo B */}
        <text
          x="20"
          y="45"
          fontSize="38"
          fontWeight="700"
          fill="#004451"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          B
        </text>
        {/* Guinda H */}
        <text
          x="38"
          y="45"
          fontSize="38"
          fontWeight="700"
          fill="#800020"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          H
        </text>
        {/* Text "Beca" in neutral */}
        <text
          x="70"
          y="42"
          fontSize="22"
          fontWeight="600"
          fill="#1A1A1A"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          Beca
        </text>
        {/* Text "Hub" in teal */}
        <text
          x="130"
          y="42"
          fontSize="22"
          fontWeight="600"
          fill="#004451"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          Hub
        </text>
        {/* Subtle underline curve */}
        <path
          d="M 20 50 L 200 50"
          stroke="#004451"
          strokeWidth="1"
          opacity="0.3"
        />
      </svg>
    );
  }

  // Default: full variant
  return (
    <svg
      viewBox="0 0 200 240"
      className={`${baseClasses}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="BecaHub logo full"
    >
      {/* Petróleo B - larger */}
      <text
        x="50"
        y="110"
        fontSize="70"
        fontWeight="700"
        fill="#004451"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        B
      </text>
      {/* Guinda H - overlapping */}
      <text
        x="90"
        y="110"
        fontSize="70"
        fontWeight="700"
        fill="#800020"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        H
      </text>

      {/* Text "BecaHub" below */}
      <text
        x="100"
        y="155"
        fontSize="24"
        fontWeight="600"
        fill="#1A1A1A"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        BecaHub
      </text>

      {/* Subtle curve */}
      <path
        d="M 30 165 Q 100 180 170 165"
        stroke="#800020"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
      />

      {/* Sparkle in top right */}
      <circle cx="150" cy="30" r="3" fill="#800020" opacity="0.5" />
      <line x1="150" y1="26" x2="150" y2="34" stroke="#800020" strokeWidth="1.5" opacity="0.5" />
      <line x1="146" y1="30" x2="154" y2="30" stroke="#800020" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}
