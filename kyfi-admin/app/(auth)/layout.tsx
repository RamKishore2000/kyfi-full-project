export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[1fr_0.9fr]">
        <section className="flex items-center justify-center px-6 py-10">
          {children}
        </section>
        <section className="hidden border-l bg-slate-950 text-white lg:flex lg:flex-col lg:justify-between lg:p-10">
          <div>
            <div className="mb-10 inline-flex rounded-lg bg-white/10 px-3 py-2 text-sm font-medium">KYFI</div>
            <h1 className="max-w-lg text-4xl font-medium tracking-tight">Operational command center for trusted farmer intelligence.</h1>
          </div>
          <div className="grid gap-3">
            {["Farmer verification", "Dealer approvals", "Blacklist governance"].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
