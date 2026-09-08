import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  description?: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export default function AuthCard({
  title,
  description,
  eyebrow,
  children,
  footer,
  className = "",
}: AuthCardProps) {
  const cardClassName = [
    "auth-card",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={cardClassName}>
      <div className="auth-card__header">
        {eyebrow && (
          <p className="auth-card__eyebrow">
            {eyebrow}
          </p>
        )}

        <h1 className="auth-card__title">
          {title}
        </h1>

        {description && (
          <p className="auth-card__description">
            {description}
          </p>
        )}
      </div>

      <div className="auth-card__body">
        {children}
      </div>

      {footer && (
        <div className="auth-card__footer">
          {footer}
        </div>
      )}
    </section>
  );
}