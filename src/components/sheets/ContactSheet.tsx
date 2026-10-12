import { useEffect, useState } from 'react';
import { contactLinks, profile } from '../../data/cv';
import { s } from '../../lib/camera';

/** How long the "COPIED" hologram stays up (ms) — matches `copiedHolo` in the CSS. */
const COPIED_FOR = 1900;

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API unavailable (insecure origin / old browser): fall back to a hidden field.
    const field = document.createElement('textarea');
    field.value = text;
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand('copy');
    field.remove();
    return ok;
  }
}

export function ContactSheet() {
  // Counts successful copies, so a repeat click replays the hologram.
  const [copied, setCopied] = useState(0);
  const [showCopied, setShowCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setShowCopied(false), COPIED_FOR);
    return () => window.clearTimeout(t);
  }, [copied]);

  const onCopy = async () => {
    if (!(await copyText(profile.email))) return;
    setShowCopied(true);
    setCopied((n) => n + 1);
  };

  return (
    <div className="contact">
      <div className="contact-cta">
        <p className="contact-line">
          Like what you see?
          <br />
          Get in touch.
        </p>
        <p className="contact-sub">Drop me a line about a role, a project or just to say hi. Email is the quickest way to reach me.</p>
        <div className="rise contact-mailbox" style={{ animationDelay: s(1.3) }}>
          <a className="contact-mail" href={`mailto:${profile.email}`}>
            {profile.email} →
          </a>
          <div className="contact-copyrow">
            <button type="button" className="bp-btn contact-copy" onClick={onCopy}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <rect x="5.5" y="5.5" width="9" height="9" />
                <path d="M10.5 5.5v-4h-9v9h4" />
              </svg>
              COPY EMAIL
            </button>
            <span className="contact-copied-slot" role="status" aria-live="polite">
              {showCopied && (
                <span key={copied} className="contact-copied">
                  ✓ COPIED
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="contact-links">
        {contactLinks.map((l, i) => (
          <a
            key={l.k}
            className="bp-btn contact-link"
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ animationDelay: `${s(1.5 + i * 0.15)}, ${s(1.7 + i * 0.15)}` }}
          >
            <span className="k">{l.k}</span>
            {l.v} ↗
          </a>
        ))}
        <div className="contact-based">
          <span>BASED IN</span>
          <span>{profile.location}</span>
        </div>
      </div>
    </div>
  );
}
