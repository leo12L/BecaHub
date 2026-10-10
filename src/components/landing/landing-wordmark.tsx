export function LandingWordmark({
  inverted = false,
  size = "md",
}: {
  inverted?: boolean;
  size?: "sm" | "md";
}) {
  const color = inverted ? "#ffffff" : "var(--lf-green)";
  const textClass = size === "sm" ? "text-[1.05rem]" : "text-[1.15rem]";

  return (
    <span className={`lf-wordmark ${textClass}`}>
      <svg
        viewBox="0 0 24 24"
        width={size === "sm" ? 16 : 18}
        height={size === "sm" ? 16 : 18}
        aria-hidden="true"
      >
        <path
          d="M12 20c0-6 3.2-9.4 7.2-11.2-.8 4.2-3.1 6.6-7.2 7.4C7.9 15.4 5.6 13 4.8 8.8 8.8 10.6 12 14 12 20Z"
          fill={color}
        />
        <path
          d="M12 20c0-5.2-2.4-8.6-6.2-10.6C6.6 5.6 9 3.8 12 3c3 0.8 5.4 2.6 6.2 6.4C14.4 11.4 12 14.8 12 20Z"
          fill={color}
          opacity="0.72"
        />
      </svg>
      BecaHub
    </span>
  );
}
