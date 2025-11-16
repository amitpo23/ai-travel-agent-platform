// Simple test without dotenv
const MEDICI_API_TOKEN = process.env.MEDICI_API_TOKEN;
const MEDICI_CLIENT_SECRET = process.env.MEDICI_CLIENT_SECRET;
const BASE_URL = 'https://medici-backend.azurewebsites.net/api/hotels';

console.log('🔍 Testing Medici Hotels API\n');
console.log('Token exists:', !!MEDICI_API_TOKEN);
console.log('Token preview:', MEDICI_API_TOKEN ? MEDICI_API_TOKEN.substring(0, 30) + '...' : 'NOT FOUND');
console.log('Client Secret exists:', !!MEDICI_CLIENT_SECRET);
console.log('Client Secret preview:', MEDICI_CLIENT_SECRET ? MEDICI_CLIENT_SECRET.substring(0, 20) + '...' : 'NOT FOUND');
console.log('Base URL:', BASE_URL);
console.log('\n' + '='.repeat(60) + '\n');

// Test GetInnstantSearchPrice
const searchRequest = {
  dateFrom: '2025-03-15',
  dateTo: '2025-03-17',
  city: 'Dubai',
  pax: [{
    adults: 2,
    children: []
  }],
  ShowExtendedData: true,
  client_secret: MEDICI_CLIENT_SECRET
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
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  
  const data = await response.json();
  
  if (response.ok) {
    console.log('\n✅ SUCCESS!');
    console.log('Number of items:', data.items?.length || 0);
    
    if (data.items && data.items.length > 0) {
      console.log('\nFirst hotel:');
      const firstHotel = data.items[0];
      console.log('- Name:', firstHotel.name);
      console.log('- Address:', firstHotel.address);
      console.log('- Stars:', firstHotel.stars);
      console.log('- Rooms available:', firstHotel.items?.length || 0);
      
      if (firstHotel.items && firstHotel.items.length > 0) {
        const firstRoom = firstHotel.items[0];
        console.log('\nFirst room:');
        console.log('- Room name:', firstRoom.name);
        console.log('- Category:', firstRoom.category);
        console.log('- Bedding:', firstRoom.bedding);
        console.log('- Board:', firstRoom.board);
        console.log('- Code:', firstRoom.code);
      }
    }
  } else {
    console.log('\n❌ ERROR!');
    console.log('Response:', JSON.stringify(data, null, 2));
  }
} catch (error) {
  console.error('\n❌ EXCEPTION!');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}
