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
    <div className={`splash-screen-container ${isExiting ? "fade-out" : ""}`}>
      <div className="splash-logo-container">
        <div className="splash-logo-glow" />
        <div className="splash-logo">
          <Image
            src="/taskosaur-logo.svg"
            alt="Taskosaur Logo"
            width={120}
            height={120}
            priority
          />
        </div>
      </div>

      <div className="splash-content">
        <p className="splash-status-text">{displayText}...</p>
        
        <div className="splash-progress-track">
          {progress !== undefined ? (
            <div 
              className="splash-progress-bar" 
              style={{ width: `${progress}%` }} 
            />
          ) : (
            <div className="splash-progress-bar splash-progress-indeterminate" />
          )}
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
