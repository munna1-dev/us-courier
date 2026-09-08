import { useAuth } from "../../hooks/useAuth";

export default function PublicHeader() {
  const {
    user,
    authenticated,
    signOut,
  } = useAuth();

  const navigate = (
    path: string
  ) => {
    window.history.pushState(
      {},
      "",
      path
    );

    window.dispatchEvent(
      new PopStateEvent(
        "popstate"
      )
    );
  };

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <header className="site-header">
      <div className="page-shell site-header__inner">
        <a
          href="/"
          className="brand"
        >
          <span className="brand__mark">
            UC
          </span>

          <span>
            <strong>
              US Courier
            </strong>

            <small>
              Delivery & Tracking
            </small>
          </span>
        </a>

        <nav className="site-nav">
          <a href="/">
            Home
          </a>

          <a href="/tracking">
            Track
          </a>

          {authenticated ? (
            <>
              <a
                href={
                  user?.role ===
                    "admin" ||
                  user?.role ===
                    "manager" ||
                  user?.role ===
                    "courier"
                    ? "/admin"
                    : "/dashboard"
                }
              >
                Dashboard
              </a>

              <button
                type="button"
                className="site-nav__button"
                onClick={
                  handleSignOut
                }
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <a href="/login">
                Sign in
              </a>

              <a
                href="/signup"
                className="site-nav__button site-nav__button--primary"
              >
                Create account
              </a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}