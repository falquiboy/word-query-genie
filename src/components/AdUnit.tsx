import React, { useEffect, useState } from "react";

interface AdUnitProps {
  slot: string;
  format?: "auto" | "fluid" | "rectangle";
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const AdUnit = ({ slot, format = "auto", className = "" }: AdUnitProps) => {
  const [adError, setAdError] = useState<boolean>(false);

  useEffect(() => {
    const loadAd = async () => {
      try {
        if (typeof window.adsbygoogle !== 'undefined') {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (err) {
        console.error("Error loading AdSense:", err);
        setAdError(true);
      }
    };

    // Add error event listener for the ad iframe
    const handleAdError = () => {
      console.warn("Ad failed to load");
      setAdError(true);
    };

    loadAd();

    return () => {
      // Cleanup if needed
    };
  }, [slot]);

  if (adError) {
    return null; // Don't render anything if there's an error
  }

  return (
    <div className={`ad-container my-6 overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-6198157256707928"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdUnit;