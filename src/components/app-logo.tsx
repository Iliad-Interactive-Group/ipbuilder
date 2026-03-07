'use client';

import React from 'react';
import { useTheme } from 'next-themes';

type AppLogoProps = {
  surface?: 'auto' | 'light' | 'dark';
  width?: number;
  height?: number;
  className?: string;
  preferredSrc?: string;
};

const AppLogo = ({ surface = 'auto', width = 300, height = 76, className = '', preferredSrc }: AppLogoProps) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [logoIndex, setLogoIndex] = React.useState(0);
  const [showTextFallback, setShowTextFallback] = React.useState(false);

  // Avoid hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    setLogoIndex(0);
    setShowTextFallback(false);
  }, [theme]);

  if (!mounted) {
    return (
      <div className="flex justify-center items-center my-4" style={{ height: '60px' }} />
    );
  }

  const useLightLogoSet =
    surface === 'dark' || (surface === 'auto' && theme === 'dark');

  const baseCandidates = useLightLogoSet
    ? ['/logo-dark.png', '/logo-dark-color.png']
    : ['/logo-light.png', '/logo-light-alt.png'];

  const logoCandidates = preferredSrc
    ? [preferredSrc, ...baseCandidates.filter((candidate) => candidate !== preferredSrc)]
    : baseCandidates;

  const logoSrc = logoCandidates[Math.min(logoIndex, logoCandidates.length - 1)];

  return (
    <div className="flex justify-center items-center my-4" style={{ height: 'auto' }}>
      {showTextFallback ? (
        <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-card-foreground'}`}>Iliad Interactive — GrowthOS - Creator</span>
      ) : (
        <img
          src={logoSrc}
          alt="Iliad Interactive — GrowthOS - Creator"
          width={width}
          height={height}
          className={`object-contain h-auto ${className}`}
          onError={() => {
            if (logoIndex < logoCandidates.length - 1) {
              setLogoIndex((prev) => prev + 1);
            } else {
              setShowTextFallback(true);
            }
          }}
        />
      )}
    </div>
  );
};

export default AppLogo;
