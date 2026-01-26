import clsx from "clsx";
import type { ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
  variant?: "primary" | "soft" | "ghost";
  external?: boolean;
  className?: string;
};

export function ActionButton({ href, children, icon, variant = "primary", external = true, className }: Props) {
  const isExternal = external || href.startsWith("http");
  const variantClasses = {
    primary: "bg-[#f5ab4d] text-ink hover:-translate-y-0.5 hover:bg-[#f7c57a]",
    soft: "bg-[#fad5aa] text-ink border border-orange-100 hover:bg-[#f9cfa0]",
    ghost: "border border-orange-100 bg-white/80 text-ink hover:bg-secondary/70"
  } as const;

  const classes = clsx(
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-0",
    variantClasses[variant],
    className
  );

  return (
    <a className={classes} href={href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noopener noreferrer" : undefined}>
      {icon ? <span className="text-[18px]">{icon}</span> : null}
      <span>{children}</span>
    </a>
  );
}
