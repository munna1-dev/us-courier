import {
  useEffect,
  useState,
} from "react";

import Alert from "../components/common/Alert";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Select from "../components/common/Select";

interface Settings {
  companyName: string;
  supportEmail: string;
  supportPhone: string;
  timezone: string;
  currency: string;
  trackingPrefix: string;
  defaultService: string;
  defaultWeightUnit: string;
  publicTracking: boolean;
  publicSignup: boolean;
}

const STORAGE_KEY =
  "uscourier_admin_settings";

const DEFAULT_SETTINGS: Settings = {
  companyName:
    "US Courier",
  supportEmail:
    "support@uscourier.app",
  supportPhone: "",
  timezone:
    "America/New_York",
  currency: "USD",
  trackingPrefix:
    "USC",
  defaultService:
    "standard",
  defaultWeightUnit:
    "lb",
  publicTracking: true,
  publicSignup: true,
};

export default function AdminSettingsPage() {
  const [
    settings,
    setSettings,
  ] = useState<Settings>(
    DEFAULT_SETTINGS
  );

  const [saved, setSaved] =
    useState(false);

  useEffect(() => {
    try {
      const value =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (value) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...JSON.parse(value),
        });
      }
    } catch {
      // Use defaults.
    }
  }, []);

  function update<K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) {
    setSettings(
      (current) => ({
        ...current,
        [key]: value,
      })
    );

    setSaved(false);
  }

  function save() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(settings)
    );

    setSaved(true);
  }

  return (
    <main className="dashboard-page">
      <div className="page-shell">
        <div className="dashboard-header">
          <div>
            <p className="page-eyebrow">
              Administration
            </p>

            <h1>
              Settings
            </h1>
          </div>

          <Button
            variant="secondary"
            onClick={() =>
              (window.location.href =
                "/admin")
            }
          >
            ← Dashboard
          </Button>
        </div>

        {saved && (
          <Alert
            variant="success"
            title="Settings saved"
          >
            Your settings have been
            saved on this device.
          </Alert>
        )}

        <section className="admin-panel">
          <h2>
            Company
          </h2>

          <div className="admin-form-grid">
            <Input
              label="Company name"
              value={
                settings.companyName
              }
              onChange={(event) =>
                update(
                  "companyName",
                  event.target.value
                )
              }
            />

            <Input
              label="Support email"
              type="email"
              value={
                settings.supportEmail
              }
              onChange={(event) =>
                update(
                  "supportEmail",
                  event.target.value
                )
              }
            />

            <Input
              label="Support phone"
              value={
                settings.supportPhone
              }
              onChange={(event) =>
                update(
                  "supportPhone",
                  event.target.value
                )
              }
            />
          </div>
        </section>

        <section className="admin-panel">
          <h2>
            Regional settings
          </h2>

          <div className="admin-form-grid">
            <Select
              label="Currency"
              value={
                settings.currency
              }
              options={[
                {
                  value: "USD",
                  label:
                    "USD — US Dollar",
                },
                {
                  value: "EUR",
                  label:
                    "EUR — Euro",
                },
                {
                  value: "GBP",
                  label:
                    "GBP — British Pound",
                },
                {
                  value: "CAD",
                  label:
                    "CAD — Canadian Dollar",
                },
                {
                  value: "AUD",
                  label:
                    "AUD — Australian Dollar",
                },
                {
                  value: "NGN",
                  label:
                    "NGN — Nigerian Naira",
                },
                {
                  value: "GHS",
                  label:
                    "GHS — Ghanaian Cedi",
                },
                {
                  value: "KES",
                  label:
                    "KES — Kenyan Shilling",
                },
                {
                  value: "ZAR",
                  label:
                    "ZAR — South African Rand",
                },
                {
                  value: "INR",
                  label:
                    "INR — Indian Rupee",
                },
                {
                  value: "JPY",
                  label:
                    "JPY — Japanese Yen",
                },
                {
                  value: "CNY",
                  label:
                    "CNY — Chinese Yuan",
                },
              ]}
              onChange={(event) =>
                update(
                  "currency",
                  event.target.value
                )
              }
            />

            <Input
              label="Timezone"
              value={
                settings.timezone
              }
              onChange={(event) =>
                update(
                  "timezone",
                  event.target.value
                )
              }
            />

            <Input
              label="Tracking prefix"
              value={
                settings.trackingPrefix
              }
              onChange={(event) =>
                update(
                  "trackingPrefix",
                  event.target.value
                )
              }
            />
          </div>
        </section>

        <section className="admin-panel">
          <h2>
            Shipment defaults
          </h2>

          <div className="admin-form-grid">
            <Input
              label="Default service"
              value={
                settings.defaultService
              }
              onChange={(event) =>
                update(
                  "defaultService",
                  event.target.value
                )
              }
            />

            <Select
              label="Weight unit"
              value={
                settings.defaultWeightUnit
              }
              options={[
                {
                  value: "lb",
                  label:
                    "Pounds (lb)",
                },
                {
                  value: "kg",
                  label:
                    "Kilograms (kg)",
                },
                {
                  value: "oz",
                  label:
                    "Ounces (oz)",
                },
                {
                  value: "g",
                  label:
                    "Grams (g)",
                },
              ]}
              onChange={(event) =>
                update(
                  "defaultWeightUnit",
                  event.target.value
                )
              }
            />
          </div>
        </section>

        <section className="admin-panel">
          <h2>
            Public access
          </h2>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={
                settings.publicTracking
              }
              onChange={(event) =>
                update(
                  "publicTracking",
                  event.target.checked
                )
              }
            />

            <span>
              Enable public shipment
              tracking
            </span>
          </label>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={
                settings.publicSignup
              }
              onChange={(event) =>
                update(
                  "publicSignup",
                  event.target.checked
                )
              }
            />

            <span>
              Allow public account
              registration
            </span>
          </label>
        </section>

        <div className="admin-actions">
          <Button
            onClick={save}
          >
            Save settings
          </Button>
        </div>
      </div>
    </main>
  );
}