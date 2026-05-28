import { Sidebar } from "@/components/navigation/sidebar";
import { TopNavbar } from "@/components/navigation/top-navbar";
import { AuthGuard } from "@/components/auth-guard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <TopNavbar />
          <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
