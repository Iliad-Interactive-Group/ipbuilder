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

  return (
    <div className="flex justify-center items-center my-4" style={{ height: 'auto' }}>
      <Image
        src="https://images.squarespace-cdn.com/content/v1/5e791a56fc25de5000406d3d/1585005603306-CWERSMM01IXK9VNLGKI9/img-logo-hrz-blk.png?format=1500w"
        alt="Iliad IPbuilder Logo"
        width={250} 
        height={60}
        priority 
        className="object-contain dark:invert"
      />
    </div>
  );
};

export default AppLogo;
