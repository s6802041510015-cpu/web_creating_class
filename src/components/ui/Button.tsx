import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = {
  children: ReactNode;
  to?: string;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
};

export function Button({
  children,
  to,
  variant = "primary",
  disabled = false,
  className = "",
  onClick,
  type = "button",
}: Props) {
  const classes = `button button--${variant} ${className}`.trim();
  if (to && !disabled)
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  return (
    <button
      className={classes}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
