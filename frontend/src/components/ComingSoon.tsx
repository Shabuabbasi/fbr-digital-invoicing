import { PageHeader } from "./PageHeader";
import { EmptyState } from "./EmptyState";

// Placeholder for modules scheduled in later phases (docs/DEVELOPMENT-PLAN.md).
// Kept as real routes (not left out) so navigation/RBAC can be verified end-to-end now.
export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <EmptyState title={`${title} is coming in ${phase}`} description="This module hasn't been built yet." />
    </div>
  );
}
