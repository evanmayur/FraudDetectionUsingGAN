import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { LogoScroll } from "@/components/LogoScroll";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <LogoScroll />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
