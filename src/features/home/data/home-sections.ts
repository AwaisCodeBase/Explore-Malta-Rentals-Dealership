export type ChooseUsPickerOptionId = "125cc" | "50cc";

export const chooseUsPickerOptions = [
  { id: "125cc", image: "/choose-us-images/125cc.png" },
  { id: "50cc", image: "/choose-us-images/50cc.png" },
] as const satisfies ReadonlyArray<{
  readonly id: ChooseUsPickerOptionId;
  readonly image: string;
}>;

export const defaultChooseUsPickerOptionId: ChooseUsPickerOptionId = "125cc";

export const aboutBusiness = {
  title: "About the Business",
  tagline:
    "Choose the right ride, get clear guidance, and explore Malta with confidence.",
  /** Shown as a pricing callout in the about section (matches entry fleet rates). */
  pricingFromLabel: "From €10 / day",
  pricingFromSupporting:
    "Straightforward daily rates on selected scooters and bikes — check each vehicle for full pricing, deposits, and add-ons.",
  /** Filename under `public/BikeImages/` */
  backgroundImage: "lex moto grey.png",
  paragraphs: [
    "We rent motorcycles, ATVs, and bikes from Pietà, Malta, so exploring the island feels straightforward, not stressful.",
    "We help you pick the right vehicle and plan; our team is safety-minded, service-focused, and built for visitors.",
  ],
} as const;

export const testimonials = [
  {
    id: "t1",
    name: "Marta",
    location: "Tourist",
    rating: 5,
    date: "Jun 01, 2024",
    quote:
      "Pickup was smooth, the bike felt like new, and we had the best day exploring around Malta.",
  },
  {
    id: "t2",
    name: "Daniel",
    location: "Weekend rider",
    rating: 5,
    date: "Nov 09, 2024",
    quote:
      "Clear instructions, friendly support, and great recommendations for where to go. Highly recommend!",
  },
  {
    id: "t3",
    name: "Sofia",
    location: "Family trip",
    rating: 5,
    date: "Oct 17, 2024",
    quote:
      "Perfect for our Malta plan. Comfortable ride, quick communication, and a super easy process.",
  },
] as const;

export const servicesHighlights = [
  {
    id: "easy-pickup",
    title: "Easy pickup",
    description:
      "A fast, organised handover — you’re on the road sooner, not stuck at the desk.",
  },
  {
    id: "helmets",
    title: "Helmets and phone holders included",
    description: "Safety-first kit bundled with your rental — no last-minute surprises.",
  },
  {
    id: "flexible",
    title: "Flexible rental periods",
    description: "Pick the days that fit your Malta plan — short stays or longer adventures.",
  },
  {
    id: "support",
    title: "Tourist-friendly support",
    description: "Clear answers, local tips, and quick help when you need it.",
  },
  {
    id: "hotel-delivery",
    title: "Hotel delivery / return",
    description: "Where it applies, we can help with convenient drop-off and collection.",
  },
] as const;

/** Headline icon strip — wider set than benefit cards for even spacing between title lines. */
export const servicesHeadlineIcons = [
  "easy-pickup",
  "helmets",
  "flexible",
  "online-booking",
  "support",
  "hotel-delivery",
  "route-tips",
] as const;

/**
 * Final homepage CTA (above footer). Copy tuned for emotion + conversion.
 *
 * Headline variants (A/B ideas):
 * - "The island is waiting — make it yours."
 * - "Your Malta story starts the moment you turn the key."
 * - "Coast, culture, open road — on your clock, not a tour bus’s."
 * - "Tomorrow’s memories start with today’s booking."
 *
 * Primary CTA label variants:
 * - "Start your journey" · "Book your ride" · "Explore rentals" · "Reserve your dates"
 *
 * Secondary: keep "Contact us" or "Chat on WhatsApp" if linking to WhatsApp.
 */
export const quickBookingCta = {
  kicker: "Your next chapter",
  titleLines: ["Malta is waiting,", "Make it yours."],
  bodyMuted:
    "Explore Malta Rentals, your go-to choice to experience Malta your way. From affordable self-drive options to guided tours, we are passionate about helping locals and visitors experience the beauty of Malta in the most free, flexible, and affordable way possible.",
  bodyClose: "It starts with one booking.",
  primaryCta: { href: "/booking", label: "Start your journey" },
  secondaryCta: { href: "#contact", label: "Contact us" },
} as const;

export const contactSection = {
  title: "Contact us",
  description:
    "Call, message, or visit — we’re here to help you choose the right ride. Your mobile number and map location are below.",
} as const;

/**
 * Fleet marquee categories (home strip). `id` maps to the i18n key under
 * `Home.fleetMarquee.<id>`.
 */
export const fleetMarqueeItems = [
  { id: "premiumBikes" },
  { id: "scooters" },
  { id: "cityRides" },
  { id: "adventureRides" },
  { id: "longRental" },
] as const;

/** "How it works" steps. `id` maps to `Home.howItWorks.steps.<id>`. */
export const howItWorksSteps = ["choose", "schedule", "ride"] as const;

/** Compact stat cards in the services section. `id` maps to `Home.stats.<id>`. */
export const homeStats = [
  "support",
  "pickup",
  "helmets",
  "duration",
] as const;

