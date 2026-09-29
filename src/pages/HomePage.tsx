import { HeroSection } from "../components/home/HeroSection";
import { CurrentLearning } from "../components/home/CurrentLearning";
import { LearningJourney } from "../components/home/LearningJourney";
import { QuickActions } from "../components/home/QuickActions";

export function HomePage() {
  return (
    <div className="home-page">
      <HeroSection />
      <CurrentLearning />
      <LearningJourney />
      <QuickActions />
    </div>
  );
}
