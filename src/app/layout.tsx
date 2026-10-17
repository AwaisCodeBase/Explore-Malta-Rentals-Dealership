import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import { StripFdprocessedId } from "@/components/strip-fdprocessedid";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

/*
 * Display face for headings only. Its optical-size axis keeps large headlines
 * characterful while staying quiet at card-title sizes. Latin-only by design —
 * non-Latin locales fall through to the body face and then the system stack.
 */
const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  axes: ["opsz"],
});

const FAVICON_PATH = "/explore%20malta%20rentals%20logo%20favicon.png";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  icons: {
    icon: {
      url: FAVICON_PATH,
      type: "image/png",
      sizes: "any",
    },
    apple: { url: FAVICON_PATH, type: "image/png" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${bricolageGrotesque.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body
        className="flex min-h-dvh flex-col overflow-x-clip bg-[var(--background)] pb-[env(safe-area-inset-bottom)] font-sans text-[var(--foreground)]"
        suppressHydrationWarning
      >
        <StripFdprocessedId />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
