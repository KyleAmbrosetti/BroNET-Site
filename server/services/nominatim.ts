import { storage } from "../storage";
import type { AddressCache } from "@shared/schema";

// Rate limiting: Max 1 request per second to Nominatim
const RATE_LIMIT_MS = 1000;
let lastRequestTime = 0;

export interface AddressValidationResult {
  success: boolean;
  normalizedAddress?: string;
  latitude?: string;
  longitude?: string;
  postcode?: string;
  suburb?: string;
  state?: string;
  error?: string;
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callNominatim(inputAddress: string): Promise<any> {
  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await delay(RATE_LIMIT_MS - timeSinceLastRequest);
  }
  lastRequestTime = Date.now();

  // Call Nominatim API with Australian country bias
  const url = `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(inputAddress)}` +
    `&format=json` +
    `&addressdetails=1` +
    `&limit=1` +
    `&countrycodes=au`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'BroNET-ISP/1.0 (https://bronet.example.com; support@bronet.example.com)',
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim API error: ${response.status}`);
  }

  return await response.json();
}

export interface AddressSuggestion {
  displayName: string;
  address: string;
  suburb?: string;
  state?: string;
  postcode?: string;
}

export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  try {
    if (!query || query.trim().length < 3) {
      return [];
    }

    // Try RapidAPI NBN address search first (more accurate for Australian addresses)
    const rapidApiKey = process.env.RAPIDAPI_NBN_KEY;
    if (rapidApiKey) {
      try {
        // Clean up the API key in case it has extra formatting
        let cleanKey = rapidApiKey;
        if (cleanKey.includes("'")) {
          const match = cleanKey.match(/'([^']+)'/);
          if (match) cleanKey = match[1];
        }

        const url = `https://nbnco-address-search-api.p.rapidapi.com/nbn_address_search?address=${encodeURIComponent(query + ' Australia')}`;
        
        const response = await fetch(url, {
          headers: {
            'x-rapidapi-host': 'nbnco-address-search-api.p.rapidapi.com',
            'x-rapidapi-key': cleanKey,
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            return data.suggestions.slice(0, 5).map((item: any) => {
              const formattedAddress = item.formattedAddress || item.address || '';
              const parts = formattedAddress.split(',').map((p: string) => p.trim());
              
              return {
                displayName: formattedAddress,
                address: formattedAddress,
                suburb: item.locality || parts[1] || '',
                state: item.state || parts[2]?.split(' ')[0] || '',
                postcode: item.postcode || parts[2]?.match(/\d{4}/)?.[0] || '',
                locId: item.id || item.locId,
              };
            });
          }
        }
      } catch (rapidError) {
        console.error('RapidAPI address search error:', rapidError);
      }
    }

    // Fallback to Nominatim
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMIT_MS) {
      await delay(RATE_LIMIT_MS - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();

    const url = `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query + ' Australia')}` +
      `&format=json` +
      `&addressdetails=1` +
      `&limit=5` +
      `&countrycodes=au`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BroNET-ISP/1.0 (https://bronet.example.com; support@bronet.example.com)',
      },
    });

    if (!response.ok) {
      return [];
    }

    const results = await response.json();
    
    return results.map((result: any) => {
      const addr = result.address || {};
      const parts = [
        addr.house_number,
        addr.road,
        addr.suburb || addr.city || addr.town,
        addr.state,
        addr.postcode,
      ].filter(Boolean);
      
      return {
        displayName: result.display_name,
        address: parts.join(', '),
        suburb: addr.suburb || addr.city || addr.town,
        state: addr.state,
        postcode: addr.postcode,
      };
    });
  } catch (error) {
    console.error('Address search error:', error);
    return [];
  }
}

export async function validateAddress(inputAddress: string): Promise<AddressValidationResult> {
  try {
    const normalizedInput = inputAddress.toLowerCase().trim();

    // Check cache first
    const cached = await storage.getAddressCacheByInput(normalizedInput);
    if (cached) {
      return {
        success: true,
        normalizedAddress: cached.normalizedAddress,
        latitude: cached.latitude || undefined,
        longitude: cached.longitude || undefined,
        postcode: cached.postcode || undefined,
        suburb: cached.suburb || undefined,
        state: cached.state || undefined,
      };
    }

    // Call Nominatim
    const results = await callNominatim(inputAddress);

    if (!results || results.length === 0) {
      return {
        success: false,
        error: "Address not found. Please check the address and try again.",
      };
    }

    const result = results[0];
    const address = result.address || {};

    // Build normalized address
    const addressParts = [
      address.house_number,
      address.road,
      address.suburb || address.city,
      address.state,
      address.postcode,
      'Australia',
    ].filter(Boolean);

    const normalizedAddress = addressParts.join(', ');

    // Cache the result
    await storage.createAddressCache({
      inputAddress: normalizedInput,
      normalizedAddress,
      latitude: result.lat || null,
      longitude: result.lon || null,
      postcode: address.postcode || null,
      suburb: address.suburb || address.city || null,
      state: address.state || null,
      rawResponse: JSON.stringify(result),
    });

    return {
      success: true,
      normalizedAddress,
      latitude: result.lat,
      longitude: result.lon,
      postcode: address.postcode,
      suburb: address.suburb || address.city,
      state: address.state,
    };
  } catch (error: any) {
    console.error('Nominatim validation error:', error);
    return {
      success: false,
      error: error.message || "Failed to validate address",
    };
  }
}
