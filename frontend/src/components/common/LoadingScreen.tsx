/* =========================================================
   Dispatch Courier
   Loading Screen
   ========================================================= */

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}


/* =========================================================
   Component
   ========================================================= */

export default function LoadingScreen({
  message = "Loading Dispatch Courier...",
  fullScreen = true,
}: LoadingScreenProps) {
  return (
    <div
      className={
        fullScreen
          ? "app-loading app-loading--fullscreen"
          : "app-loading"
      }
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div
        className="app-loading__mark"
        aria-hidden="true"
      >
        DC
      </div>

      <div
        className="app-loading__spinner"
        aria-hidden="true"
      />

      <p>
        {message}
      </p>
    </div>
  );
}