"use client";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background">
      <div className="flex min-h-screen items-center justify-center px-6 py-10">
        <section className="flex items-center justify-center px-6 py-10">
          {children}
        </section>
      </div>
    </main>
  );
}
