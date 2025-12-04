#!/usr/bin/env node
/**
 * Testing different PreBook request formats to find what works
 */

const MEDICI_API_TOKEN = 'eyJhbGciOiJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNobWFjLXNoYTI1NiIsInR5cCI6IkpXVCJ9.eyJQZXJtaXNzaW9ucyI6IjEiLCJVc2VySWQiOiIyNCIsIm5iZiI6MTc1MjQ3NTYwNCwiZXhwIjoyMDY4MDA4NDA0LCJpc3MiOiJodHRwczovL2FkbWluLm1lZGljaWhvdGVscy5jb20vIiwiYXVkIjoiaHR0cHM6Ly9hZG1pbi5tZWRpY2lob3RlbHMuY29tLyJ9.eA8EeHx6gGRtGBts4yXAWnK5P0Wl_LQLD1LKobYBV4U';
const BASE_URL = 'https://medici-backend.azurewebsites.net';

// First get a valid code
console.log('Step 1: Getting valid code from search...\n');

const searchRequest = {
  dateFrom: '2025-12-10',
  dateTo: '2025-12-11',
  city: 'Tel Aviv',
  pax: [{ adults: 2, children: [] }],
  ShowExtendedData: true,
  limit: 1
};

const searchResponse = await fetch(`${BASE_URL}/api/hotels/GetInnstantSearchPrice`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${MEDICI_API_TOKEN}`
  },
  body: JSON.stringify(searchRequest)
});

const searchData = await searchResponse.json();

if (!searchData.items || searchData.items.length === 0) {
  console.log('❌ No search results');
  process.exit(1);
}

const code = searchData.items[0].code;
const hotelId = searchData.items[0].items[0].hotelId;

console.log(`✅ Got code: ${code}`);
console.log(`✅ Got hotelId: ${hotelId}\n`);

// Test different PreBook formats
const formats = [
  {
    name: 'Format 1: Documentation Simple (direct code)',
    request: {
      jsonRequest: JSON.stringify({
        services: [{
          code: code,
          pax: [{
            adults: [{
              age: 30,
              name: "Test",
              surname: "Guest"
            }, {
              age: 30,
              name: "Test2",
              surname: "Guest2"
            }],
            children: []
          }]
        }]
      })
    }
  },
  {
    name: 'Format 2: Current Code (searchCodes + searchRequest)',
    request: {
      jsonRequest: JSON.stringify({
        services: [{
          searchCodes: [{
            code: code,
            pax: [{
              adults: [{
                age: 30,
                name: "Test",
                surname: "Guest"
              }, {
                age: 30,
                name: "Test2",
                surname: "Guest2"
              }],
              children: []
            }]
          }],
          searchRequest: {
            currencies: ["USD"],
            customerCountry: "IL",
            dates: {
              from: "2025-12-10",
              to: "2025-12-11"
            },
            destinations: [{
              id: parseInt(hotelId),
              type: "hotel"
            }],
            filters: [
              { name: "payAtTheHotel", value: true },
              { name: "onRequest", value: false },
              { name: "showSpecialDeals", value: true }
            ],
            pax: [{
              adults: [{
                age: 30,
                name: "Test",
                surname: "Guest"
              }, {
                age: 30,
                name: "Test2",
                surname: "Guest2"
              }],
              children: []
            }],
            service: "hotels"
          }
        }]
      })
    }
  },
  {
    name: 'Format 3: Simple with searchRequest (hybrid)',
    request: {
      jsonRequest: JSON.stringify({
        services: [{
          code: code,
          pax: [{
            adults: [{
              age: 30,
              name: "Test",
              surname: "Guest"
            }, {
              age: 30,
              name: "Test2",
              surname: "Guest2"
            }],
            children: []
          }],
          searchRequest: {
            currencies: ["USD"],
            customerCountry: "IL",
            dates: {
              from: "2025-12-10",
              to: "2025-12-11"
            },
            destinations: [{
              id: parseInt(hotelId),
              type: "hotel"
            }],
            filters: [
              { name: "payAtTheHotel", value: true },
              { name: "onRequest", value: false },
              { name: "showSpecialDeals", value: true }
            ],
            pax: [{
              adults: [{
                age: 30,
                name: "Test",
                surname: "Guest"
              }, {
                age: 30,
                name: "Test2",
                surname: "Guest2"
              }],
              children: []
            }],
            service: "hotels"
          }
        }]
      })
    }
  }
];

for (const format of formats) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Testing: ${format.name}`);
  console.log('='.repeat(70));

  try {
    const response = await fetch(`${BASE_URL}/api/hotels/PreBook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MEDICI_API_TOKEN}`
      },
      body: JSON.stringify(format.request)
    });

    console.log(`HTTP Status: ${response.status}`);

    const text = await response.text();

    if (text) {
      try {
        const data = JSON.parse(text);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (data.status === 'done' && data.token) {
          console.log(`\n✅ SUCCESS! Token: ${data.token}`);
          console.log('This is the correct format!\n');
          break;
        } else if (data.status === 'error') {
          console.log(`\n❌ Error: ${data.errorMessage}`);
        }
      } catch (e) {
        console.log('Response (non-JSON):', text);
      }
    } else {
      console.log('❌ Empty response (HTTP 204)');
    }
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
  }

  // Wait a bit between requests
  await new Promise(resolve => setTimeout(resolve, 1000));
}

console.log(`\n${'='.repeat(70)}`);
console.log('Testing complete');
console.log('='.repeat(70));
