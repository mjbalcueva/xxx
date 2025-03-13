"use client";

import { useState, useEffect } from "react";

export default function KioskPage() {
  const [coinCount, setCoinCount] = useState(0);
  const [systemActive, setSystemActive] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch current coin count and system status
  const fetchStatus = async () => {
    try {
      const response = await fetch("/api");
      const data = await response.json();
      setCoinCount(data.coin_count);
      setSystemActive(data.system_active);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchStatus(); // Initial fetch
    const interval = setInterval(fetchStatus, 1000); // Poll every second
    return () => clearInterval(interval);
  }, []);

  // Toggle system activation
  const toggleSystem = async () => {
    setLoading(true);
    try {
      const action = systemActive ? "deactivate" : "activate";
      const response = await fetch(`/api?${action}=true`);
      const data = await response.json();

      setCoinCount(data.coin_count);
      setSystemActive(!systemActive); // Toggle local state immediately for UI responsiveness
    } catch (error) {
      console.error(
        `Error ${systemActive ? "deactivating" : "activating"} system:`,
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // Simulate coin insertions for testing
  const simulateCoin = async (pulses: number) => {
    if (!systemActive) {
      alert("System must be active to simulate coins!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api?simulate=${pulses}`);
      const data = await response.json();
      setCoinCount(data.coin_count);
    } catch (error) {
      console.error("Error simulating coin:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
      <h1 className="text-2xl font-bold text-center mb-6">
        Kiosk Coin Counter
      </h1>

      <div className="text-center mb-6">
        <div className="text-5xl font-bold mb-2">{coinCount}</div>
        <div className="text-gray-500">Pesos Inserted</div>
      </div>

      <div className="mb-6">
        <button
          onClick={toggleSystem}
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            systemActive
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600"
          } 
            ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading
            ? "Processing..."
            : systemActive
            ? "Deactivate System"
            : "Activate System"}
        </button>
        <div className="mt-2 text-center text-sm">
          System is currently{" "}
          <span
            className={
              systemActive
                ? "text-green-500 font-bold"
                : "text-red-500 font-bold"
            }
          >
            {systemActive ? "ACTIVE" : "INACTIVE"}
          </span>
        </div>
      </div>

      <div className="border-t pt-4">
        <h2 className="text-lg font-semibold mb-3">Simulation Controls</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => simulateCoin(1)}
            disabled={loading || !systemActive}
            className={`py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 ${
              loading || !systemActive ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            1 Peso
          </button>
          <button
            onClick={() => simulateCoin(5)}
            disabled={loading || !systemActive}
            className={`py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 ${
              loading || !systemActive ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            5 Pesos
          </button>
          <button
            onClick={() => simulateCoin(10)}
            disabled={loading || !systemActive}
            className={`py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 ${
              loading || !systemActive ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            10 Pesos
          </button>
          <button
            onClick={() => simulateCoin(20)}
            disabled={loading || !systemActive}
            className={`py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 ${
              loading || !systemActive ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            20 Pesos
          </button>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <p>
          Note: On hardware, insert coins when system is active. The enable pin
          (7) controls the coin acceptor.
        </p>
      </div>
    </div>
  );
}
