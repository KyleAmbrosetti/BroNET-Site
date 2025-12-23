import { storage } from "../storage";
import crypto from "crypto";

export interface SQResult {
  source: 'wholesale_api' | 'dataset' | 'address_only';
  available?: boolean;
  technology?: string;
  maxTier?: string;
  rawResponse?: any;
  error?: string;
}

function generateAddressHash(normalizedAddress: string, postcode: string): string {
  const input = `${normalizedAddress.toLowerCase().trim()}|${postcode}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Check NBN availability using wholesale API (Mode A)
 */
async function checkWholesaleAPI(
  normalizedAddress: string,
  postcode: string,
  latitude?: string,
  longitude?: string
): Promise<SQResult> {
  const baseUrl = process.env.NBN_WHOLESALE_BASE_URL;
  const apiKey = process.env.NBN_WHOLESALE_API_KEY;

  if (!baseUrl || !apiKey) {
    return {
      source: 'wholesale_api',
      error: 'Wholesale API not configured',
    };
  }

  try {
    // Parse additional headers if provided
    const additionalHeaders: Record<string, string> = {};
    const headersEnv = process.env.NBN_WHOLESALE_HEADERS;
    if (headersEnv) {
      try {
        Object.assign(additionalHeaders, JSON.parse(headersEnv));
      } catch (e) {
        console.error('Failed to parse NBN_WHOLESALE_HEADERS:', e);
      }
    }

    // Make request to wholesale API
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        ...additionalHeaders,
      },
      body: JSON.stringify({
        address: normalizedAddress,
        postcode,
        latitude,
        longitude,
      }),
    });

    if (!response.ok) {
      throw new Error(`Wholesale API returned ${response.status}`);
    }

    const data = await response.json();

    // Map response fields (adjust based on actual API structure)
    // This is a generic mapping - real APIs will vary
    const technology = data.technology || data.nbnTechnology || data.techType || 'Unknown';
    const maxTier = data.maxTier || data.maxSpeed || data.downloadSpeed || 'Unknown';
    const available = data.available !== false && data.serviceClass !== 'Zero';

    return {
      source: 'wholesale_api',
      available,
      technology,
      maxTier,
      rawResponse: data,
    };
  } catch (error: any) {
    console.error('Wholesale API error:', error);
    return {
      source: 'wholesale_api',
      error: error.message || 'Wholesale API request failed',
    };
  }
}

/**
 * Check NBN availability using admin dataset (Mode B)
 */
async function checkDataset(
  normalizedAddress: string,
  postcode: string
): Promise<SQResult> {
  try {
    const addressHash = generateAddressHash(normalizedAddress, postcode);

    // Try exact hash match first
    let match = await storage.getNbnDatasetByHash(addressHash);

    // If no exact match, try postcode-based matches
    if (!match) {
      const postcodeMatches = await storage.getNbnDatasetByPostcode(postcode);
      if (postcodeMatches.length > 0) {
        // Use first postcode match as fallback
        match = postcodeMatches[0];
      }
    }

    if (!match) {
      return {
        source: 'dataset',
        error: 'No availability data found for this address',
      };
    }

    return {
      source: 'dataset',
      available: true,
      technology: match.technology,
      maxTier: match.maxTier,
      rawResponse: match,
    };
  } catch (error: any) {
    console.error('Dataset lookup error:', error);
    return {
      source: 'dataset',
      error: error.message || 'Dataset lookup failed',
    };
  }
}

/**
 * Main SQ check function - tries wholesale API first, then dataset, then address-only
 */
export async function checkNBNAvailability(
  normalizedAddress: string,
  postcode: string,
  latitude?: string,
  longitude?: string
): Promise<SQResult> {
  // Try wholesale API first (Mode A)
  if (process.env.NBN_WHOLESALE_BASE_URL && process.env.NBN_WHOLESALE_API_KEY) {
    const result = await checkWholesaleAPI(normalizedAddress, postcode, latitude, longitude);
    if (!result.error) {
      return result;
    }
    console.log('Wholesale API failed, trying dataset fallback');
  }

  // Try admin dataset (Mode B)
  const datasetCount = await storage.getAllNbnDataset();
  if (datasetCount.length > 0) {
    const result = await checkDataset(normalizedAddress, postcode);
    if (!result.error) {
      return result;
    }
    console.log('Dataset lookup failed, returning address-only');
  }

  // Neither mode available - return address-only validation
  return {
    source: 'address_only',
  };
}

/**
 * Get current SQ configuration mode
 */
export function getSQMode(): 'wholesale_api' | 'dataset' | 'none' {
  if (process.env.NBN_WHOLESALE_BASE_URL && process.env.NBN_WHOLESALE_API_KEY) {
    return 'wholesale_api';
  }
  // We'll check dataset count at runtime in the API route
  return 'none';
}

export { generateAddressHash };
