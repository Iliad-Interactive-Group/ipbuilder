'use client';

import React from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

const AppLogo = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex justify-center items-center my-4" style={{ height: '60px' }} />
    );
  }

  const logoSrc = theme === 'dark' ? '/logo-light.png' : '/logo-dark.png';

  return (
    <div className="flex justify-center items-center my-4" style={{ height: 'auto' }}>
      <Image
        src={logoSrc}
        alt="Iliad Interactive — BrandBOX-Creator"
        width={280}
        height={70}
        priority
        className="object-contain"
      />
    </div>
  );
};

export default AppLogo;
