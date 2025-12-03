// Test script with client_secret
const BASE_URL = 'https://medici-backend.azurewebsites.net/api/hotels';
const CLIENT_SECRET = 'zlbgGGxz~|l3.Q?XXAT)uT!Lty,kJC>R?`:k?oQH$I=P7rL<R:Em:qDaM1G(jFU7';

console.log('🔍 Testing Medici Hotels API with client_secret\n');
console.log('Base URL:', BASE_URL);
console.log('Client Secret:', CLIENT_SECRET.substring(0, 20) + '...');
console.log('\n' + '='.repeat(60) + '\n');

// Test GetInnstantSearchPrice - Using official Medici API format
const searchRequest = {
  dateFrom: '2025-12-11',
  dateTo: '2025-12-12',
  city: 'Tel Aviv',
  pax: [{
    adults: 2,
    children: []
  }],
  ShowExtendedData: true,  // IMPORTANT: Returns images, descriptions, facilities
  client_secret: CLIENT_SECRET
};

console.log('📍 Sending request to GetInnstantSearchPrice');
console.log('Request body (without secret):', JSON.stringify({
  ...searchRequest,
  client_secret: '***HIDDEN***'
}, null, 2));
console.log('\n');

try {
  const response = await fetch(`${BASE_URL}/GetInnstantSearchPrice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(searchRequest)
  });

  console.log('Response status:', response.status);
  console.log('Response status text:', response.statusText);
  
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
        console.log('- Price:', firstRoom.price?.amount, firstRoom.price?.currency);
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
}
