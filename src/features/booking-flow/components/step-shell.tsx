import type { PropsWithChildren, ReactNode } from "react";

type StepShellProps = PropsWithChildren<{
  title: string;
  description: string;
  footer?: ReactNode;
}>;

export function StepShell({ title, description, footer, children }: StepShellProps) {
  return (
    <section className="surface-panel p-5 sm:p-6">
      <header>
        <h2 className="type-h3 text-[var(--text-primary)]">{title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
      </header>

      <hr className="rule-fade mt-5" />

      <div className="mt-5">{children}</div>

      {footer ? <div className="mt-5">{footer}</div> : null}
    </section>
  );
}
