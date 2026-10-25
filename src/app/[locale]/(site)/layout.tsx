import { SiteNavbar } from "@/components/site-navbar";
import { MotionProvider } from "@/components/motion/motion-provider";
import { Footer } from "@/features/home/components/footer";
import { WhatsAppFloatingButton } from "@/features/home/components/whatsapp-floating-button";

type SiteLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <MotionProvider>
      <SiteNavbar />
      <div className="flex flex-1 flex-col gap-0">
        {children}
        <Footer />
      </div>
      <WhatsAppFloatingButton />
    </MotionProvider>
  );
}
