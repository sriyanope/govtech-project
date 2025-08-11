'use client';

import React from 'react';
import { Search, MapPin, Train } from 'lucide-react';
import { motion } from 'framer-motion';
// import ''../effects/TypingText'
import TypingText from '../effects/TypingText'; // Uncomment if using TypingText component

// import WeatherDisplayCard from 'WeatherDisplayCard';
import WeatherDisplayCard from '../sections/WeatherDisplayCard';
import {Typewriter} from 'react-simple-typewriter';
const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden h-[350px] bg-cover bg-center" style={{ backgroundImage: "url('/parks4people-banner.JPG')" }}>
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Your next adventure:{' '}
            <span className="text-green-600">
              <Typewriter
                words={['Pasir Ris Park', 'MacRitchie Reservoir', 'Coney Island']}
                loop={true}
                cursor
                cursorStyle="|"
                typeSpeed={80}
                deleteSpeed={50}
                delaySpeed={1500}
              />
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 mb-8"
          >
            Nature is for everyone and anyone
          </motion.p>
          

          {/* Weather Widget
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <WeatherDisplayCard />
          </motion.div> */}

          {/* Search Bar
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search for facilities, activities, or locations..."
                className="w-full px-6 py-4 pl-12 pr-32 text-lg rounded-full border-2 border-gray-200 focus:border-green-500 focus:outline-none shadow-lg"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black w-6 h-6" />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-colors">
                Search
              </button>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600">
                <MapPin className="w-4 h-4" />
                Use current location
              </button>
              <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600">
                <Train className="w-4 h-4" />
                Nearest MRT
              </button>
            </div>
          </motion.div> */}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

// import { Search } from 'lucide-react'; // Example icon

//      <section className="relative overflow-hidden">
//         <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
//           <div className="text-center">
//             <motion.h2
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
//             >
//               Discover Pasir Ris Park
//             </motion.h2>
//             <motion.p
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.1 }}
//               className="text-xl text-gray-600 mb-8"
//             >
//               Your smart companion for park exploration
//             </motion.p>

//             {/* Weather Widget */}
//             <motion.div
//               initial={{ opacity: 0, scale: 0.9 }}
//               animate={{ opacity: 1, scale: 1 }}
//               transition={{ delay: 0.2 }}
//               className="inline-block bg-white rounded-2xl shadow-xl p-6 mb-8"
//             >
//               <div className="flex items-center justify-between gap-8">
//                 <div className="text-left">
//                   <p className="text-sm text-gray-800">Current Weather</p>
//                   <div className="flex items-center gap-2 mt-1">
//                     <Sun className="w-8 h-8 text-yellow-500" />
//                     <span className="text-3xl font-bold">{weatherData.temperature}°C</span>
//                   </div>
//                   <p className="text-gray-600 mt-1">{weatherData.condition}</p>
//                 </div>
//                 <div className="grid grid-cols-2 gap-4 text-sm">
//                   <div className="flex items-center gap-2">
//                     <Wind className="w-4 h-4 text-gray-800" />
//                     <span>{weatherData.windSpeed} km/h</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Info className="w-4 h-4 text-gray-800" />
//                     <span>PSI: {weatherData.psi}</span>
//                   </div>
//                 </div>
//               </div>
              
//               {/* Weather Recommendation */}
//               <div className={`mt-4 p-3 rounded-lg border ${recommendation.color}`}>
//                 <div className="flex items-center gap-2">
//                   {recommendation.icon}
//                   <p className="text-sm font-medium">{recommendation.text}</p>
//                 </div>
//               </div>
//             </motion.div>

//             {/* Search Bar */}
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.3 }}
//               className="max-w-2xl mx-auto"
//             >
//               <div className="relative">
//                 <input
//                   type="text"
//                   placeholder="Search for facilities, activities, or locations..."
//                   className="w-full px-6 py-4 pl-12 pr-32 text-lg rounded-full border-2 border-gray-200 focus:border-green-500 focus:outline-none shadow-lg"
//                 />
//                 <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-800 w-6 h-6" />
//                 <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-colors">
//                   Search
//                 </button>
//               </div>
//               <div className="flex justify-center gap-4 mt-4">
//                 <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600">
//                   <MapPin className="w-4 h-4" />
//                   Use current location
//                 </button>
//                 <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600">
//                   <Train className="w-4 h-4" />
//                   Nearest MRT
//                 </button>
//               </div>
//             </motion.div>
//           </div>
//         </div>
//       </section>
