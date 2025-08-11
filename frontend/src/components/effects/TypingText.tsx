'use client'; 

import { useState, useEffect } from 'react';

interface TypingTextProps {
  text: string;
  speed?: number;
  className?: string;
}

const TypingText: React.FC<TypingTextProps> = ({ text, speed = 80, className }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(prev => prev + text[i]);
      i++;
      if (i === text.length) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <h2 className={className}>
      {displayedText}
      <span className="blinking-cursor">|</span>
    </h2>
  );
};

export default TypingText;
