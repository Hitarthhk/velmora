import type { Claim } from "@/content/site";

/** Renders a claim and flags it visibly until the brand verifies it. */
export function ClaimText({ claim, className }: { claim: Claim; className?: string }) {
  return (
    <p className={className}>
      {claim.text}
      {!claim.verified && <PendingTag />}
    </p>
  );
}

export function PendingTag({ children = "Pending verification" }: { children?: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        marginLeft: 10,
        padding: "2px 8px",
        border: "1px dashed rgba(201,164,92,0.6)",
        borderRadius: 4,
        fontFamily: "var(--font-body)",
        fontStyle: "normal",
        fontSize: 9,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "var(--gold)",
        verticalAlign: "middle",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
