import { useState, useEffect } from 'react';

export function useResponsive() {
  const getInfo = () => {
    const w = window.innerWidth;
    return {
      width: w,
      isMobile: w < 640,
      isTablet: w >= 640 && w < 1024,
      isDesktop: w >= 1024,
      columns: w < 640 ? 1 : w < 1024 ? 2 : 3,
      playerColumns: w < 400 ? 3 : w < 640 ? 4 : w < 1024 ? 5 : 6,
      maxWidth: w < 640 ? "100%" : w < 1024 ? 720 : 1100,
    };
  };

  const [info, setInfo] = useState(getInfo);

  useEffect(() => {
    const handler = () => setInfo(getInfo());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return info;
}
