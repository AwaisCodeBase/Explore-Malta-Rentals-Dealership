import type { ReactNode } from "react";
import { normalizeUrl, getEnvValue } from "./footer-utils";

type SocialLinkProps = Readonly<{
  href: string;
  label: string;
  children: ReactNode;
}>;

function SocialLink({ href, label, children }: SocialLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={[
        "flex h-11 w-11 items-center justify-center rounded-full text-[var(--ink-300)]",
        "shadow-[inset_0_0_0_1px_var(--line-inverse)]",
        "transition-[background-color,color,box-shadow,transform] duration-[var(--dur-base)] ease-[var(--ease-out-expo)]",
        "hover:bg-white hover:text-[var(--ink-950)] hover:shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.9),0_10px_24px_-12px_rgb(255_255_255_/_0.45)]",
        "motion-safe:hover:-translate-y-0.5 active:translate-y-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange-400)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink-950)]",
      ].join(" ")}
    >
      {children}
    </a>
  );
}

export function FooterSocialLinks() {
  const facebook = normalizeUrl(getEnvValue("facebook"));
  const instagram = normalizeUrl(getEnvValue("Instagram"));
  const tikTok = normalizeUrl(getEnvValue("TikTok"));
  const linkedIn = normalizeUrl(getEnvValue("linkedin", "LinkedIn", "NEXT_PUBLIC_LINKEDIN"));
  const twitter = normalizeUrl(getEnvValue("twitter", "NEXT_PUBLIC_TWITTER", "x", "X"));

  const items: Array<{ href: string; label: string; node: ReactNode } | null> = [
    facebook
      ? {
          href: facebook,
          label: "Facebook",
          node: (
            <svg className="h-[1.1rem] w-[1.1rem]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.025 4.388 11.02 10.125 11.927V15.56H7.078V12.07h3.047V9.413c0-3.021 1.792-4.69 4.534-4.69 1.313 0 2.686.236 2.686.236v2.967h-1.514c-1.49 0-1.956.93-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.093 24 18.098 24 12.073Z" />
            </svg>
          ),
        }
      : null,
    instagram
      ? {
          href: instagram,
          label: "Instagram",
          node: (
            <svg className="h-[1.1rem] w-[1.1rem]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Zm10 1.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
            </svg>
          ),
        }
      : null,
    tikTok
      ? {
          href: tikTok,
          label: "TikTok",
          node: (
            <svg className="h-[1.05rem] w-[1.05rem]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M14 3h3.2a4.8 4.8 0 0 0 3.8 3.7V10a8 8 0 0 1-4-1.1v6.5a6.4 6.4 0 1 1-5.4-6.3V12a3.4 3.4 0 1 0 2.4 3.2V3Z" />
            </svg>
          ),
        }
      : null,
    twitter
      ? {
          href: twitter,
          label: "X",
          node: (
            <svg className="h-[1rem] w-[1rem]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          ),
        }
      : null,
    linkedIn
      ? {
          href: linkedIn,
          label: "LinkedIn",
          node: (
            <svg className="h-[1.05rem] w-[1.05rem]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8h4V23h-4V8zm7.5 0h3.8v2.05h.05c.53-1 1.84-2.05 3.79-2.05 4.05 0 4.8 2.67 4.8 6.14V23h-4v-6.07c0-1.45-.03-3.32-2.02-3.32-2.02 0-2.33 1.58-2.33 3.2V23h-4V8z" />
            </svg>
          ),
        }
      : null,
  ];

  const resolved = items.filter(Boolean) as Array<{
    href: string;
    label: string;
    node: ReactNode;
  }>;

  if (resolved.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2.5">
      {resolved.map(({ href, label, node }) => (
        <SocialLink key={label} href={href} label={label}>
          {node}
        </SocialLink>
      ))}
    </div>
  );
}
