import HeroSection from '../components/sections/HeroSection';
import WeatherDisplayCard from '../components/sections/WeatherDisplayCard';
import QuickAccessCards from '../components/sections/QuickAccessCards';
// import ParkFacilitiesSection from '../components/sections/ParkFacilitiesSection';
// import SmartFeaturesSection from '../components/sections/SmartFeaturesSection';
import Footer from '../components/layout/Footer'; 

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <HeroSection />
      <div className="relative z-10 flex justify-center mt-[-100px]"> 
        <WeatherDisplayCard />
      </div>
      <QuickAccessCards />
      <Footer />
    </div>
  );
}