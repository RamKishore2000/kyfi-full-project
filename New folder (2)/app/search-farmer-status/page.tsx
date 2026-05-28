import { Footer } from "@/components/kyfi/footer";
import { Header } from "@/components/kyfi/header";
import { SearchFarmerPreview } from "@/components/kyfi/search-farmer-preview";

export default function SearchFarmerStatusPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full">
          <SearchFarmerPreview />
        </div>
      </section>
      <Footer />
    </main>
  );
}
