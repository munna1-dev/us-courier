import { useEffect, useState } from "react";

import Alert from "../components/common/Alert";

import {
  getStoredUser,
  isManagementUser,
  refreshAuth,
} from "../lib/auth";

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({
  children,
}: AdminGuardProps) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      const storedUser = getStoredUser();

      if (!storedUser) {
        if (mounted) {
          window.location.href = "/login";
        }
        return;
      }

      try {
        const user =
          await refreshAuth();

        if (!mounted) {
          return;
        }

        if (!user || !isManagementUser(user)) {
          setAllowed(false);
          return;
        }

        setAllowed(true);
      } catch {
        if (mounted) {
          setAllowed(false);
        }
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    }

    void checkAccess();

    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return (
      <main className="dashboard-page">
        <div className="page-shell loading-state">
          Verifying management access...
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="dashboard-page">
        <div className="page-shell">
          <Alert
            variant="error"
            title="Management access denied"
          >
            Your account is not authorized
            to access the US Courier
            management portal.
          </Alert>

          <p>
            <a href="/dashboard">
              Return to your dashboard
            </a>
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
