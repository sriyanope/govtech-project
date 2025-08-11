'use client';

import React from 'react';
import { MapPin, Car, Users, ArrowRight, Compass, ParkingSquare, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import WobbleCard from '@/components/effects/WobbleCard'; 
import { NavigationArrowIcon } from "@phosphor-icons/react";

interface QuickAccessCard {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  link: string;
  disabled?: boolean;
}

const QuickAccessCards: React.FC = () => {
  const quickAccessCards: QuickAccessCard[] = [
    {
      title: 'Explore',
      subtitle: 'Singapore\'s parks and what they can offer',
      description: '',
      icon: <NavigationArrowIcon size={32} weight="bold" />,
      color: 'text-green-700',
      bgColor: 'bg-green-50 hover:bg-green-100',
      link: '/map?focus=parks',
    },
    {
      title: "Find parking",
      subtitle: "near to the park of your choice",
      description: "",
      icon: <ParkingSquare className="w-6 h-6" />,
      color: "text-blue-700",
      bgColor: "bg-blue-50 hover:bg-blue-100",
      link: "/parking"
    },
    {
      title: "Community Events",
      subtitle: "Host events within parks!",
      description: "",
      icon: <Calendar className="w-6 h-6" />,
      color: "text-amber-700",
      bgColor: "bg-amber-50",
      link: "/community",
      disabled: true
    }
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-gray-800 text-2xl font-medium mb-10 tracking-wide"
      >
        CLICK HERE TO
      </motion.h1>

      <div className="grid md:grid-cols-3 gap-8">
        {quickAccessCards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index, duration: 0.6 }}
            whileHover={card.disabled ? {} : { y: -4 }}
            className={`relative ${card.disabled ? 'cursor-not-allowed' : ''}`}
          >
            {card.disabled ? (
              <div
                className={`${card.bgColor} rounded-2xl p-8 h-full border border-gray-200 relative overflow-hidden transition-all duration-200`}
              >
                <CardContent card={card} />
                <div className="absolute inset-0 backdrop-blur-sm bg-white/70 flex items-center justify-center rounded-2xl">
                  <span className="bg-amber-100 text-amber-800 px-4 py-1 rounded-full text-sm font-semibold shadow">
                    Coming Soon
                  </span>
                </div>
               </div>
            ) : (
              <Link href={card.link} className="block h-full group">
                <WobbleCard className={`${card.bgColor} rounded-2xl p-8 h-full border border-gray-200 group-hover:shadow-lg transition-all duration-200 relative`}>
                  <CardContent card={card} />
                  <ArrowRight className={`absolute bottom-6 right-6 w-5 h-5 ${card.color} opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-200`} />
                </WobbleCard>
              </Link>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const CardContent: React.FC<{ card: QuickAccessCard }> = ({ card }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <div className={`inline-flex items-center justify-center p-3 rounded-xl bg-white shadow ${card.color}`}>
          {card.icon}
        </div>
     </div>
      
      <div className="flex-grow">
        <h3 className="text-xl font-bold text-gray-800 mb-1">{card.title}</h3>
        <p className="text-gray-600 leading-relaxed">
           {card.subtitle}
          {card.description && (
            <>
              <br />
              {card.description}
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default QuickAccessCards;