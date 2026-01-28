import clsx from "clsx";
import type { ReactNode } from "react";

type Props = {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  icon?: ReactNode;
  variant?: "primary" | "soft" | "ghost";
  external?: boolean;
  className?: string;
  disabled?: boolean;
};

export function ActionButton({
  href,
  onClick,
  children,
  icon,
  variant = "primary",
  external = true,
  className,
  disabled = false
}: Props) {
  const isLink = Boolean(href);
  const isExternal = isLink && (external || href!.startsWith("http"));
  const variantClasses = {
    primary: "bg-[#f5ab4d] text-ink hover:-translate-y-0.5 hover:bg-[#f7c57a]",
    soft: "bg-[#fad5aa] text-ink border border-orange-100 hover:bg-[#f9cfa0]",
    ghost: "border border-orange-100 bg-white/80 text-ink hover:bg-secondary/70"
  } as const;

  const classes = clsx(
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60",
    variantClasses[variant],
    className
  );

  if (isLink) {
    return (
      <a
        className={classes}
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        aria-disabled={disabled || undefined}
        onClick={disabled ? (e) => e.preventDefault() : undefined}
      >
        {icon ? <span className="text-[18px]">{icon}</span> : null}
        <span>{children}</span>
      </a>
    );
  }

  return (
    <button type="button" className={classes} onClick={onClick} disabled={disabled}>
      {icon ? <span className="text-[18px]">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}
