import React, { useEffect } from "react";

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
  useEffect(() => {
    // Only try to initialize ads if we're not in development
    if (process.env.NODE_ENV === "production") {
      try {
        const adsbygoogle = window.adsbygoogle || [];
        adsbygoogle.push({});
      } catch (err) {
        // Log the error but don't throw it to prevent app crashes
        console.warn("AdSense initialization warning:", err);
      }
    }
  }, []);

  // Don't render ads in development
  if (process.env.NODE_ENV !== "production") {
    return (
      <div className={`ad-placeholder ${className}`} style={{ minHeight: "100px" }}>
        <div className="text-center text-sm text-muted-foreground p-4 border rounded-md">
          Ad placeholder (disabled in development)
        </div>
      </div>
    );
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