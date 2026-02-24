import React from 'react';
import Image from 'next/image';

const AppLogo = () => {
  return (
    <div className="flex justify-center items-center my-4" style={{ height: 'auto' }}>
      <Image
        src="https://images.squarespace-cdn.com/content/v1/5e791a56fc25de5000406d3d/1585005603306-CWERSMM01IXK9VNLGKI9/img-logo-hrz-blk.png?format=1500w"
        alt="Iliad IPbuilder Logo"
        width={250} 
        height={60}
        priority 
        style={{ objectFit: 'contain', filter: 'invert(1) brightness(2)' }}
      />
    </div>
  );
};

export default AppLogo;
