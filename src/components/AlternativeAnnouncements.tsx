"use client";

import { useEffect, useRef } from "react";

interface AlternativeAnnouncementsProps {
  announcement: string;
  criticalAlert?: string;
}

export default function AlternativeAnnouncements({ announcement, criticalAlert }: AlternativeAnnouncementsProps) {
  const announcementRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (announcement && announcementRef.current) {
      // Force focus and announcement
      announcementRef.current.focus();
      // Also try using the Web Speech API as a fallback
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(announcement);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
      }
    }
  }, [announcement]);

  useEffect(() => {
    if (criticalAlert && alertRef.current) {
      // Force focus and announcement
      alertRef.current.focus();
      // Also try using the Web Speech API as a fallback
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(criticalAlert);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        speechSynthesis.speak(utterance);
      }
    }
  }, [criticalAlert]);

  return (
    <>
      {/* Alternative announcement method */}
      <div 
        ref={announcementRef}
        tabIndex={-1}
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
        role="status"
        aria-label="Game announcements"
        style={{ 
          position: 'absolute', 
          left: '-10000px', 
          width: '1px', 
          height: '1px', 
          overflow: 'hidden' 
        }}
      >
        {announcement}
      </div>
      
      {/* Alternative critical alert method */}
      <div 
        ref={alertRef}
        tabIndex={-1}
        aria-live="assertive" 
        aria-atomic="true"
        className="sr-only"
        role="alert"
        aria-label="Critical game alerts"
        style={{ 
          position: 'absolute', 
          left: '-10000px', 
          width: '1px', 
          height: '1px', 
          overflow: 'hidden' 
        }}
      >
        {criticalAlert}
      </div>
    </>
  );
}
