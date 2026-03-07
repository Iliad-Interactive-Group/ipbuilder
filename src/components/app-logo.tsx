'use client';

import React from 'react';
import { useTheme } from 'next-themes';

const AppLogo = () => {
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

  const logoCandidates = theme === 'dark'
    ? ['/logo-light.png', '/logo-light-alt.png', '/V2.png', '/V1.png']
    : ['/logo-dark.png', '/logo-dark-color.png', '/V4.png', '/V3.png'];

  const logoSrc = logoCandidates[Math.min(logoIndex, logoCandidates.length - 1)];

  return (
    <div className="flex justify-center items-center my-4" style={{ height: 'auto' }}>
      {showTextFallback ? (
        <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-card-foreground'}`}>Iliad Interactive — BrandBOX-Creator</span>
      ) : (
        <img
          src={logoSrc}
          alt="Iliad Interactive — BrandBOX-Creator"
          width={300}
          height={76}
          className="object-contain h-auto"
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
