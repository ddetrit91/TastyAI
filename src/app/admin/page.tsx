import { redirect } from "next/navigation";
import { AdminPage } from "@/components/admin/AdminPage";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminRoutePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (user.role !== "admin") {
    redirect("/");
  }

  return <AdminPage />;
}
