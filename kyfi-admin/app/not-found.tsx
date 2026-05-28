import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-medium">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">The requested KYFI admin page does not exist in this frontend build.</p>
      <Button asChild><Link href="/dashboard">Back to dashboard</Link></Button>
    </main>
  );
}
