import 'dotenv/config';

const MEDICI_API_TOKEN = process.env.MEDICI_API_TOKEN;
const BASE_URL = 'https://onlynight.co.il/api';

if (!MEDICI_API_TOKEN) {
  console.error('❌ MEDICI_API_TOKEN not found in environment variables');
  process.exit(1);
}

console.log('🔍 Testing Medici Hotels API Integration\n');
console.log('Token:', MEDICI_API_TOKEN.substring(0, 20) + '...\n');

// Test 1: GetInstantSearchPrice
async function testSearchHotels() {
  console.log('📍 Test 1: GetInstantSearchPrice (Search Hotels)');
  console.log('─'.repeat(50));
  
  const searchRequest = {
    dateFrom: '2025-03-15',
    dateTo: '2025-03-17',
    hotelName: '',
    pax: [
      {
        adults: 2,
        children: [],
        infants: 0
      }
    ],
    stars: [],
    limit: 5
  };

  try {
    const response = await fetch(`${BASE_URL}/GetInstantSearchPrice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MEDICI_API_TOKEN}`
      },
      body: JSON.stringify({ searchRequest })
    });

    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.searchResponse?.hotels?.length > 0) {
      console.log('✅ Search successful!');
      console.log(`Found ${data.searchResponse.hotels.length} hotels`);
      console.log('First hotel:', data.searchResponse.hotels[0].hotelName);
      return data.searchResponse.hotels[0]; // Return first hotel for next test
    } else {
      console.log('⚠️ No hotels found or error occurred');
      return null;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// Test 2: PreBook
async function testPreBook(hotelCode, searchRequest) {
  console.log('\n📍 Test 2: PreBook (Confirm Availability)');
  console.log('─'.repeat(50));
  
  if (!hotelCode) {
    console.log('⚠️ Skipping PreBook test - no hotel code from search');
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/PreBook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MEDICI_API_TOKEN}`
      },
      body: JSON.stringify({
        code: hotelCode,
        searchRequest
      })
    });

    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.token) {
      console.log('✅ PreBook successful!');
      console.log('Token received:', data.token.substring(0, 30) + '...');
      return data.token;
    } else {
      console.log('⚠️ PreBook failed or no token received');
      return null;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// Test 3: Book
async function testBook(token) {
  console.log('\n📍 Test 3: Book (Complete Booking)');
  console.log('─'.repeat(50));
  
  if (!token) {
    console.log('⚠️ Skipping Book test - no token from PreBook');
    return;
  }

  const guestInfo = {
    firstName: 'Test',
    lastName: 'User',
    address: '123 Test Street',
    city: 'Tel Aviv',
    country: 'Israel',
    email: 'test@example.com',
    phone: '+972501234567'
  };

  try {
    const response = await fetch(`${BASE_URL}/Book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MEDICI_API_TOKEN}`
      },
      body: JSON.stringify({
        token,
        ...guestInfo
      })
    });

    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.BookingID) {
      console.log('✅ Booking successful!');
      console.log('Booking ID:', data.BookingID);
      return data.BookingID;
    } else {
      console.log('⚠️ Booking failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// Run all tests
async function runTests() {
  const searchRequest = {
    dateFrom: '2025-03-15',
    dateTo: '2025-03-17',
    hotelName: '',
    pax: [
      {
        adults: 2,
        children: [],
        infants: 0
      }
    ],
    stars: [],
    limit: 5
  };

  // Test 1: Search
  const firstHotel = await testSearchHotels();
  
  if (!firstHotel) {
    console.log('\n❌ Cannot proceed with further tests - search failed');
    return;
  }

  // Test 2: PreBook
  const hotelCode = firstHotel.rooms?.[0]?.code;
  const token = await testPreBook(hotelCode, searchRequest);
  
  // Test 3: Book (commented out to avoid actual booking)
  // Uncomment if you want to test actual booking
  // const bookingId = await testBook(token);
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ API Integration Tests Complete!');
  console.log('='.repeat(50));
}

runTests();
