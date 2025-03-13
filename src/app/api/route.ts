import { NextResponse } from "next/server";

// GPIO Mock for Windows development
interface GpioOptions {
  debounceTimeout?: number;
  [key: string]: unknown;
}

// Define a callback type that matches both our mock and the real library
type GpioCallback = (err: Error | null | undefined, value: number) => void;

// Common interface both implementations will follow
interface IGpio {
  watch(callback: GpioCallback): void;
  unexport(): void;
  writeSync?(value: number): void; // Add writeSync method for output pins
  simulateCoinInsertion?(): void; // Optional method for mock implementation
}

class GpioMock implements IGpio {
  private pin: number;
  private direction: string;
  private edge: string | undefined;
  private options: GpioOptions;
  private watchCallback: GpioCallback | null = null;
  private value: number = 0;

  constructor(
    pin: number,
    direction: string,
    edge?: string,
    options: GpioOptions = {}
  ) {
    this.pin = pin;
    this.direction = direction;
    this.edge = edge;
    this.options = options;
    console.log(
      `[GPIO Mock] Initialized GPIO pin ${pin} in ${direction} mode with ${
        edge || "no"
      } edge`
    );
  }

  watch(callback: GpioCallback): void {
    this.watchCallback = callback;
    console.log(`[GPIO Mock] Started watching pin ${this.pin}`);
  }

  // Method to simulate a coin insertion (for testing)
  simulateCoinInsertion(): void {
    if (this.watchCallback) {
      console.log(`[GPIO Mock] Simulating coin insertion on pin ${this.pin}`);
      this.watchCallback(null, 1);
    }
  }

  // Add writeSync implementation for output pins
  writeSync(value: number): void {
    this.value = value;
    console.log(`[GPIO Mock] Set pin ${this.pin} to ${value}`);
  }

  unexport(): void {
    console.log(`[GPIO Mock] Unexported pin ${this.pin}`);
  }
}

// Use real GPIO on Linux, mock on Windows
const isLinux = process.platform === "linux";

// Initialize variables
let coinCount = 0;
let pulseCount = 0;
let lastPulseTime = Date.now();
let systemActive = false;

let gpioSensor: IGpio | null = null;
let gpioEnablePin: IGpio | null = null; // Changed variable name for clarity

// Function to initialize GPIO
async function initializeGpio(): Promise<void> {
  try {
    const COIN_SENSOR_PIN = 3;
    const ENABLE_PIN = 7; // Define pin 7 as the enable pin for the coin acceptor

    if (isLinux) {
      try {
        // Only import the real GPIO library on Linux using dynamic import
        const onoffModule = await import("onoff");
        const Gpio = onoffModule.Gpio;
        console.log("Using real GPIO on Linux");
        gpioSensor = new Gpio(COIN_SENSOR_PIN, "in", "rising", {
          debounceTimeout: 50,
        }) as unknown as IGpio; // Type assertion to make TypeScript happy

        // Initialize pin 7 as output
        gpioEnablePin = new Gpio(ENABLE_PIN, "out") as unknown as IGpio;
      } catch (error) {
        console.error("Failed to load onoff GPIO library:", error);
        gpioSensor = new GpioMock(COIN_SENSOR_PIN, "in", "rising", {
          debounceTimeout: 50,
        });

        // Initialize mock for pin 7 as output
        gpioEnablePin = new GpioMock(ENABLE_PIN, "out");
      }
    } else {
      console.log("Not on Linux, using GPIO mock");
      gpioSensor = new GpioMock(COIN_SENSOR_PIN, "in", "rising", {
        debounceTimeout: 50,
      });

      // Initialize mock for pin 7 as output
      gpioEnablePin = new GpioMock(ENABLE_PIN, "out");
    }

    // Initially set the enable pin to LOW (disabled)
    if (gpioEnablePin && gpioEnablePin.writeSync) {
      gpioEnablePin.writeSync(0); // Set to LOW (disabled)
      console.log("Coin acceptor disabled (ENABLE_PIN set to LOW)");
    }

    // Set up coin sensor
    if (gpioSensor) {
      gpioSensor.watch((err, value) => {
        if (err) {
          console.error("Error reading GPIO:", err);
          return;
        }
        if (value === 1 && systemActive) {
          // Only count if system is active
          // Coin pulse detected
          const currentTime = Date.now();
          pulseCount++;
          lastPulseTime = currentTime;
          console.log(`Pulse detected: ${pulseCount}`);

          // Process pulses after a delay to determine coin value
          setTimeout(() => {
            processPulses();
          }, 500); // 500ms delay to wait for all pulses in one coin insertion
        }
      });
    }
  } catch (err) {
    console.error("Failed to initialize GPIO:", err);
  }
}

// Process pulses to determine coin value
function processPulses() {
  const currentTime = Date.now();

  // Only process if time since last pulse > 500ms (indicating all pulses for this coin are done)
  if (currentTime - lastPulseTime > 500 && pulseCount > 0) {
    let coinValue = 0;

    // Determine coin value based on pulse count
    if (pulseCount === 1) {
      coinValue = 1;
      console.log("1 peso inserted");
    } else if (pulseCount === 5) {
      coinValue = 5;
      console.log("5 pesos inserted");
    } else if (pulseCount === 10) {
      coinValue = 10;
      console.log("10 pesos inserted");
    } else if (pulseCount === 20) {
      coinValue = 20;
      console.log("20 pesos inserted");
    } else {
      console.log(`Unknown coin: ${pulseCount} pulses`);
    }

    // Update coin count
    if (coinValue > 0) {
      coinCount += coinValue;
      console.log(`Current total: ${coinCount} pesos`);
    }

    // Reset pulse count
    pulseCount = 0;
  }
}

// Function to activate the system (enable coin acceptance)
function activateSystem() {
  if (gpioEnablePin && gpioEnablePin.writeSync) {
    gpioEnablePin.writeSync(1); // Set to HIGH (enabled)
    systemActive = true;
    console.log("System activated - Coin acceptance enabled");
    return true;
  }
  return false;
}

// Function to deactivate the system (disable coin acceptance)
function deactivateSystem() {
  if (gpioEnablePin && gpioEnablePin.writeSync) {
    gpioEnablePin.writeSync(0); // Set to LOW (disabled)
    systemActive = false;
    console.log("System deactivated - Coin acceptance disabled");
    return true;
  }
  return false;
}

// Initialize the GPIO
initializeGpio().catch((error) => {
  console.error("Error in GPIO initialization:", error);
});

// Function to simulate coin insertion (for testing on Windows)
function simulateCoinInsertion(pulses: number = 1): void {
  if (
    !isLinux &&
    gpioSensor &&
    "simulateCoinInsertion" in gpioSensor &&
    systemActive
  ) {
    // Simulate multiple pulses if needed
    for (let i = 0; i < pulses; i++) {
      setTimeout(() => {
        gpioSensor?.simulateCoinInsertion?.();
      }, i * 50); // Space pulses 50ms apart
    }
  }
}

export async function GET(request: Request) {
  // Extract URL parameters
  const url = new URL(request.url);

  // Check for system activation
  if (url.searchParams.has("activate")) {
    activateSystem();
    return NextResponse.json({
      success: true,
      status: "System activated",
      coin_count: coinCount,
    });
  }

  // Check for system deactivation
  if (url.searchParams.has("deactivate")) {
    deactivateSystem();
    return NextResponse.json({
      success: true,
      status: "System deactivated",
      coin_count: coinCount,
    });
  }

  // Check if this is a simulation request (for testing)
  if (url.searchParams.has("simulate")) {
    const pulses = parseInt(url.searchParams.get("simulate") || "1");
    simulateCoinInsertion(pulses);
    return NextResponse.json({
      success: true,
      message: `Simulating ${pulses} pulse(s)`,
      coin_count: coinCount,
    });
  }

  return NextResponse.json({
    coin_count: coinCount,
    system_active: systemActive,
  });
}
