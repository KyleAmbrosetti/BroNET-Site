import { storage } from "../storage";
import crypto from "crypto";

export interface SQResult {
  source: 'wholesale_api' | 'dataset' | 'address_only' | 'nbn_public_api' | 'rapidapi';
  available?: boolean;
  technology?: string;
  maxTier?: string;
  rawResponse?: any;
  error?: string;
  // Address details from RapidAPI when available
  formattedAddress?: string;
  locality?: string;
  postcode?: string;
  state?: string;
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
 * Check NBN availability using NBN Co's official places API
 * This uses the same API as the NBN website address checker
 */
async function checkPublicNBNAPI(
  normalizedAddress: string
): Promise<SQResult> {
  try {
    // Step 1: Search for the location ID using NBN's places API
    const encodedAddress = encodeURIComponent(normalizedAddress);
    const searchResponse = await fetch(
      `https://places.nbnco.net.au/places/v2/autocomplete?query=${encodedAddress}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Referer': 'https://www.nbnco.com.au/',
        },
      }
    );

    if (!searchResponse.ok) {
      throw new Error(`NBN Places API returned ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();

    // Check if we got any suggestions
    if (!searchData.suggestions || searchData.suggestions.length === 0) {
      return {
        source: 'nbn_public_api',
        error: 'No matching addresses found',
      };
    }

    // Get the first matching location
    const locationId = searchData.suggestions[0].id;

    // Step 2: Get detailed info for this location
    const detailResponse = await fetch(
      `https://places.nbnco.net.au/places/v1/details/${locationId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Referer': 'https://www.nbnco.com.au/',
        },
      }
    );

    if (!detailResponse.ok) {
      throw new Error(`NBN Details API returned ${detailResponse.status}`);
    }

    const detailData = await detailResponse.json();
    const addressDetail = detailData.addressDetail;

    if (!addressDetail) {
      return {
        source: 'nbn_public_api',
        error: 'No service details available for this address',
      };
    }

    // Map technology types to friendly names
    const techTypeMap: Record<string, string> = {
      'FTTP': 'Fibre to the Premises',
      'FTTC': 'Fibre to the Curb',
      'FTTN': 'Fibre to the Node',
      'FTTB': 'Fibre to the Building',
      'HFC': 'Hybrid Fibre Coaxial',
      'Wireless': 'Fixed Wireless',
      'WIRELESS': 'Fixed Wireless',
      'Satellite': 'Satellite',
      'SATELLITE': 'Satellite',
    };

    // Parse speed tier from programType or reasonCode
    const techType = addressDetail.techType || addressDetail.techChangeStatus || 'Unknown';
    const serviceStatus = addressDetail.serviceStatus || '';
    const reasonCode = addressDetail.reasonCode || '';
    
    // Determine max speed based on technology
    let maxTier = 'Contact for details';
    if (techType === 'FTTP') {
      maxTier = '2000 Mbps';
    } else if (techType === 'FTTC' || techType === 'HFC') {
      maxTier = '1000 Mbps';
    } else if (techType === 'FTTN' || techType === 'FTTB') {
      maxTier = '100 Mbps';
    } else if (techType === 'Wireless' || techType === 'WIRELESS') {
      maxTier = '75 Mbps';
    } else if (techType === 'Satellite' || techType === 'SATELLITE') {
      maxTier = '25 Mbps';
    }

    const isAvailable = serviceStatus === 'available' || 
                        reasonCode === 'FTTP_SA' || 
                        reasonCode === 'HFC_CT' ||
                        addressDetail.serviceType === 'Fixed Line';
    
    return {
      source: 'nbn_public_api',
      available: isAvailable,
      technology: techTypeMap[techType] || techType,
      maxTier,
      rawResponse: { search: searchData, detail: detailData },
    };
  } catch (error: any) {
    console.error('Public NBN API error:', error);
    return {
      source: 'nbn_public_api',
      error: error.message || 'Public NBN API request failed',
    };
  }
}

/**
 * Check NBN availability using RapidAPI NBN Address Search
 */
async function checkRapidAPI(
  normalizedAddress: string
): Promise<SQResult> {
  let apiKey = process.env.RAPIDAPI_NBN_KEY;
  
  if (!apiKey) {
    return {
      source: 'rapidapi',
      error: 'RapidAPI key not configured',
    };
  }
  
  // Clean up API key - extract just the key if entire curl command was pasted
  if (apiKey.includes('x-rapidapi-key:')) {
    const match = apiKey.match(/x-rapidapi-key[:\s]+([a-zA-Z0-9]+)/);
    if (match) apiKey = match[1];
  }
  // Remove any leading/trailing whitespace or quotes
  apiKey = apiKey.trim().replace(/^['"]|['"]$/g, '');

  try {
    const encodedAddress = encodeURIComponent(normalizedAddress);
    const response = await fetch(
      `https://nbnco-address-check.p.rapidapi.com/nbn_address?address=${encodedAddress}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'nbnco-address-check.p.rapidapi.com',
          'x-rapidapi-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return {
          source: 'rapidapi',
          error: 'Rate limit exceeded, please try again later',
        };
      }
      throw new Error(`RapidAPI returned ${response.status}`);
    }

    const data = await response.json();

    // Check for API-level errors
    if (data.messages || data.error) {
      return {
        source: 'rapidapi',
        error: data.messages || data.error || 'API error',
      };
    }

    // Parse response - RapidAPI returns addressDetail and servingArea objects
    const addressDetail = data.addressDetail;
    const servingArea = data.servingArea;
    
    if (!addressDetail && !servingArea) {
      return {
        source: 'rapidapi',
        error: 'No matching addresses found',
      };
    }
    
    // Map technology types
    const techTypeMap: Record<string, string> = {
      'FTTP': 'Fibre to the Premises',
      'FTTC': 'Fibre to the Curb',
      'FTTN': 'Fibre to the Node',
      'FTTB': 'Fibre to the Building',
      'HFC': 'Hybrid Fibre Coaxial',
      'WIRELESS': 'Fixed Wireless',
      'SATELLITE': 'Satellite',
    };

    // Get technology type from addressDetail or servingArea
    const techType = addressDetail?.techType || servingArea?.techType || 'Unknown';
    
    // Check availability from servingArea status or addressDetail
    const serviceStatus = servingArea?.serviceStatus || addressDetail?.serviceStatus || '';
    const isAvailable = serviceStatus === 'available' || 
                        serviceStatus === 'in_construction' ||
                        addressDetail?.serviceType === 'Fixed line';
    
    // Determine max speed based on technology
    let maxTier = 'Contact for details';
    if (techType === 'FTTP') maxTier = '2000 Mbps';
    else if (techType === 'FTTC' || techType === 'HFC') maxTier = '1000 Mbps';
    else if (techType === 'FTTN' || techType === 'FTTB') maxTier = '100 Mbps';
    else if (techType === 'WIRELESS') maxTier = '75 Mbps';
    else if (techType === 'SATELLITE') maxTier = '25 Mbps';

    // Extract address details from RapidAPI response
    const addressSplit = data.addressSplitDetails || {};
    const formattedAddress = addressDetail?.formattedAddress || 
                            (addressSplit.address1 ? `${addressSplit.address1}, ${addressSplit.locality || ''} ${addressSplit.state || ''} ${addressSplit.postcode || ''}`.trim() : undefined);
    
    return {
      source: 'rapidapi',
      available: isAvailable,
      technology: techTypeMap[techType] || techType,
      maxTier,
      rawResponse: data,
      formattedAddress,
      locality: addressDetail?.locality || addressSplit.locality || servingArea?.description,
      postcode: addressSplit.postcode || undefined,
      state: addressSplit.state || undefined,
    };
  } catch (error: any) {
    console.error('RapidAPI NBN error:', error.message);
    return {
      source: 'rapidapi',
      error: error.message || 'RapidAPI request failed',
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

  // Try RapidAPI NBN search (if configured)
  if (process.env.RAPIDAPI_NBN_KEY) {
    const rapidResult = await checkRapidAPI(normalizedAddress);
    if (!rapidResult.error) {
      return rapidResult;
    }
    console.log('RapidAPI failed:', rapidResult.error, '- trying dataset');
  }

  // Try admin dataset (Mode B)
  const datasetCount = await storage.getAllNbnDataset();
  if (datasetCount.length > 0) {
    const result = await checkDataset(normalizedAddress, postcode);
    if (!result.error) {
      return result;
    }
    console.log('Dataset lookup failed, trying public NBN API');
  }

  // Try public NBN API (Mode C) - no configuration required
  const publicResult = await checkPublicNBNAPI(normalizedAddress);
  if (!publicResult.error) {
    return publicResult;
  }
  console.log('Public NBN API failed, returning address-only');

  // All modes failed - return address-only validation
  return {
    source: 'address_only',
  };
}

/**
 * Get current SQ configuration mode
 */
export function getSQMode(): 'wholesale_api' | 'rapidapi' | 'dataset' | 'nbn_public_api' | 'none' {
  if (process.env.NBN_WHOLESALE_BASE_URL && process.env.NBN_WHOLESALE_API_KEY) {
    return 'wholesale_api';
  }
  if (process.env.RAPIDAPI_NBN_KEY) {
    return 'rapidapi';
  }
  // Public NBN API is always available as fallback
  return 'nbn_public_api';
}

export { generateAddressHash };
