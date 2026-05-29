import { Footer } from "@/components/kyfi/footer";
import { Header } from "@/components/kyfi/header";
import { SearchFarmerPreview } from "@/components/kyfi/search-farmer-preview";

export default function SearchFarmerStatusPage() {
  return (
    <main className="kyfi-shell min-h-screen">
      <Header />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full">
          <SearchFarmerPreview />
        </div>
      </section>
      <Footer />
    </main>
  );
}
