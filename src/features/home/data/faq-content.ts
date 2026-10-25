export const faqItems = [
  {
    id: "trial",
    question: "How do I book a bike or scooter?",
    answer:
      "Use the booking form at the top of this page to choose pick-up location, vehicle type, and pick-up date. You can also message us on WhatsApp and we will walk you through availability and the best option for your trip.",
  },
  {
    id: "plan",
    question: "What licence do I need for 50cc vs 125cc?",
    answer:
      "Requirements depend on your licence and local rules. Tell us what licence you hold when you book and we will confirm which categories you can ride. We prioritise safety and compliance on every rental.",
  },
  {
    id: "cancel",
    question: "What is your cancellation policy?",
    answer:
      "Cancellations made more than 48 hours before the scheduled rental start time are eligible for a 50% refund of the booking amount. Explore Malta Rentals retains the remaining 50%. Cancellations made within 48 hours of the scheduled rental start time are non-refundable, and the full booking amount is retained.",
  },
  {
    id: "invoice",
    question: "Are helmets and safety gear included?",
    answer:
      "Yes — helmets are included with rentals, along with a phone holder accessory for navigation. If you need a specific helmet size or have other safety questions, tell us when you book so we can have everything ready at handover.",
  },
  {
    id: "billing",
    question: "How does pricing and billing work?",
    answer:
      "Rates are based on your rental period and vehicle category. You will see what applies before you confirm. For exact quotes or longer hires, WhatsApp us with your dates.",
  },
  {
    id: "email",
    question: "Can I return the bike somewhere other than Pietà?",
    answer:
      "It depends on the vehicle and dates. Message us on WhatsApp with your plans and we will confirm whether return elsewhere or hotel delivery is possible.",
  },
  {
    id: "support",
    question: "How does support work for tourists?",
    answer:
      "We are set up for visitors: clear handover instructions, practical tips for riding in Malta, and quick help on WhatsApp if something comes up during your rental.",
  },
  {
    id: "tutorials",
    question: "Do you offer guided tours?",
    answer:
      "Yes. We offer rentals plus guided tours so you can explore Malta with support if you prefer not to go alone. Ask when you book and we will share what is running during your stay.",
  },
  {
    id: "projects",
    question: "Can I extend my rental once I am in Malta?",
    answer:
      "Often yes, subject to availability. Message us before your return time and we will do our best to extend your booking.",
  },
  {
    id: "team",
    question: "Do I need to leave a deposit?",
    answer:
      "Deposit and ID requirements are explained at booking confirmation. If you are unsure, send us a WhatsApp message and we will outline exactly what is needed for your chosen vehicle.",
  },
] as const;

export const faqIntro = {
  title: "Frequently Asked Questions",
  /** Text before the WhatsApp callout (icon + label rendered in the section). */
  subtitleLead:
    "Can't find what you're looking for? Reach out on ",
  /** Text after the WhatsApp callout. */
  subtitleTail: " or use the contact section below.",
} as const;
