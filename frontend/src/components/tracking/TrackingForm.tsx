import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Button from "../common/Button";
import Input from "../common/Input";

interface TrackingFormProps {
  initialValue?: string;

  loading?: boolean;

  onSubmit: (
    trackingNumber: string
  ) => void;
}

export default function TrackingForm({
  initialValue = "",
  loading = false,
  onSubmit,
}: TrackingFormProps) {
  const [value, setValue] =
    useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    onSubmit(value);
  }

  return (
    <form
      className="tracking-form"
      onSubmit={handleSubmit}
    >
      <Input
        label="Tracking number"
        value={value}
        onChange={(event) =>
          setValue(
            event.target.value
          )
        }
        placeholder="Enter tracking number"
        autoComplete="off"
        disabled={loading}
        required
      />

      <Button
        type="submit"
        loading={loading}
        disabled={
          loading ||
          !value.trim()
        }
      >
        Track shipment
      </Button>
    </form>
  );
}