'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface WobbleCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function WobbleCard({ children, className = '' }: WobbleCardProps) {
  const [transform, setTransform] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / 10;
    const y = (e.clientY - rect.top - rect.height / 2) / 10;
    setTransform({ x, y });
  };

  const handleMouseLeave = () => {
    setTransform({ x: 0, y: 0 });
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        x: transform.x,
        y: transform.y,
        scale: 1.02,
        transition: { type: 'spring', stiffness: 200, damping: 20 },
      }}
      whileHover={{
        boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)',
      }}
      className={`transition-all duration-200 ease-in-out ${className}`}
    >
      {children}
    </motion.div>
  );
}
