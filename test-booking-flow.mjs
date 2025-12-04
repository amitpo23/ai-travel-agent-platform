#!/usr/bin/env node
/**
 * בדיקה מלאה של תהליך ההזמנה - מחיפוש עד הזמנה מלאה
 * Usage: node test-booking-flow.mjs
 */

const MEDICI_API_TOKEN = process.env.MEDICI_API_TOKEN || 'eyJhbGciOiJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNobWFjLXNoYTI1NiIsInR5cCI6IkpXVCJ9.eyJQZXJtaXNzaW9ucyI6IjEiLCJVc2VySWQiOiIyNCIsIm5iZiI6MTc1MjQ3NTYwNCwiZXhwIjoyMDY4MDA4NDA0LCJpc3MiOiJodHRwczovL2FkbWluLm1lZGljaWhvdGVscy5jb20vIiwiYXVkIjoiaHR0cHM6Ly9hZG1pbi5tZWRpY2lob3RlbHMuY29tLyJ9.eA8EeHx6gGRtGBts4yXAWnK5P0Wl_LQLD1LKobYBV4U';
const BASE_URL = 'https://medici-backend.azurewebsites.net/api/hotels';

console.log('🏨 בדיקה מלאה של תהליך ההזמנה\n');
console.log('=' .repeat(70));

// שלב 1: חיפוש מלונות
console.log('\n📍 שלב 1: חיפוש מלונות (GetInnstantSearchPrice)');
console.log('-'.repeat(70));

const searchRequest = {
  dateFrom: '2025-12-10',
  dateTo: '2025-12-11',
  city: 'Tel Aviv',
  pax: [{ adults: 2, children: [] }],
  ShowExtendedData: true,
  limit: 2
};

console.log('Request:', JSON.stringify(searchRequest, null, 2));

let selectedRoom = null;
let searchResponse = null;

try {
  const response = await fetch(`${BASE_URL}/GetInnstantSearchPrice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MEDICI_API_TOKEN}`
    },
    body: JSON.stringify(searchRequest)
  });

  console.log(`\nResponse: ${response.status} ${response.statusText}`);
  searchResponse = await response.json();

  if (response.ok && searchResponse.items && searchResponse.items.length > 0) {
    console.log(`✅ מצאנו ${searchResponse.items.length} תוצאות`);

    const firstHotel = searchResponse.items[0];
    const firstRoom = firstHotel.items[0];

    selectedRoom = {
      code: firstHotel.code,
      hotelId: firstRoom.hotelId,
      hotelName: firstRoom.hotelName,
      roomName: firstRoom.name,
      price: firstHotel.price,
      cancellation: firstHotel.cancellation
    };

    console.log('\n🏨 בחרנו חדר:');
    console.log(`   מלון: ${selectedRoom.hotelName}`);
    console.log(`   חדר: ${selectedRoom.roomName}`);
    console.log(`   מחיר: ${selectedRoom.price.amount} ${selectedRoom.price.currency}`);
    console.log(`   קוד: ${selectedRoom.code}`);
    console.log(`   Hotel ID: ${selectedRoom.hotelId}`);
  } else {
    console.log('❌ לא נמצאו מלונות');
    console.log('Response:', JSON.stringify(searchResponse, null, 2));
    process.exit(1);
  }
} catch (error) {
  console.error('❌ שגיאה בחיפוש:', error.message);
  process.exit(1);
}

// שלב 2: PreBook
console.log('\n\n📍 שלב 2: PreBook (אישור זמינות)');
console.log('-'.repeat(70));

const preBookRequest = {
  jsonRequest: JSON.stringify({
    services: [{
      searchCodes: [{
        code: selectedRoom.code,
        pax: searchRequest.pax
      }],
      searchRequest: {
        currencies: ['USD'],
        customerCountry: 'IL',
        dates: {
          from: searchRequest.dateFrom,
          to: searchRequest.dateTo
        },
        destinations: [{
          id: parseInt(selectedRoom.hotelId),
          type: 'hotel'
        }],
        filters: [
          { name: 'payAtTheHotel', value: true },
          { name: 'onRequest', value: false },
          { name: 'showSpecialDeals', value: true }
        ],
        pax: searchRequest.pax,
        service: 'hotels'
      }
    }]
  })
};

console.log('Request structure:', {
  hasJsonRequest: !!preBookRequest.jsonRequest,
  code: selectedRoom.code,
  hotelId: selectedRoom.hotelId
});

let preBookToken = null;

try {
  const response = await fetch(`${BASE_URL}/PreBook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MEDICI_API_TOKEN}`
    },
    body: JSON.stringify(preBookRequest)
  });

  console.log(`\nResponse: ${response.status} ${response.statusText}`);
  const preBookResponse = await response.json();

  if (response.ok) {
    console.log('✅ PreBook הצליח!');

    // חיפוש ה-token בתגובה
    if (preBookResponse.content?.services?.hotels?.[0]?.token) {
      preBookToken = preBookResponse.content.services.hotels[0].token;
      console.log('Token:', preBookToken.substring(0, 30) + '...');

      const hotelData = preBookResponse.content.services.hotels[0];
      console.log(`\nמחיר מאושר: ${hotelData.price.amount} ${hotelData.price.currency}`);
      console.log(`ביטול: ${hotelData.cancellation.type}`);
    } else {
      console.log('⚠️ לא מצאנו token בתגובה');
      console.log('Response:', JSON.stringify(preBookResponse, null, 2).substring(0, 500));
    }
  } else {
    console.log('❌ PreBook נכשל');
    console.log('Response:', JSON.stringify(preBookResponse, null, 2));
    process.exit(1);
  }
} catch (error) {
  console.error('❌ שגיאה ב-PreBook:', error.message);
  process.exit(1);
}

// שלב 3: Book (לא נריץ באמת - רק נראה את הפורמט)
console.log('\n\n📍 שלב 3: Book (ביצוע הזמנה)');
console.log('-'.repeat(70));
console.log('⚠️ לא מריצים Book באמת כדי לא ליצור הזמנה אמיתית');
console.log('\n💡 פורמט ה-Book request:');

const bookRequestExample = {
  jsonRequest: JSON.stringify({
    customer: {
      title: 'MR',
      name: {
        first: 'Test',
        last: 'User'
      },
      birthDate: '1990-01-01',
      contact: {
        address: '123 Test St',
        city: 'Tel Aviv',
        country: 'IL',
        email: 'test@example.com',
        phone: '+972501234567',
        state: 'IL',
        zip: '12345'
      }
    },
    paymentMethod: {
      methodName: 'account_credit'
    },
    reference: {
      agency: 'AI Travel Agent Platform',
      voucherEmail: 'test@example.com'
    },
    services: [{
      bookingRequest: [{
        code: selectedRoom.code,
        pax: [{
          adults: [{
            lead: true,
            title: 'MR',
            name: {
              first: 'Test',
              last: 'User'
            },
            contact: {
              address: '123 Test St',
              city: 'Tel Aviv',
              country: 'IL',
              email: 'test@example.com',
              phone: '+972501234567',
              state: 'IL',
              zip: '12345'
            }
          }],
          children: []
        }],
        token: preBookToken || 'TOKEN_FROM_PREBOOK'
      }],
      searchRequest: {
        currencies: ['USD'],
        customerCountry: 'IL',
        dates: {
          from: searchRequest.dateFrom,
          to: searchRequest.dateTo
        },
        destinations: [{
          id: parseInt(selectedRoom.hotelId),
          type: 'hotel'
        }],
        filters: [
          { name: 'payAtTheHotel', value: true },
          { name: 'onRequest', value: false },
          { name: 'showSpecialDeals', value: true }
        ],
        pax: [{ adults: 2, children: [] }],
        service: 'hotels'
      }
    }]
  })
};

console.log(JSON.stringify(JSON.parse(bookRequestExample.jsonRequest), null, 2).substring(0, 800));

// סיכום
console.log('\n\n' + '='.repeat(70));
console.log('✅ סיכום הבדיקה:\n');
console.log('✅ שלב 1 - Search: עובד מצוין');
console.log(`${preBookToken ? '✅' : '❌'} שלב 2 - PreBook: ${preBookToken ? 'עובד וקיבלנו token' : 'נכשל'}`);
console.log('⚠️  שלב 3 - Book: לא נבדק (כדי לא ליצור הזמנה אמיתית)');

if (preBookToken) {
  console.log('\n🎉 התהליך עובד! אפשר להמשיך להזמנה מלאה.');
  console.log('\n💡 כדי להריץ Book אמיתי, הוסף את הקוד למטה:');
  console.log('   await fetch(`${BASE_URL}/Book`, {...})');
} else {
  console.log('\n⚠️ יש בעיה ב-PreBook - צריך לתקן לפני המשך');
}

console.log('\n' + '='.repeat(70));
