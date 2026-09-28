export default function ConversationIllustration({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 140"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="55" cy="65" r="28" stroke="rgb(var(--color-ink))" strokeWidth="1.5" />
      <circle cx="145" cy="60" r="24" stroke="rgb(var(--color-ink))" strokeWidth="1.5" />
      <path
        d="M42 60c3-6 9-9 13-9s9 3 11 8"
        stroke="rgb(var(--color-ink))"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M134 56c2.5-5 7-7.5 11-7.5s7.5 2.5 9 6.5"
        stroke="rgb(var(--color-ink))"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M86 60c6 2 12 2 18 0"
        stroke="#FF385C"
        strokeWidth="2"
        strokeLinecap="round"
        className="animate-approach"
      />
      <path
        d="M86 70c6 2 12 2 16 0"
        stroke="#00A699"
        strokeWidth="2"
        strokeLinecap="round"
        className="animate-approach"
        style={{ animationDelay: "0.4s" }}
      />
      <path
        d="M20 110c40-14 120-14 160 0"
        stroke="rgb(var(--color-border))"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}
