import { Clock3 } from "lucide-react";

export function ModuleComingSoon({ title }: { title: string }) {
  return (
    <section className="rounded-md border border-border bg-card px-6 py-16 text-center shadow-tile">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
        <Clock3 className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-card-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        This report is coming soon. Its tile, page, and access permission are ready for the live data connection.
      </p>
    </section>
  );
}