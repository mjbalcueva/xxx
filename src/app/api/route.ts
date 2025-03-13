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
  simulateCoinInsertion?(): void; // Optional method for mock implementation
}

class GpioMock implements IGpio {
  private pin: number;
  private direction: string;
  private edge: string | undefined;
  private options: GpioOptions;
  private watchCallback: GpioCallback | null = null;

  constructor(pin: number, direction: string, edge?: string, options: GpioOptions = {}) {
    this.pin = pin;
    this.direction = direction;
    this.edge = edge;
    this.options = options;
    console.log(`[GPIO Mock] Initialized GPIO pin ${pin} in ${direction} mode with ${edge || 'no'} edge`);
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

  unexport(): void {
    console.log(`[GPIO Mock] Unexported pin ${this.pin}`);
  }
}

// Use real GPIO on Linux, mock on Windows
const isLinux = process.platform === 'linux';

// Initialize variables
let coinCount = 0;
let gpioSensor: IGpio | null = null;

// Function to initialize GPIO
async function initializeGpio(): Promise<void> {
  try {
    const COIN_SENSOR_PIN = 3;
    
    if (isLinux) {
      try {
        // Only import the real GPIO library on Linux using dynamic import
        const onoffModule = await import('onoff');
        const Gpio = onoffModule.Gpio;
        console.log('Using real GPIO on Linux');
        gpioSensor = new Gpio(COIN_SENSOR_PIN, "in", "rising", {
          debounceTimeout: 50,
        }) as unknown as IGpio; // Type assertion to make TypeScript happy
      } catch (error) {
        console.error('Failed to load onoff GPIO library:', error);
        gpioSensor = new GpioMock(COIN_SENSOR_PIN, "in", "rising", {
          debounceTimeout: 50,
        });
      }
    } else {
      console.log('Not on Linux, using GPIO mock');
      gpioSensor = new GpioMock(COIN_SENSOR_PIN, "in", "rising", {
        debounceTimeout: 50,
      });
    }

    // Set up coin sensor
    if (gpioSensor) { // Add null check
      gpioSensor.watch((err, value) => {
        if (err) {
          console.error("Error reading GPIO:", err);
          return;
        }
        if (value === 1) {
          coinCount++;
          console.log(`Coin detected! Total: ${coinCount}`);
        }
      });
    }
  } catch (err) {
    console.error('Failed to initialize GPIO:', err);
  }
}

// Initialize the GPIO
initializeGpio().catch(error => {
  console.error('Error in GPIO initialization:', error);
});

// Function to simulate coin insertion (for testing on Windows)
function simulateCoinInsertion(): void {
  if (!isLinux && gpioSensor && 'simulateCoinInsertion' in gpioSensor) {
    gpioSensor.simulateCoinInsertion?.();
  }
}

export async function GET(request: Request) {
  // Check if this is a simulation request (for testing)
  const url = new URL(request.url);
  if (url.searchParams.has('simulate')) {
    simulateCoinInsertion();
  }
  
  return NextResponse.json({ coin_count: coinCount });
}
