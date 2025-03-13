"use client";

import { useState, useEffect } from "react";

export default function KioskPage() {
  const [coinCount, setCoinCount] = useState(0);

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const response = await fetch("/api");
        const data = await response.json();
        setCoinCount(data.coin_count);
      } catch (error) {
        console.error("Error fetching coin data:", error);
      }
    };

    const interval = setInterval(fetchCoins, 1000); // Poll every second

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Kiosk Coin Counter</h1>
      <p className="text-lg mt-4">Coins Inserted: {coinCount}</p>
    </div>
  );
}
