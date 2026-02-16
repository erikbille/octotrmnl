/**
 * OctoTRMNL - Octopus Energy TRMNL Worker
 * Fetches energy consumption and carbon intensity data for TRMNL display
 */

import {
  getElectricityConsumption,
  getGasConsumption,
  getElectricityRates,
  getGasRates,
  getElectricityStandingCharge,
  getGasStandingCharge,
  getHalfHourlyConsumption,
  calculateAverageRate,
  findPeakUsageHour
} from './octopus-api.js';

import {
  getCarbonIntensityForecast,
  analyzeCarbonIntensity,
  processForecastForDisplay
} from './carbon-api.js';

// Cache TTLs (in seconds)
// Shorter TTLs since TRMNL fetches every 30 minutes
const CACHE_TTL = {
  CONSUMPTION: 25 * 60,          // 25 minutes (just under TRMNL fetch interval)
  PRICING: 25 * 60,              // 25 minutes
  CARBON: 25 * 60,               // 25 minutes
  HALF_HOURLY: 25 * 60           // 25 minutes (for peak time calculation)
};

export default {
  async fetch(request, env, ctx) {
    // CORS headers for TRMNL polling
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // Get current month period
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const periodFrom = monthStart.toISOString();
      const periodTo = monthEnd.toISOString();

      // Fetch all data in parallel with caching
      const [
        electricityData,
        gasData,
        carbonData
      ] = await Promise.all([
        getElectricityData(env, periodFrom, periodTo),
        getGasData(env, periodFrom, periodTo),
        getCarbonData(env)
      ]);

      // Calculate month progress for daily average
      const daysInMonth = monthEnd.getDate();
      const currentDay = now.getDate();

      // Build response
      const response = {
        electricity: {
          kwh: Math.round(electricityData.consumption * 10) / 10,
          cost_gbp: Math.round(electricityData.cost * 100) / 100,
          daily_avg_kwh: Math.round((electricityData.consumption / currentDay) * 10) / 10,
          peak_time: electricityData.peakTime,
          month: now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
        },
        gas: {
          kwh: Math.round(gasData.consumption * 10) / 10,
          cost_gbp: Math.round(gasData.cost * 100) / 100,
          daily_avg_kwh: Math.round((gasData.consumption / currentDay) * 10) / 10,
          month: now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
        },
        carbon_forecast: carbonData.forecast,
        carbon_summary: carbonData.summary,
        last_updated: now.toISOString(),
        last_updated_formatted: now.toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      };

      return new Response(JSON.stringify(response, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Worker error:', error);

      return new Response(JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};

/**
 * Fetch and calculate electricity data with caching
 */
async function getElectricityData(env, periodFrom, periodTo) {
  const cacheKey = `electricity:${periodFrom}:${periodTo}`;

  // Try cache first
  const cached = await env.OCTOPUS_CACHE?.get(cacheKey, 'json');
  if (cached) {
    return cached;
  }

  // Fetch consumption
  const consumption = await getElectricityConsumption(
    env.MPAN,
    env.ELECTRICITY_SERIAL,
    env.OCTOPUS_API_KEY,
    periodFrom,
    periodTo
  );

  // Fetch pricing data
  const [rates, standingCharge] = await Promise.all([
    getElectricityRates(
      env.ELECTRICITY_PRODUCT,
      env.ELECTRICITY_TARIFF,
      periodFrom,
      periodTo
    ),
    getElectricityStandingCharge(
      env.ELECTRICITY_PRODUCT,
      env.ELECTRICITY_TARIFF,
      periodFrom,
      periodTo
    )
  ]);

  // Calculate average rate
  const avgRate = calculateAverageRate(rates);

  // Calculate total cost (consumption cost + standing charges)
  const now = new Date();
  const daysInMonth = now.getDate(); // Days elapsed so far this month
  const consumptionCost = (consumption * avgRate) / 100; // Convert pence to pounds
  const standingChargesCost = (daysInMonth * standingCharge) / 100;
  const totalCost = consumptionCost + standingChargesCost;

  // Fetch peak usage time (cached separately for 24h)
  let peakTime = null;
  try {
    const peakCacheKey = `peak:${periodFrom}`;
    const cachedPeak = await env.OCTOPUS_CACHE?.get(peakCacheKey, 'text');

    if (cachedPeak) {
      peakTime = cachedPeak;
    } else {
      // Fetch last 7 days of half-hourly data to find peak
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const halfHourlyData = await getHalfHourlyConsumption(
        env.MPAN,
        env.ELECTRICITY_SERIAL,
        env.OCTOPUS_API_KEY,
        weekAgo.toISOString(),
        now.toISOString()
      );

      peakTime = findPeakUsageHour(halfHourlyData);

      // Cache peak time
      if (peakTime && env.OCTOPUS_CACHE) {
        await env.OCTOPUS_CACHE.put(peakCacheKey, peakTime, {
          expirationTtl: CACHE_TTL.HALF_HOURLY
        });
      }
    }
  } catch (error) {
    console.error('Error fetching peak time:', error);
    // Continue without peak time
  }

  const result = {
    consumption,
    cost: totalCost,
    peakTime
  };

  // Cache result
  if (env.OCTOPUS_CACHE) {
    await env.OCTOPUS_CACHE.put(cacheKey, JSON.stringify(result), {
      expirationTtl: CACHE_TTL.CONSUMPTION
    });
  }

  return result;
}

/**
 * Fetch and calculate gas data with caching
 */
async function getGasData(env, periodFrom, periodTo) {
  const cacheKey = `gas:${periodFrom}:${periodTo}`;

  // Try cache first
  const cached = await env.OCTOPUS_CACHE?.get(cacheKey, 'json');
  if (cached) {
    return cached;
  }

  // Fetch consumption
  const consumption = await getGasConsumption(
    env.MPRN,
    env.GAS_SERIAL,
    env.OCTOPUS_API_KEY,
    periodFrom,
    periodTo
  );

  // Fetch pricing data
  const [rates, standingCharge] = await Promise.all([
    getGasRates(
      env.GAS_PRODUCT,
      env.GAS_TARIFF,
      periodFrom,
      periodTo
    ),
    getGasStandingCharge(
      env.GAS_PRODUCT,
      env.GAS_TARIFF,
      periodFrom,
      periodTo
    )
  ]);

  // Calculate average rate
  const avgRate = calculateAverageRate(rates);

  // Calculate total cost
  const now = new Date();
  const daysInMonth = now.getDate();
  const consumptionCost = (consumption * avgRate) / 100;
  const standingChargesCost = (daysInMonth * standingCharge) / 100;
  const totalCost = consumptionCost + standingChargesCost;

  const result = {
    consumption,
    cost: totalCost
  };

  // Cache result
  if (env.OCTOPUS_CACHE) {
    await env.OCTOPUS_CACHE.put(cacheKey, JSON.stringify(result), {
      expirationTtl: CACHE_TTL.CONSUMPTION
    });
  }

  return result;
}

/**
 * Fetch and process carbon intensity data with caching
 */
async function getCarbonData(env) {
  const cacheKey = 'carbon:forecast';

  // Try cache first
  const cached = await env.OCTOPUS_CACHE?.get(cacheKey, 'json');
  if (cached) {
    return cached;
  }

  // Fetch forecast
  const rawForecast = await getCarbonIntensityForecast();

  // Process for display (next 24 hours)
  const forecast = processForecastForDisplay(rawForecast, 24);

  // Analyze for summary
  const summary = analyzeCarbonIntensity(rawForecast, 24);

  const result = {
    forecast,
    summary
  };

  // Cache result
  if (env.OCTOPUS_CACHE) {
    await env.OCTOPUS_CACHE.put(cacheKey, JSON.stringify(result), {
      expirationTtl: CACHE_TTL.CARBON
    });
  }

  return result;
}
