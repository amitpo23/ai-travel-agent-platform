// Test instant search with Bearer token from curl example
const MEDICI_API_TOKEN = 'eyJhbGciOiJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNobWFjLXNoYTI1NiIsInR5cCI6IkpXVCJ9.eyJQZXJtaXNzaW9ucyI6IjEiLCJVc2VySWQiOiIyNCIsIm5iZiI6MTc1MjQ3NTYwNCwiZXhwIjoyMDY4MDA4NDA0LCJpc3MiOiJodHRwczovL2FkbWluLm1lZGljaWhvdGVscy5jb20vIiwiYXVkIjoiaHR0cHM6Ly9hZG1pbi5tZWRpY2lob3RlbHMuY29tLyJ9.eA8EeHx6gGRtGBts4yXAWnK5P0Wl_LQLD1LKobYBV4U';
const BASE_URL = 'https://medici-backend.azurewebsites.net/api/hotels';

console.log('🔍 Testing GetInnstantSearchPrice with correct structure\n');
console.log('Base URL:', BASE_URL);
console.log('Using Bearer token from curl example\n');
console.log('='.repeat(60) + '\n');

// Test with exact structure from curl command
const searchRequest = {
  dateFrom: '2025-03-15',
  dateTo: '2025-03-16',
  city: 'Dubai',
  adults: 2,
  paxChildren: [],
  limit: 3
};

console.log('📍 Sending request to GetInnstantSearchPrice');
console.log('Request body:', JSON.stringify(searchRequest, null, 2));
console.log('\n');

try {
  const response = await fetch(`${BASE_URL}/GetInnstantSearchPrice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MEDICI_API_TOKEN}`
    },
    body: JSON.stringify(searchRequest)
  });

  console.log('Response status:', response.status);
  console.log('Response status text:', response.statusText);

  const data = await response.json();

  if (response.ok) {
    console.log('\n✅ SUCCESS!');
    console.log('Response structure:', Object.keys(data));
    console.log('Number of items:', data.items?.length || 0);

    if (data.items && data.items.length > 0) {
      console.log('\nFirst result:');
      const first = data.items[0];
      console.log(JSON.stringify(first, null, 2));
    }

    console.log('\n✅ API is working correctly with new structure!');
  } else {
    console.log('\n❌ ERROR!');
    console.log('Response:', JSON.stringify(data, null, 2));
  }
} catch (error) {
  console.error('\n❌ EXCEPTION!');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}
