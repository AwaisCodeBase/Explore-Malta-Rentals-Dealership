import { HOME_HERO } from "@/lib/site-brand-copy";

export const heroContent = {
  location: HOME_HERO.location,
  title: HOME_HERO.title,
  description: HOME_HERO.description,
  primaryAction: {
    href: "/booking",
    label: "Book Your Ride",
  },
  secondaryAction: {
    href: "#fleet-preview",
    label: "View Fleet",
  },
  media: {
    backgroundSrc: "/warehouse background.png",
  },
} as const;

export const heroTrustItems = [
  "Guided tours available",
  "Well-maintained vehicles",
  "Service-focused, safety-minded team",
] as const;

export const heroBookingFields = [
  {
    label: "Pick-up location",
    value: "enter your location",
  },
  {
    label: "Vehicle type",
    value: "All vehicles",
  },
  {
    label: "Pick-up date",
    value: "12 Jun 2026",
  },
] as const;
