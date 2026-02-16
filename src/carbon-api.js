/**
 * National Grid Carbon Intensity API Client
 * Documentation: https://carbon-intensity.github.io/api-definitions/
 */

const CARBON_API_BASE = 'https://api.carbonintensity.org.uk';

/**
 * Fetch carbon intensity forecast for the next 24-48 hours
 * @returns {Promise<Array>} Array of forecast periods with intensity data
 */
export async function getCarbonIntensityForecast() {
  // Get forecast data (returns next 48 hours in 30-minute intervals)
  const url = `${CARBON_API_BASE}/intensity/date`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Carbon Intensity API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Calculate carbon intensity summary statistics
 * @param {Array} forecast - Array of forecast periods
 * @param {number} hours - Number of hours to analyze (default 24)
 * @returns {Object} Summary with green percentage and best time window
 */
export function analyzeCarbonIntensity(forecast, hours = 24) {
  if (!forecast || forecast.length === 0) {
    return {
      green_percentage: 0,
      best_window_start: null,
      best_window_end: null,
      next_green_start: null
    };
  }

  // Limit to specified hours (each period is 30 minutes)
  const periodsToAnalyze = Math.min(forecast.length, hours * 2);
  const periods = forecast.slice(0, periodsToAnalyze);

  // Count green periods (< 99g CO2/kWh according to Octopus Energy criteria)
  const GREEN_THRESHOLD = 99;
  let greenCount = 0;
  let currentTime = new Date();

  periods.forEach(period => {
    if (period.intensity && period.intensity.actual < GREEN_THRESHOLD) {
      greenCount++;
    } else if (period.intensity && period.intensity.forecast < GREEN_THRESHOLD) {
      greenCount++;
    }
  });

  const greenPercentage = Math.round((greenCount / periodsToAnalyze) * 100);

  // Find longest continuous green period
  let longestGreenStart = null;
  let longestGreenEnd = null;
  let longestGreenLength = 0;

  let currentGreenStart = null;
  let currentGreenLength = 0;

  periods.forEach((period, index) => {
    const intensity = period.intensity?.actual || period.intensity?.forecast || 999;
    const isGreen = intensity < GREEN_THRESHOLD;

    if (isGreen) {
      if (currentGreenStart === null) {
        currentGreenStart = period.from;
      }
      currentGreenLength++;

      // Check if this is the end or last period
      if (index === periods.length - 1 || !isGreen) {
        if (currentGreenLength > longestGreenLength) {
          longestGreenLength = currentGreenLength;
          longestGreenStart = currentGreenStart;
          longestGreenEnd = period.to;
        }
      }
    } else {
      // End of green period
      if (currentGreenLength > longestGreenLength) {
        longestGreenLength = currentGreenLength;
        longestGreenStart = currentGreenStart;
        longestGreenEnd = periods[index - 1]?.to;
      }
      currentGreenStart = null;
      currentGreenLength = 0;
    }
  });

  // Find next green period (if not currently green)
  const currentIntensity = periods[0]?.intensity?.actual || periods[0]?.intensity?.forecast || 999;
  const isCurrentlyGreen = currentIntensity < GREEN_THRESHOLD;

  let nextGreenStart = null;
  if (!isCurrentlyGreen) {
    for (let period of periods) {
      const intensity = period.intensity?.actual || period.intensity?.forecast || 999;
      if (intensity < GREEN_THRESHOLD) {
        nextGreenStart = period.from;
        break;
      }
    }
  }

  return {
    green_percentage: greenPercentage,
    best_window_start: longestGreenStart ? formatTime(longestGreenStart) : null,
    best_window_end: longestGreenEnd ? formatTime(longestGreenEnd) : null,
    next_green_start: nextGreenStart ? formatTime(nextGreenStart) : null
  };
}

/**
 * Process forecast data for TRMNL display
 * Returns simplified forecast suitable for bar chart visualization
 * @param {Array} forecast - Raw forecast data
 * @param {number} hours - Number of hours to include (default 24)
 * @returns {Array} Processed forecast with time, intensity, and index
 */
export function processForecastForDisplay(forecast, hours = 24) {
  if (!forecast || forecast.length === 0) return [];

  const periodsToInclude = Math.min(forecast.length, hours * 2);
  const periods = forecast.slice(0, periodsToInclude);

  return periods.map(period => {
    const intensity = period.intensity?.actual || period.intensity?.forecast || 0;
    const index = period.intensity?.index || getIntensityIndex(intensity);

    return {
      time: period.from,
      intensity: intensity,
      index: index
    };
  });
}

/**
 * Get intensity index based on carbon intensity value
 * @param {number} intensity - Carbon intensity in gCO2/kWh
 * @returns {string} Index: "very low", "low", "moderate", "high", "very high"
 */
function getIntensityIndex(intensity) {
  if (intensity < 99) return 'low';
  if (intensity < 150) return 'moderate';
  if (intensity < 250) return 'high';
  return 'very high';
}

/**
 * Format ISO timestamp to HH:MM format in local time
 * @param {string} isoTime - ISO 8601 timestamp
 * @returns {string} Time in HH:MM format
 */
function formatTime(isoTime) {
  const date = new Date(isoTime);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}
