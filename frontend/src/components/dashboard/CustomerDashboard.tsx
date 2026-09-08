import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "./DashboardLayout";
import DashboardOverview from "./DashboardOverview";
import ShipmentList from "./ShipmentList";
import ShipmentDetails from "./ShipmentDetails";
import ProfileCard from "./ProfileCard";
import SupportCard from "./SupportCard";
import LoadingScreen from "../common/LoadingScreen";
import Alert from "../common/Alert";
import { useAuth } from "../../hooks/useAuth";

type DashboardView =
  | "overview"
  | "shipments"
  | "shipment"
  | "profile"
  | "support";

interface CustomerDashboardProps {
  initialView?: DashboardView;
  initialShipmentId?: string;
}

function getCurrentRoute(): {
  view: DashboardView;
  shipmentId?: string;
} {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";

  if (path === "/dashboard") {
    return { view: "overview" };
  }

  if (path === "/dashboard/shipments") {
    return { view: "shipments" };
  }

  if (path.startsWith("/dashboard/shipments/")) {
    const shipmentId = decodeURIComponent(
      path.slice("/dashboard/shipments/".length),
    );

    return {
      view: "shipment",
      shipmentId: shipmentId || undefined,
    };
  }

  if (path === "/dashboard/profile") {
    return { view: "profile" };
  }

  if (path === "/dashboard/support") {
    return { view: "support" };
  }

  return { view: "overview" };
}

function getRoutePath(view: DashboardView, shipmentId?: string): string {
  switch (view) {
    case "shipments":
      return "/dashboard/shipments";

    case "shipment":
      return shipmentId
        ? `/dashboard/shipments/${encodeURIComponent(shipmentId)}`
        : "/dashboard/shipments";

    case "profile":
      return "/dashboard/profile";

    case "support":
      return "/dashboard/support";

    case "overview":
    default:
      return "/dashboard";
  }
}

export default function CustomerDashboard({
  initialView = "overview",
  initialShipmentId,
}: CustomerDashboardProps) {
  const { user, loading, error, logout } = useAuth();

  const initialRoute = getCurrentRoute();

  const [view, setView] = useState<DashboardView>(
    initialRoute.view || initialView,
  );

  const [shipmentId, setShipmentId] = useState<string | undefined>(
    initialRoute.shipmentId || initialShipmentId,
  );

  /*
   * Keep the component synchronized with browser Back/Forward.
   *
   * App.tsx is the primary application router. This listener is only
   * used to synchronize this protected dashboard shell when the browser
   * history changes; it does not create any new history entries.
   */
  useEffect(() => {
    const handlePopState = () => {
      const route = getCurrentRoute();

      setView(route.view);
      setShipmentId(route.shipmentId);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  /*
   * Synchronize route props supplied by App.tsx.
   *
   * This uses state only. It intentionally does not call pushState,
   * preventing duplicate history entries.
   */
  useEffect(() => {
    setView(initialView);
    setShipmentId(initialShipmentId);
  }, [initialView, initialShipmentId]);

  /*
   * Dashboard navigation is deliberately centralized here.
   *
   * A navigation is ignored when the requested route is already active.
   * Otherwise a single pushState entry is created.
   */
  const navigate = useCallback(
    (
      nextView: DashboardView,
      nextShipmentId?: string,
      replace = false,
    ) => {
      const nextPath = getRoutePath(nextView, nextShipmentId);
      const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";

      if (currentPath === nextPath) {
        setView(nextView);
        setShipmentId(nextShipmentId);
        return;
      }

      if (replace) {
        window.history.replaceState({}, "", nextPath);
      } else {
        window.history.pushState({}, "", nextPath);
      }

      setView(nextView);
      setShipmentId(nextShipmentId);

      /*
       * Notify App.tsx so its centralized route state remains current.
       */
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    [],
  );

  const handleLogout = useCallback(async () => {
    await logout();

    /*
     * Replace rather than push. A signed-out user should not be able
     * to press Back and land on the protected dashboard route.
     */
    window.history.replaceState({}, "", "/login");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, [logout]);

  if (loading) {
    return <LoadingScreen message="Loading your dashboard..." fullScreen />;
  }

  if (!user) {
    /*
     * Authentication is handled by the shared auth hook.
     *
     * Do not push a history entry for the redirect.
     */
    if (window.location.pathname !== "/login") {
      window.history.replaceState({}, "", "/login");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }

    return null;
  }

  const renderView = () => {
    switch (view) {
      case "shipments":
        return (
          <ShipmentList
            onSelectShipment={(id) => navigate("shipment", id)}
          />
        );

      case "shipment":
        if (!shipmentId) {
          navigate("shipments", undefined, true);
          return null;
        }

        return (
          <ShipmentDetails
            shipmentId={shipmentId}
            onBack={() => navigate("shipments")}
          />
        );

      case "profile":
        return <ProfileCard user={user} />;

      case "support":
        return <SupportCard />;

      case "overview":
      default:
        return (
          <DashboardOverview
            onViewShipments={() => navigate("shipments")}
            onSelectShipment={(id) => navigate("shipment", id)}
          />
        );
    }
  };

  return (
    <DashboardLayout
      user={user}
      activeView={view}
      onNavigate={(nextView) => navigate(nextView)}
      onLogout={handleLogout}
    >
      {error && (
        <Alert variant="error" title="Dashboard error">
          {error}
        </Alert>
      )}

      {renderView()}
    </DashboardLayout>
  );
}