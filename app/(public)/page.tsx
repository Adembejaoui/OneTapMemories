import MarketingNavbar  from "@/components/layout/MarketingNavbar";
import HeroSection      from "@/components/layout/HeroSection";
import CarouselSection  from "@/components/layout/CarouselSection";
import FAQSection       from "@/components/layout/FAQSection";
import ContactSection   from "@/components/layout/ContactSection";
import MarketingFooter  from "@/components/layout/MarketingFooter";

export const metadata = {
  title:       "Framevault — Collective event memories",
  description: "Create a shared photo event, share one link, and watch your guests fill a collective gallery in real time.",
};

export default function MarketingPage() {
  return (
    <div
      className="film-page-grain film-page-vignette"
      style={{ background: "var(--film-bg)", color: "var(--film-text-primary)" }}
    >
      <MarketingNavbar />

      <main>
        <HeroSection />
        <CarouselSection />
        <FAQSection />
        <ContactSection />
      </main>

      <MarketingFooter />
    </div>
  );
}