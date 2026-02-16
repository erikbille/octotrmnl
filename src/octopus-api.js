/**
 * Octopus Energy API Client
 * Documentation: https://developer.octopus.energy/rest/
 */

const OCTOPUS_API_BASE = 'https://api.octopus.energy/v1';

/**
 * Fetch monthly electricity consumption
 * @param {string} mpan - Meter Point Administration Number
 * @param {string} serial - Meter serial number
 * @param {string} apiKey - Octopus API key
 * @param {string} periodFrom - ISO 8601 date (e.g., "2026-02-01T00:00:00Z")
 * @param {string} periodTo - ISO 8601 date
 * @returns {Promise<number>} Total consumption in kWh
 */
export async function getElectricityConsumption(mpan, serial, apiKey, periodFrom, periodTo) {
  const url = `${OCTOPUS_API_BASE}/electricity-meter-points/${mpan}/meters/${serial}/consumption/?period_from=${periodFrom}&period_to=${periodTo}&group_by=month`;

  const response = await fetch(url, {
    headers: {
      'Authorization': 'Basic ' + btoa(`${apiKey}:`)
    }
  });

  if (!response.ok) {
    throw new Error(`Octopus API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Return total consumption for the month
  if (data.results && data.results.length > 0) {
    return data.results[0].consumption;
  }

  return 0;
}

/**
 * Fetch monthly gas consumption
 * @param {string} mprn - Meter Point Reference Number
 * @param {string} serial - Meter serial number
 * @param {string} apiKey - Octopus API key
 * @param {string} periodFrom - ISO 8601 date
 * @param {string} periodTo - ISO 8601 date
 * @returns {Promise<number>} Total consumption in kWh
 */
export async function getGasConsumption(mprn, serial, apiKey, periodFrom, periodTo) {
  const url = `${OCTOPUS_API_BASE}/gas-meter-points/${mprn}/meters/${serial}/consumption/?period_from=${periodFrom}&period_to=${periodTo}&group_by=month`;

  const response = await fetch(url, {
    headers: {
      'Authorization': 'Basic ' + btoa(`${apiKey}:`)
    }
  });

  if (!response.ok) {
    throw new Error(`Octopus API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.results && data.results.length > 0) {
    return data.results[0].consumption;
  }

  return 0;
}

/**
 * Fetch electricity unit rates
 * @param {string} productCode - Product code (e.g., "AGILE-FLEX-22-11-25")
 * @param {string} tariffCode - Tariff code (e.g., "E-1R-AGILE-FLEX-22-11-25-M")
 * @param {string} periodFrom - ISO 8601 date
 * @param {string} periodTo - ISO 8601 date
 * @returns {Promise<Array>} Array of unit rates with timestamps
 */
export async function getElectricityRates(productCode, tariffCode, periodFrom, periodTo) {
  const url = `${OCTOPUS_API_BASE}/products/${productCode}/electricity-tariffs/${tariffCode}/standard-unit-rates/?period_from=${periodFrom}&period_to=${periodTo}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Octopus API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.results || [];
}

/**
 * Fetch gas unit rates
 * @param {string} productCode - Product code
 * @param {string} tariffCode - Tariff code
 * @param {string} periodFrom - ISO 8601 date
 * @param {string} periodTo - ISO 8601 date
 * @returns {Promise<Array>} Array of unit rates with timestamps
 */
export async function getGasRates(productCode, tariffCode, periodFrom, periodTo) {
  const url = `${OCTOPUS_API_BASE}/products/${productCode}/gas-tariffs/${tariffCode}/standard-unit-rates/?period_from=${periodFrom}&period_to=${periodTo}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Octopus API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.results || [];
}

/**
 * Fetch electricity standing charges
 * @param {string} productCode - Product code
 * @param {string} tariffCode - Tariff code
 * @param {string} periodFrom - ISO 8601 date
 * @param {string} periodTo - ISO 8601 date
 * @returns {Promise<number>} Standing charge in pence per day
 */
export async function getElectricityStandingCharge(productCode, tariffCode, periodFrom, periodTo) {
  const url = `${OCTOPUS_API_BASE}/products/${productCode}/electricity-tariffs/${tariffCode}/standing-charges/?period_from=${periodFrom}&period_to=${periodTo}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Octopus API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.results && data.results.length > 0) {
    return data.results[0].value_inc_vat;
  }

  return 0;
}

/**
 * Fetch gas standing charges
 * @param {string} productCode - Product code
 * @param {string} tariffCode - Tariff code
 * @param {string} periodFrom - ISO 8601 date
 * @param {string} periodTo - ISO 8601 date
 * @returns {Promise<number>} Standing charge in pence per day
 */
export async function getGasStandingCharge(productCode, tariffCode, periodFrom, periodTo) {
  const url = `${OCTOPUS_API_BASE}/products/${productCode}/gas-tariffs/${tariffCode}/standing-charges/?period_from=${periodFrom}&period_to=${periodTo}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Octopus API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.results && data.results.length > 0) {
    return data.results[0].value_inc_vat;
  }

  return 0;
}

/**
 * Fetch half-hourly electricity consumption for peak time analysis
 * @param {string} mpan - Meter Point Administration Number
 * @param {string} serial - Meter serial number
 * @param {string} apiKey - Octopus API key
 * @param {string} periodFrom - ISO 8601 date
 * @param {string} periodTo - ISO 8601 date
 * @returns {Promise<Array>} Array of consumption records with timestamps
 */
export async function getHalfHourlyConsumption(mpan, serial, apiKey, periodFrom, periodTo) {
  const url = `${OCTOPUS_API_BASE}/electricity-meter-points/${mpan}/meters/${serial}/consumption/?period_from=${periodFrom}&period_to=${periodTo}&page_size=500`;

  const response = await fetch(url, {
    headers: {
      'Authorization': 'Basic ' + btoa(`${apiKey}:`)
    }
  });

  if (!response.ok) {
    throw new Error(`Octopus API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.results || [];
}

/**
 * Calculate average unit rate from variable rates
 * @param {Array} rates - Array of rate objects with value_inc_vat and timestamps
 * @param {number} totalHours - Total hours in period (for weighting)
 * @returns {number} Average rate in pence per kWh
 */
export function calculateAverageRate(rates, totalHours = 720) {
  if (!rates || rates.length === 0) return 0;

  // For variable tariffs like Agile, calculate time-weighted average
  const totalRate = rates.reduce((sum, rate) => sum + rate.value_inc_vat, 0);
  return totalRate / rates.length;
}

/**
 * Find peak usage hour from half-hourly data
 * @param {Array} consumptionData - Array of consumption records
 * @returns {string} Peak hour in HH:MM format (e.g., "18:00")
 */
export function findPeakUsageHour(consumptionData) {
  if (!consumptionData || consumptionData.length === 0) return null;

  // Find the half-hour period with highest consumption
  let maxConsumption = 0;
  let peakTime = null;

  consumptionData.forEach(record => {
    if (record.consumption > maxConsumption) {
      maxConsumption = record.consumption;
      peakTime = record.interval_start;
    }
  });

  if (!peakTime) return null;

  // Convert ISO timestamp to HH:MM format (local time)
  const date = new Date(peakTime);
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
}
