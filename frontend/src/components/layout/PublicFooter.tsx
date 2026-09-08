export default function PublicFooter() {
  return (
    <footer className="site-footer">
      <div className="page-shell site-footer__inner">
        <div>
          <strong>
            US Courier
          </strong>

          <p>
            Reliable shipment
            tracking and delivery
            management.
          </p>
        </div>

        <div className="site-footer__links">
          <a href="/">
            Home
          </a>

          <a href="/tracking">
            Track shipment
          </a>

          <a href="/login">
            Sign in
          </a>

          <a href="/signup">
            Create account
          </a>
        </div>
      </div>

      <div className="page-shell site-footer__bottom">
        ©{" "}
        {new Date().getFullYear()}{" "}
        US Courier. All rights
        reserved.
      </div>
    </footer>
  );
}