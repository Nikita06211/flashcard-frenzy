"use client";

import { useEffect, useState } from "react";

interface ScreenReaderAnnouncementsProps {
  announcement: string;
  criticalAlert?: string;
}

export default function ScreenReaderAnnouncements({ announcement, criticalAlert }: ScreenReaderAnnouncementsProps) {
  const [currentAnnouncement, setCurrentAnnouncement] = useState("");
  const [currentAlert, setCurrentAlert] = useState("");
  const [announcementKey, setAnnouncementKey] = useState(0);
  const [alertKey, setAlertKey] = useState(0);

  useEffect(() => {
    if (announcement) {
      // Force screen reader to announce by changing the key
      setAnnouncementKey(prev => prev + 1);
      setCurrentAnnouncement(announcement);
    }
  }, [announcement]);

  useEffect(() => {
    if (criticalAlert) {
      // Force screen reader to announce by changing the key
      setAlertKey(prev => prev + 1);
      setCurrentAlert(criticalAlert);
    }
  }, [criticalAlert]);

  return (
    <>
      {/* Polite announcements */}
      <div 
        key={`announcement-${announcementKey}`}
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
        role="status"
        aria-label="Game announcements"
        id="game-announcements"
      >
        {currentAnnouncement}
      </div>
      
      {/* Critical alerts */}
      <div 
        key={`alert-${alertKey}`}
        aria-live="assertive" 
        aria-atomic="true"
        className="sr-only"
        role="alert"
        aria-label="Critical game alerts"
        id="critical-alerts"
      >
        {currentAlert}
      </div>
      
    </>
  );
}
