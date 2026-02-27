import HeroSection from "@/components/landingComponents/HeroSection";
import Navbar from "@/components/landingComponents/Navbar";
import FeaturesSection from "@/components/landingComponents/FeaturesSection";
import HowItWorksSection from "@/components/landingComponents/HowItWorksSection";
import StatsSection from "@/components/landingComponents/StatsSection";
import TestimonialsSection from "@/components/landingComponents/TestimonialsSection";
import CTASection from "@/components/landingComponents/CTASection";
import Footer from "@/components/landingComponents/Footer";


export default function Home() {
  return (
    <div>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
