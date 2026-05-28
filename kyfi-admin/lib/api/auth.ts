import { KYFI_API_BASE_URL } from "@/lib/config";

export async function loginAdmin(input: {
  mobile: string;
  password: string;
}) {
  const response = await fetch(`${KYFI_API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mobile: input.mobile,
      password: input.password,
      mode: "password",
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Login failed");
  }

  return data as {
    message: string;
    token: string;
    dealer: {
      role?: string;
      mobile?: string;
      name?: string;
    };
  };
}
