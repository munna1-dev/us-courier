import { useEffect } from "react";

import AdminUserScreen from "../components/admin/AdminUserPage";

type AdminUserPageMode =
  | "details"
  | "new"
  | "edit";

interface AdminUserPageProps {
  userId?: string;
  mode?: AdminUserPageMode;
}

export default function AdminUserPage({
  userId,
  mode = "details",
}: AdminUserPageProps) {
  useEffect(() => {
    const titles: Record<
      AdminUserPageMode,
      string
    > = {
      details: "User Details — Dispatch Courier",
      new: "Create User — Dispatch Courier",
      edit: "Edit User — Dispatch Courier",
    };

    document.title = titles[mode];
  }, [mode]);

  return (
    <AdminUserScreen
      userId={userId}
      mode={mode}
    />
  );
}