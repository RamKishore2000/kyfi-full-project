import { AuthGuard } from "@/components/kyfi/auth-guard";

export default function AddToBlacklistPage() {
  // Redirect disabled while blacklist UI is commented out across the frontend.
  return <AuthGuard>{null}</AuthGuard>;
}
