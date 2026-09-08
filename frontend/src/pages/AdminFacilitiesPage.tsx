import {
  useEffect,
  useState,
} from "react";

import Alert from "../components/common/Alert";
import Button from "../components/common/Button";
import Input from "../components/common/Input";

import {
  createAdminFacility,
  deleteAdminFacility,
  getAdminFacilities,
} from "../lib/api";

import type {
  Facility,
} from "../types";

export default function AdminFacilitiesPage() {
  const [
    facilities,
    setFacilities,
  ] = useState<Facility[]>(
    []
  );

  const [name, setName] =
    useState("");

  const [code, setCode] =
    useState("");

  const [city, setCity] =
    useState("");

  const [state, setState] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  async function load() {
    try {
      setFacilities(
        await getAdminFacilities()
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load facilities."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    if (!name.trim()) {
      setError(
        "Facility name is required."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      await createAdminFacility({
        name: name.trim(),
        code: code.trim(),
        city: city.trim(),
        state: state.trim(),
        country: "United States",
      });

      setName("");
      setCode("");
      setCity("");
      setState("");

      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create facility."
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(
    id: string
  ) {
    if (
      !window.confirm(
        "Remove this facility?"
      )
    ) {
      return;
    }

    try {
      await deleteAdminFacility(
        id
      );

      setFacilities(
        (current) =>
          current.filter(
            (facility) =>
              facility.id !== id
          )
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to remove facility."
      );
    }
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
              Facilities
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

        {error && (
          <Alert
            variant="error"
            title="Facility management"
          >
            {error}
          </Alert>
        )}

        <section className="admin-panel">
          <h2>
            Add facility
          </h2>

          <div className="admin-form-grid">
            <Input
              label="Name"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
            />

            <Input
              label="Code"
              value={code}
              onChange={(event) =>
                setCode(
                  event.target.value
                )
              }
            />

            <Input
              label="City"
              value={city}
              onChange={(event) =>
                setCity(
                  event.target.value
                )
              }
            />

            <Input
              label="State"
              value={state}
              onChange={(event) =>
                setState(
                  event.target.value
                )
              }
            />
          </div>

          <Button
            loading={saving}
            onClick={create}
          >
            Add facility
          </Button>
        </section>

        <section className="admin-panel">
          <h2>
            Facilities
          </h2>

          {loading ? (
            <div className="loading-state">
              Loading facilities...
            </div>
          ) : (
            <div className="admin-list">
              {facilities.map(
                (facility) => (
                  <div
                    className="admin-list__row"
                    key={facility.id}
                  >
                    <div>
                      <strong>
                        {
                          facility.name
                        }
                      </strong>

                      <span>
                        {facility.code ??
                          "No code"}{" "}
                        ·{" "}
                        {facility.city ??
                          "—"}
                        {facility.state
                          ? `, ${facility.state}`
                          : ""}
                      </span>
                    </div>

                    <Button
                      variant="danger"
                      onClick={() =>
                        remove(
                          facility.id
                        )
                      }
                    >
                      Remove
                    </Button>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}