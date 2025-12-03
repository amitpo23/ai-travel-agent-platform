/**
 * Medici Hotels API Client
 * Documentation based on provided Postman collections and Word doc
 */

const MEDICI_API_BASE_URL = "https://medici-backend.azurewebsites.net/api/hotels";

// Get API token from environment variable
function getApiToken(): string {
  const token = process.env.MEDICI_API_TOKEN;
  if (!token) {
    throw new Error("MEDICI_API_TOKEN environment variable is not set");
  }
  return token;
}

// Helper function to make authenticated requests
async function makeApiRequest<T>(
  endpoint: string,
  method: string,
  body?: any
): Promise<T> {
  const token = getApiToken();

  const url = `${MEDICI_API_BASE_URL}/${endpoint}`;
  console.log(`[MediciAPI] Making ${method} request to ${url}`);

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  console.log(`[MediciAPI] Response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[MediciAPI] Error response:`, errorText);
    throw new Error(`Medici API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data;
}

// Types based on API documentation
export interface SearchPriceRequest {
  dateFrom: string; // Format: "YYYY-MM-DD"
  dateTo: string;   // Format: "YYYY-MM-DD"
  city?: string;    // City name for search
  adults: number;   // Number of adults
  paxChildren: any[]; // Array of children (empty array if no children)
  stars?: number[];
  limit?: number;
  ShowExtendedData?: boolean; // Get extended hotel data (images, facilities, description)
  client_secret?: string; // Authentication secret
}

export interface RoomOffer {
  hotelName: string;
  images: string | null;
  name: string;
  category: string;
  bedding: string;
  board: string;
  hotelId: string;
  pax: {
    adults: number;
    children: any[];
  };
  quantity: {
    min: number;
    max: number;
  };
  detailsAvailable: boolean;
  price: {
    amount: number;
    currency: string;
  };
  netPrice: {
    amount: number;
    currency: string;
  };
  barRate: number | null;
  confirmation: string;
  paymentType: string;
  packageRate: boolean;
  commissionable: boolean;
  providers: Array<{
    id: number;
    name: string;
  }>;
  specialOffers: any[];
  cancellation: {
    type: string;
    frames: Array<{
      from: string;
      to: string;
      penalty: {
        amount: number;
        currency: string;
      };
    }>;
  };
  code: string;
  dates: any;
  source: number;
  offer: any;
}

export interface SearchPriceResponse {
  items: RoomOffer[];
  // ... other fields from response
}

export interface PreBookRequest {
  jsonRequest: string; // Stringified JSON with services, searchCodes, etc.
}

export interface PreBookResponse {
  content: {
    services: {
      hotels: Array<{
        price: {
          amount: number;
          currency: string;
        };
        priceWithoutTax: {
          amount: number;
          currency: string;
        };
        netPrice: {
          amount: number;
          currency: string;
        };
        taxAmount: {
          amount: any[];
          currency: any[];
        };
        transactionFee: {
          amount: number;
          currency: string;
        };
        netPriceInClientCurrency: {
          amount: number;
          currency: string;
        };
        barRate: {
          amount: number;
          currency: string;
        };
        confirmation: string;
        paymentMethod: string;
        packageRate: boolean;
        commissionable: boolean;
        code: string;
        cancellation: {
          type: string;
          frames: Array<{
            from: string;
            to: string;
            penalty: {
              amount: number;
              currency: string;
            };
          }>;
        };
        token: string;
        items: Array<{
          name: string;
          category: string;
          bedding: string;
          board: string;
          hotelId: string;
          pax: {
            adults: number;
            children: any[];
          };
          quantity: {
            min: number;
            max: number;
          };
          detailsAvailable: boolean;
        }>;
        surcharges: any[];
        requestCode: string;
      }>;
    };
    paymentMethods: any[];
    immediateCharge: boolean;
    autoCancellation: boolean;
    paymentDueDate: string;
    loyaltyPoints: any[];
    availablePoints: any[];
    profileVersion: string;
  };
}

export interface BookRequest {
  jsonRequest: string; // Stringified JSON with customer, services, payment, etc.
}

export interface BookResponse {
  // Response structure from successful booking
  bookingId?: number;
  confirmation?: string;
  status?: string;
  // ... other fields
}

export interface CancelRequest {
  jsonRequest: string; // Stringified JSON with BookingID, CancelReason, Force, IsManual
}

export interface CancelResponse {
  success: boolean;
  message?: string;
  // ... other fields
}

/**
 * Search for available hotel rooms with instant pricing
 */
export async function searchHotelPrice(
  request: SearchPriceRequest
): Promise<SearchPriceResponse> {
  const clientSecret = process.env.MEDICI_CLIENT_SECRET;
  if (!clientSecret) {
    throw new Error("MEDICI_CLIENT_SECRET environment variable is not set");
  }

  // Add client_secret to the request
  const requestWithSecret = {
    ...request,
    client_secret: clientSecret
  };

  console.log('[MediciAPI] SearchHotelPrice request:', {
    ...requestWithSecret,
    client_secret: '***HIDDEN***'
  });

  const response = await makeApiRequest<SearchPriceResponse>(
    "GetInnstantSearchPrice",
    "POST",
    requestWithSecret
  );

  console.log('[MediciAPI] SearchHotelPrice response:', {
    itemsCount: response.items?.length || 0,
    hasItems: !!response.items
  });

  return response;
}

/**
 * Pre-book a room to confirm availability and get a token
 */
export async function preBookRoom(
  request: PreBookRequest
): Promise<PreBookResponse> {
  return makeApiRequest<PreBookResponse>(
    "PreBook",
    "POST",
    request
  );
}

/**
 * Complete the booking with customer details
 */
export async function bookRoom(
  request: BookRequest
): Promise<BookResponse> {
  return makeApiRequest<BookResponse>(
    "Book",
    "POST",
    request
  );
}

/**
 * Cancel an existing booking
 */
export async function cancelBooking(
  request: CancelRequest
): Promise<CancelResponse> {
  return makeApiRequest<CancelResponse>(
    "CancelRoomDirectJson",
    "DELETE",
    request
  );
}

/**
 * Helper function to build PreBook JSON request
 */
export function buildPreBookRequest(
  code: string,
  searchRequest: {
    dateFrom: string;
    dateTo: string;
    hotelId: string;
    pax: Array<{ adults: number; children: any[] }>;
  }
): PreBookRequest {
  const jsonRequest = {
    services: [
      {
        searchCodes: [
          {
            code,
            pax: searchRequest.pax,
          },
        ],
        searchRequest: {
          currencies: ["USD"],
          customerCountry: "IL",
          dates: {
            from: searchRequest.dateFrom,
            to: searchRequest.dateTo,
          },
          destinations: [
            {
              id: parseInt(searchRequest.hotelId),
              type: "hotel",
            },
          ],
          filters: [
            { name: "payAtTheHotel", value: true },
            { name: "onRequest", value: false },
            { name: "showSpecialDeals", value: true },
          ],
          pax: searchRequest.pax,
          service: "hotels",
        },
      },
    ],
  };

  return {
    jsonRequest: JSON.stringify(jsonRequest),
  };
}

/**
 * Helper function to build Book JSON request
 */
export function buildBookRequest(
  token: string,
  code: string,
  customer: {
    title: string;
    firstName: string;
    lastName: string;
    birthDate?: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    state: string;
    zip: string;
  },
  pax: Array<{
    adults: Array<{
      lead: boolean;
      title: string;
      firstName: string;
      lastName: string;
    }>;
    children: any[];
  }>,
  searchRequest: {
    dateFrom: string;
    dateTo: string;
    hotelId: string;
  }
): BookRequest {
  const jsonRequest = {
    customer: {
      title: customer.title,
      name: {
        first: customer.firstName,
        last: customer.lastName,
      },
      birthDate: customer.birthDate || "1980-01-01",
      contact: {
        address: customer.address,
        city: customer.city,
        country: customer.country,
        email: customer.email,
        phone: customer.phone,
        state: customer.state,
        zip: customer.zip,
      },
    },
    paymentMethod: {
      methodName: "account_credit",
    },
    reference: {
      agency: "AI Travel Agent Platform",
      voucherEmail: customer.email,
    },
    services: [
      {
        bookingRequest: [
          {
            code,
            pax: pax.map((p) => ({
              adults: p.adults.map((adult) => ({
                lead: adult.lead,
                title: adult.title,
                name: {
                  first: adult.firstName,
                  last: adult.lastName,
                },
                contact: {
                  address: customer.address,
                  city: customer.city,
                  country: customer.country,
                  email: customer.email,
                  phone: customer.phone,
                  state: customer.state,
                  zip: customer.zip,
                },
              })),
              children: p.children,
            })),
            token,
          },
        ],
        searchRequest: {
          currencies: ["USD"],
          customerCountry: "IL",
          dates: {
            from: searchRequest.dateFrom,
            to: searchRequest.dateTo,
          },
          destinations: [
            {
              id: parseInt(searchRequest.hotelId),
              type: "hotel",
            },
          ],
          filters: [
            { name: "payAtTheHotel", value: true },
            { name: "onRequest", value: false },
            { name: "showSpecialDeals", value: true },
          ],
          pax: pax.map((p) => ({ adults: p.adults.length, children: p.children })),
          service: "hotels",
        },
      },
    ],
  };

  return {
    jsonRequest: JSON.stringify(jsonRequest),
  };
}

/**
 * Helper function to build Cancel JSON request
 */
export function buildCancelRequest(
  bookingId: number,
  cancelReason: string = "",
  force: boolean = false,
  isManual: boolean = false
): CancelRequest {
  const jsonRequest = {
    BookingID: bookingId,
    CancelReason: cancelReason,
    Force: force,
    IsManual: isManual,
  };

  return {
    jsonRequest: JSON.stringify(jsonRequest),
  };
}
