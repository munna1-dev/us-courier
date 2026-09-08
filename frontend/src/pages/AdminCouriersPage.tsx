import {
  useEffect,
  useState,
} from "react";

import Alert from "../components/common/Alert";
import Button from "../components/common/Button";
import Input from "../components/common/Input";

import {
  createAdminCourier,
  deleteAdminCourier,
  getAdminCouriers,
} from "../lib/api";

import type {
  Courier,
} from "../types";

export default function AdminCouriersPage() {
  const [couriers, setCouriers] =
    useState<Courier[]>([]);

  const [
    firstName,
    setFirstName,
  ] = useState("");

  const [
    lastName,
    setLastName,
  ] = useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  async function load() {
    setLoading(true);

    try {
      setCouriers(
        await getAdminCouriers()
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load couriers."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim()
    ) {
      setError(
        "First name, last name, and email are required."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      await createAdminCourier({
        first_name:
          firstName.trim(),
        last_name:
          lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });

      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");

      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create courier."
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
        "Remove this courier?"
      )
    ) {
      return;
    }

    try {
      await deleteAdminCourier(
        id
      );

      setCouriers(
        (current) =>
          current.filter(
            (courier) =>
              courier.id !== id
          )
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to remove courier."
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
              Couriers
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
            title="Courier management"
          >
            {error}
          </Alert>
        )}

        <section className="admin-panel">
          <h2>
            Add courier
          </h2>

          <div className="admin-form-grid">
            <Input
              label="First name"
              value={firstName}
              onChange={(event) =>
                setFirstName(
                  event.target.value
                )
              }
            />

            <Input
              label="Last name"
              value={lastName}
              onChange={(event) =>
                setLastName(
                  event.target.value
                )
              }
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
            />

            <Input
              label="Phone"
              value={phone}
              onChange={(event) =>
                setPhone(
                  event.target.value
                )
              }
            />
          </div>

          <Button
            loading={saving}
            onClick={create}
          >
            Add courier
          </Button>
        </section>

        <section className="admin-panel">
          <h2>
            Courier list
          </h2>

          {loading ? (
            <div className="loading-state">
              Loading couriers...
            </div>
          ) : (
            <div className="admin-list">
              {couriers.map(
                (courier) => (
                  <div
                    className="admin-list__row"
                    key={courier.id}
                  >
                    <div>
                      <strong>
                        {courier.first_name ??
                          courier.firstName ??
                          ""}{" "}
                        {courier.last_name ??
                          courier.lastName ??
                          ""}
                      </strong>

                      <span>
                        {courier.email ??
                          "No email"}
                      </span>
                    </div>

                    <Button
                      variant="danger"
                      onClick={() =>
                        remove(
                          courier.id
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