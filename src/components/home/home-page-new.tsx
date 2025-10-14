import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BulkRegenBar } from "@/components/admin/BulkRegenBar";
import { ConsistentPageLayout } from "@/components/layout/consistent-page-layout";
import { MonthlyBirthdays } from "@/components/home/monthly-birthdays";
import tips from "@/data/tips.json";

interface HomePageNewProps {
  onNavigateToRequests?: () => void;
}

interface Tip {
  id: string;
  text: string;
}

export function HomePageNew({ onNavigateToRequests }: HomePageNewProps) {
  const [dailyTip, setDailyTip] = useState<Tip | null>(null);
  const navigate = useNavigate();
  const adminMode = localStorage.getItem('adminMode') === 'true';

  const handleCTA = () => {
    navigate('/contacts');
  };

  // Get daily tip based on date
  useEffect(() => {
    const today = new Date().toDateString();
    const storedTip = localStorage.getItem(`dailyTip_${today}`);
    
    if (storedTip) {
      setDailyTip(JSON.parse(storedTip));
    } else {
      // Select random tip and store it for the day
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      setDailyTip(randomTip);
      localStorage.setItem(`dailyTip_${today}`, JSON.stringify(randomTip));
    }
  }, []);

  return (
    <ConsistentPageLayout>
      <section className="py-4" aria-labelledby="about-title">
        <div>
          <h2 id="about-title" className="text-2xl font-bold mb-4">À propos de Pliiiz</h2>
          <div className="pliiz-card">
            <p className="mb-3">Pliiiz, c'est ton super-pouvoir cadeaux : tu dévoiles tes <strong>goûts & envies</strong>, tes proches offrent juste ce qu'il faut. Simple, malin, efficace 👌</p>
            <div className="flex gap-2">
              <Button onClick={handleCTA} className="btn-orange">Gérer mes contacts</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Birthday Section */}
      <MonthlyBirthdays />

      {adminMode && (
        <div>
          <BulkRegenBar />
        </div>
      )}
    </ConsistentPageLayout>
  );
}
