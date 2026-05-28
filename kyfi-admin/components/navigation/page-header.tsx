import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  eyebrow?: string;
};

export function PageHeader({ title, description, actions, eyebrow = "Andhra Pradesh & Telangana" }: PageHeaderProps) {
  return (
    <div className="mb-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <div className="min-w-0">
        <p className="mb-2 inline-flex rounded-full border bg-card px-3 py-1 text-xs font-semibold uppercase leading-none text-primary shadow-sm">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-semibold tracking-normal text-foreground md:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 items-center justify-start gap-2 md:justify-end">{actions}</div> : null}
    </div>
  );
}
