import React from 'react';
import Image from 'next/image';

const AppLogo = () => {
  return (
    <div className="flex justify-center items-center my-4" style={{ height: 'auto' }}>
      <Image
        src="https://placehold.co/250x60.png" 
        alt="Iliad IPbuilder Logo"
        width={250} 
        height={60}
        priority // Good for LCP if the logo is above the fold
        data-ai-hint="logo brand"
        style={{ objectFit: 'contain' }}
      />
    </div>
  );
};

export default AppLogo;
