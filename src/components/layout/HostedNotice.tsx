import { useEffect, useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';

// One-time notice shown when the app is being served from a public hosting
// origin (e.g. *.pages.dev). Reminds clinicians that data is browser-local
// and not safe for real patient records without further hardening
// (Cloudflare Access, hospital VPN, a real backend).
//
// Dismissed permanently per browser via localStorage. Local dev (localhost,
// 127.0.0.1) skips this entirely — clinicians who self-host on their own
// machine don't need the warning.

const STORAGE_KEY = 'moromoke_hosted_notice_dismissed';

function isHostedPublicly(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  if (!host) return false;
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) return false;
  // IPv4/IPv6 private ranges shouldn't trigger either
  if (/^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2[0-9]|3[01])\./.test(host)) return false;
  return true;
}

export default function HostedNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isHostedPublicly()) return;
    if (localStorage.getItem(STORAGE_KEY) === '1') return;
    setShow(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-md bg-amber-50 border-2 border-amber-300 shadow-xl rounded-xl p-4">
      <div className="flex gap-3">
        <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
          <ShieldAlert size={18} className="text-amber-700" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-amber-900 text-sm">Data stays in your browser</p>
          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
            Everything you enter — patients, vitals, audit log, drug stock — lives in this browser's local storage on this device only.
            Other clinicians on different devices see an empty system. Clearing browser data wipes it permanently.
            <strong className="block mt-1">Do not enter real patient information unless this site is behind Cloudflare Access (or your hospital VPN) and you have a backup strategy.</strong>
          </p>
          <button
            onClick={dismiss}
            className="mt-2 text-xs font-medium text-amber-900 underline hover:text-amber-700"
          >
            Got it — don't show again on this browser
          </button>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-amber-700 hover:text-amber-900 flex-shrink-0 self-start"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
