import React, { useEffect, useState } from "react";
import Image from "next/image";

interface SplashScreenProps {
  statusText?: string;
  progress?: number; // 0 to 100, if provided shows a progress bar
  isExiting?: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  statusText = "Initializing Taskosaur", 
  progress,
  isExiting = false 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [displayText, setDisplayText] = useState(statusText);

  // Smoothly update text to avoid jumping
  useEffect(() => {
    if (statusText !== displayText) {
      const timer = setTimeout(() => setDisplayText(statusText), 200);
      return () => clearTimeout(timer);
    }
  }, [statusText, displayText]);

  if (isExiting && !isVisible) return null;

  return (
    <div className={`splash-screen-container ${isExiting ? "fade-out" : ""}`} suppressHydrationWarning>
      <div className="splash-logo-container" suppressHydrationWarning>
        <div className="splash-logo-glow" suppressHydrationWarning />
        <div className="splash-logo" suppressHydrationWarning>
          <Image
            src="/taskosaur-logo.svg"
            alt="Taskosaur Logo"
            width={120}
            height={120}
            priority
          />
        </div>
      </div>

      <div className="splash-content" suppressHydrationWarning>
        <p className="splash-status-text" suppressHydrationWarning>{displayText}...</p>
        
        <div className="splash-progress-track" suppressHydrationWarning>
          {progress !== undefined ? (
            <div 
              className="splash-progress-bar" 
              style={{ width: `${progress}%` }} 
              suppressHydrationWarning
            />
          ) : (
            <div className="splash-progress-bar splash-progress-indeterminate" suppressHydrationWarning />
          )}
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
