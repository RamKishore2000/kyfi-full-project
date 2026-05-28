"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/cards/error-state";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="space-y-4">
      <ErrorState message="Something went wrong while rendering this dashboard view." />
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
