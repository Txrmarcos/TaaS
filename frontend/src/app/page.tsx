import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ThreePillars } from "@/components/ThreePillars";
import { KeyFeatures } from "@/components/KeyFeatures";
import { HowItWorks } from "@/components/HowItWorks";
import { Footer } from "@/components/Footer";

export default function Home() {
    return (
        <div className="min-h-screen bg-background font-sans">
            <Header />
            <Hero />
            <ThreePillars />
            <KeyFeatures />
            <HowItWorks />
            <Footer />
        </div>
    );
}
