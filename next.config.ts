import type { NextConfig } from "next";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const awsBucket = process.env.AWS_S3_BUCKET?.trim();
const awsRegion = process.env.AWS_REGION?.trim();
const awsHosts = awsBucket
  ? [
      `${awsBucket}.s3.amazonaws.com`,
      ...(awsRegion ? [`${awsBucket}.s3.${awsRegion}.amazonaws.com`] : []),
    ]
  : [];

type PublicAssetManifest = {
  assets?: Record<string, string>;
};

function loadPublicAssetRewriteEntries(): Array<{ source: string; destination: string }> {
  const manifestPath = resolve(process.cwd(), "public-asset-s3-manifest.json");
  if (!existsSync(manifestPath)) {
    return [];
  }

  try {
    const raw = readFileSync(manifestPath, "utf8");
    const parsed = JSON.parse(raw) as PublicAssetManifest;
    const assets = parsed.assets ?? {};
    return Object.entries(assets)
      .filter(([source, destination]) => source.startsWith("/") && destination.startsWith("https://"))
      .map(([source, destination]) => ({ source, destination }));
  } catch (error) {
    console.warn("[next.config] Failed to parse public-asset-s3-manifest.json", error);
    return [];
  }
}

const nextConfig: NextConfig = {
  experimental: {
    /* Lets the App Router wrap client navigations in `document.startViewTransition`,
       so the crossfade in globals.css runs on route changes. */
    viewTransition: true,
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "motion",
      "@mui/material",
      "@mui/x-date-pickers",
    ],
  },
  async rewrites() {
    const publicAssetRewrites = loadPublicAssetRewriteEntries();
    return [
      {
        source: "/favicon.ico",
        destination: "/explore%20malta%20rentals%20logo%20favicon.png",
      },
      {
        source: "/design-renewal",
        destination: "/design-renewal/Explore-Malta-Rentals-design-renewal.html",
      },
      {
        source: "/design-renewal/",
        destination: "/design-renewal/Explore-Malta-Rentals-design-renewal.html",
      },
      ...publicAssetRewrites,
    ];
  },
  /* Maps server-only .env key to client so UI can read the number */
  env: {
    NEXT_PUBLIC_WHATSAPP_NUMBER:
      process.env.whatsapp_number ??
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
      "",
    NEXT_PUBLIC_BOOKING_ENABLED: process.env.BOOKING_ENABLED ?? "true",
    NEXT_PUBLIC_BOOKING_DISABLED_MESSAGE:
      process.env.BOOKING_DISABLED_MESSAGE ?? "",
  },
  images: {
    /* Default in Next 16 is [75]; `quality={80}` in components must be listed here */
    qualities: [60, 75, 80],
    remotePatterns: [
      /* Unsplash stock photos */
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      ...awsHosts.map((hostname) => ({
        protocol: "https" as const,
        hostname,
        pathname: "/**",
      })),
    ],
  },
};

export default withNextIntl(nextConfig);
