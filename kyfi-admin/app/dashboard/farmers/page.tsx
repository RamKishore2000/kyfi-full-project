import { PageHeader } from "@/components/navigation/page-header";
import { FarmerTable } from "@/components/tables/farmer-table";

export default function FarmersPage() {
  return (
    <>
      <PageHeader
        title="Farmer records"
        description="Search, filter, inspect, and review farmer status records by district, mandal, village, status, and date."
      />
      <FarmerTable />
    </>
  );
}
