'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TreePine, X, Menu } from 'lucide-react';
import Link from 'next/link';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {/* <TreePine className="w-8 h-8 text-green-600 mr-3" /> */}
            {/* <img src="/assets/parks4people-logo-final.png" alt="Parks4People Logo" className="w-10 h-10 mr-2 rounded-full object-cover" /> */}
            <img src="/parks4people-logo-final.svg" alt="Parks4People Logo" className="w-15 h-15 mr-3 object-contain" />
            <h1 className="text-2xl font-bold text-gray-800">Parks4People</h1>
          </div>

          {/* Desktop Navigation */}
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/map">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-colors"
              >
                Open Map
              </motion.button>
            </Link>
            <a href="/" className="text-gray-700 hover:text-green-600 font-medium">Home</a>
            <a href="/about" className="text-gray-700 hover:text-green-600 font-medium">About</a>
            <a href="https://forms.gle/HofwYkRe3abAuoLJ9" className="text-gray-700 hover:text-green-600 font-medium" target="_blank" rel="noopener noreferrer">Feedback</a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="md:hidden bg-white border-t overflow-hidden"
          >
            <a href="/" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Home</a>
            <div className="px-4 py-2 space-y-1">
              <Link href="/map">
                <button className="w-full bg-green-600 text-white py-2 rounded-lg mt-2">
                  Open Map
                </button>
              </Link>
              <a href="/about" className="block py-2 text-gray-700">About</a>
              <a href="/feedback" className="block py-2 text-gray-700">Feedback</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
