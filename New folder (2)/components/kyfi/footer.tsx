export function Footer() {
  return (
    <footer id="contact" className="border-t border-border bg-white/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-4">
          <div>
            <div className="font-manrope type-card text-slate-900">KYFI</div>
            <div className="font-manrope type-small text-slate-500">
              Know Your Farmer Information
            </div>
          </div>
          <p className="max-w-md font-manrope type-body">
            A trusted farmer credit reputation platform for pesticide dealers across Andhra Pradesh and Telangana.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:col-span-2">
          <div className="space-y-3">
            <p className="font-manrope type-nav text-slate-900">Links</p>
            <ul className="space-y-2 font-manrope type-body text-slate-600">
              <li>
                <a
                  className="font-manrope type-nav text-slate-600 transition hover:text-primary"
                  href="/dashboard"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  className="font-manrope type-nav text-slate-600 transition hover:text-primary"
                  href="/search-farmer-status"
                >
                  Search Farmer Status
                </a>
              </li>
              <li>
                <a
                  className="font-manrope type-nav text-slate-600 transition hover:text-primary"
                  href="/add-farmer-status"
                >
                  Add Farmer Status
                </a>
              </li>
              <li>
                <a
                  className="font-manrope type-nav text-slate-600 transition hover:text-primary"
                  href="/add-to-blacklist"
                >
                  Add to Blacklist
                </a>
              </li>
              <li>
                <a
                  className="font-manrope type-nav text-slate-600 transition hover:text-primary"
                  href="/blacklist-browser"
                >
                  Blacklist Browser
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="font-manrope type-nav text-slate-900">Policies</p>
            <ul className="space-y-2 font-manrope type-body text-slate-600">
              <li>
                <a
                  className="font-manrope type-nav text-slate-600 transition hover:text-primary"
                  href="/privacy-policy"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  className="font-manrope type-nav text-slate-600 transition hover:text-primary"
                  href="/terms-of-use"
                >
                  Terms of Use
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="font-manrope type-nav text-slate-900">Contact</p>
            <ul className="space-y-2 font-manrope type-body text-slate-600">
              <li>Andhra Pradesh &amp; Telangana</li>
              <li>Support for dealers</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-border/80 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-4 font-manrope type-body text-slate-600 sm:px-6 lg:px-8">
          © 2026 KYFI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
