import { useEffect } from "react";

import AdminFacilityScreen from "../components/admin/AdminFacilityPage";

interface AdminFacilityPageProps {
  facilityId?: string;
}

export default function AdminFacilityPage({
  facilityId,
}: AdminFacilityPageProps) {
  useEffect(() => {
    document.title = facilityId
      ? "Facility Details — Dispatch Courier"
      : "Facility Management — Dispatch Courier";
  }, [facilityId]);

  return (
    <AdminFacilityScreen
      facilityId={facilityId}
    />
  );
}