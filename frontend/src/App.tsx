import {
  useEffect,
  useState,
} from "react";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import TrackingPage from "./pages/TrackingPage";
import DashboardPage from "./pages/DashboardPage";

import AdminPage from "./pages/AdminPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminUserPage from "./pages/AdminUserPage";
import AdminCouriersPage from "./pages/AdminCouriersPage";
import AdminFacilitiesPage from "./pages/AdminFacilitiesPage";
import AdminFacilityPage from "./pages/AdminFacilityPage";
import AdminShipmentsPage from "./pages/AdminShipmentsPage";
import AdminShipmentPage from "./pages/AdminShipmentPage";
import AdminTrackingPage from "./pages/AdminTrackingPage";
import AdminReportsPage from "./pages/AdminReportsPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import AdminGuard from "./pages/AdminGuard";

function getPathname(): string {
  return window.location.pathname
    .replace(/\/+$/, "") || "/";
}

function navigate(path: string): void {
  if (window.location.pathname !== path) {
    window.history.pushState({}, "", path);
  }

  window.dispatchEvent(
    new PopStateEvent("popstate")
  );
}

function renderPage(
  pathname: string
): React.ReactNode {
  if (pathname === "/") {
    return <HomePage />;
  }

  if (pathname === "/login") {
    return <LoginPage />;
  }

  if (pathname === "/signup") {
    return <SignupPage />;
  }

  if (
    pathname === "/tracking" ||
    pathname === "/track"
  ) {
    return <TrackingPage />;
  }

  if (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/")
  ) {
    return <DashboardPage />;
  }

  if (
    pathname === "/admin" ||
    pathname === "/admin/dashboard"
  ) {
    return <AdminGuard><AdminPage /></AdminGuard>;
  }

  if (
    pathname === "/admin/users" ||
    pathname === "/admin/users/"
  ) {
    return <AdminGuard><AdminUsersPage /></AdminGuard>;
  }

  if (
    /^\/admin\/users\/[^/]+$/.test(
      pathname
    )
  ) {
    return <AdminGuard><AdminUserPage /></AdminGuard>;
  }

  if (
    pathname === "/admin/couriers" ||
    pathname === "/admin/couriers/"
  ) {
    return <AdminGuard><AdminCouriersPage /></AdminGuard>;
  }

  if (
    pathname === "/admin/facilities" ||
    pathname === "/admin/facilities/"
  ) {
    return <AdminGuard><AdminFacilitiesPage /></AdminGuard>;
  }

  if (
    /^\/admin\/facilities\/[^/]+$/.test(
      pathname
    )
  ) {
    return <AdminGuard><AdminFacilityPage /></AdminGuard>;
  }

  if (
    pathname === "/admin/shipments" ||
    pathname === "/admin/shipments/"
  ) {
    return <AdminGuard><AdminShipmentsPage /></AdminGuard>;
  }

  if (
    /^\/admin\/shipments\/[^/]+$/.test(
      pathname
    )
  ) {
    return <AdminGuard><AdminShipmentPage /></AdminGuard>;
  }

  if (
    pathname === "/admin/tracking" ||
    pathname === "/admin/tracking/"
  ) {
    return <AdminGuard><AdminTrackingPage /></AdminGuard>;
  }

  if (
    pathname === "/admin/reports" ||
    pathname === "/admin/reports/"
  ) {
    return <AdminGuard><AdminReportsPage /></AdminGuard>;
  }

  if (
    pathname === "/admin/settings" ||
    pathname === "/admin/settings/"
  ) {
    return <AdminGuard><AdminSettingsPage /></AdminGuard>;
  }

  return (
    <HomePage />
  );
}

export default function App() {
  const [
    pathname,
    setPathname,
  ] = useState<string>(
    getPathname
  );

  useEffect(() => {
    const handlePopState = () => {
      setPathname(getPathname());
    };

    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, []);

  useEffect(() => {
    const handleLinkClick = (
      event: MouseEvent
    ) => {
      const target =
        event.target instanceof Element
          ? event.target.closest(
              "a[href]"
            )
          : null;

      if (
        !target ||
        !(target instanceof HTMLAnchorElement)
      ) {
        return;
      }

      const href =
        target.getAttribute("href");

      if (
        !href ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("//") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.target === "_blank" ||
        target.hasAttribute("download")
      ) {
        return;
      }

      if (!href.startsWith("/")) {
        return;
      }

      event.preventDefault();

      navigate(href);
    };

    document.addEventListener(
      "click",
      handleLinkClick
    );

    return () => {
      document.removeEventListener(
        "click",
        handleLinkClick
      );
    };
  }, []);

  return renderPage(pathname);
}