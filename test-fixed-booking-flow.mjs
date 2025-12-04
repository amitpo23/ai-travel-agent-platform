#!/usr/bin/env node
/**
 * בדיקת תהליך הזמנה מלא עם התיקון של pax format
 */

const MEDICI_API_TOKEN = process.env.MEDICI_API_TOKEN || 'eyJhbGciOiJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNobWFjLXNoYTI1NiIsInR5cCI6IkpXVCJ9.eyJQZXJtaXNzaW9ucyI6IjEiLCJVc2VySWQiOiIyNCIsIm5iZiI6MTc1MjQ3NTYwNCwiZXhwIjoyMDY4MDA4NDA0LCJpc3MiOiJodHRwczovL2FkbWluLm1lZGljaWhvdGVscy5jb20vIiwiYXVkIjoiaHR0cHM6Ly9hZG1pbi5tZWRpY2lob3RlbHMuY29tLyJ9.eA8EeHx6gGRtGBts4yXAWnK5P0Wl_LQLD1LKobYBV4U';
const BASE_URL = 'https://medici-backend.azurewebsites.net/api/hotels';

console.log('🧪 בדיקת תהליך הזמנה מלא\n');
console.log('='.repeat(70));

// Helper function to build PreBook request with FIXED pax format
function buildPreBookRequest(code, searchRequest) {
  // Convert pax format: { adults: 2 } → { adults: [{age: 30, name: "Guest1"}, ...] }
  const convertedPax = searchRequest.pax.map(paxGroup => ({
    adults: Array.from({ length: paxGroup.adults }, (_, i) => ({
      age: 30,  // Default age
      name: `Guest${i + 1}`,
      surname: "Traveler"
    })),
    children: paxGroup.children || []
  }));

  return {
    jsonRequest: JSON.stringify({
      services: [{
        code,
        pax: convertedPax,
        searchRequest: {
          currencies: ["USD"],
          customerCountry: "IL",
          dates: {
            from: searchRequest.dateFrom,
            to: searchRequest.dateTo,
          },
          destinations: [{
            id: parseInt(searchRequest.hotelId),
            type: "hotel",
          }],
          filters: [
            { name: "payAtTheHotel", value: true },
            { name: "onRequest", value: false },
            { name: "showSpecialDeals", value: true },
          ],
          pax: convertedPax,
          service: "hotels",
        },
      }],
    })
  };
}

try {
  // שלב 1: חיפוש
  console.log('\n📍 שלב 1: חיפוש מלונות...');

  const searchRequest = {
    dateFrom: '2025-12-10',
    dateTo: '2025-12-11',
    city: 'Tel Aviv',
    pax: [{ adults: 2, children: [] }],
    ShowExtendedData: true,
    limit: 1
  };

  console.log('Request:', JSON.stringify(searchRequest, null, 2));

  const searchResponse = await fetch(`${BASE_URL}/GetInnstantSearchPrice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MEDICI_API_TOKEN}`
    },
    body: JSON.stringify(searchRequest)
  });

  const searchResult = await searchResponse.json();

  if (!searchResult.items || searchResult.items.length === 0) {
    console.log('❌ לא נמצאו תוצאות');
    process.exit(1);
  }

  const hotel = searchResult.items[0];
  const room = hotel.items[0];
  const code = hotel.code;
  const hotelId = room.hotelId;

  console.log('\n✅ מצאנו מלון:');
  console.log(`   שם: ${room.hotelName}`);
  console.log(`   חדר: ${room.name}`);
  console.log(`   מחיר: ${hotel.price.amount} ${hotel.price.currency}`);
  console.log(`   קוד: ${code}`);
  console.log(`   Hotel ID: ${hotelId}`);

  // שלב 2: PreBook עם הפורמט המתוקן
  console.log('\n📍 שלב 2: PreBook עם פורמט pax מתוקן...');

  const preBookRequestBody = buildPreBookRequest(code, {
    dateFrom: searchRequest.dateFrom,
    dateTo: searchRequest.dateTo,
    hotelId: hotelId,
    pax: [{ adults: 2, children: [] }]
  });

  // הצג את ה-jsonRequest המתוקן
  const parsedRequest = JSON.parse(preBookRequestBody.jsonRequest);
  console.log('\nפורמט pax מתוקן:');
  console.log(JSON.stringify(parsedRequest.services[0].pax, null, 2));

  console.log('\nשולח PreBook request...');
  const preBookResponse = await fetch(`${BASE_URL}/PreBook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MEDICI_API_TOKEN}`
    },
    body: JSON.stringify(preBookRequestBody)
  });

  console.log(`\nHTTP Status: ${preBookResponse.status} ${preBookResponse.statusText}`);

  let preBookResult;
  const preBookText = await preBookResponse.text();

  if (preBookText) {
    try {
      preBookResult = JSON.parse(preBookText);
      console.log('\nPreBook Response:');
      console.log(JSON.stringify(preBookResult, null, 2));
    } catch (e) {
      console.log('\nPreBook Response (non-JSON):');
      console.log(preBookText);
    }
  } else {
    console.log('\n❌ PreBook החזיר תגובה ריקה (HTTP 204)');
    preBookResult = {};
  }

  if (preBookResult.status === 'done' && preBookResult.token) {
    console.log('\n✅ PreBook הצליח!');
    console.log(`Token: ${preBookResult.token.substring(0, 50)}...`);
    console.log('\n🎉 תהליך ההזמנה עובד! ניתן להמשיך ל-Book.');
  } else if (preBookResult.content?.services?.hotels?.[0]?.token) {
    console.log('\n✅ PreBook הצליח!');
    console.log(`Token: ${preBookResult.content.services.hotels[0].token.substring(0, 50)}...`);
    console.log('\n🎉 תהליך ההזמנה עובד! ניתן להמשיך ל-Book.');
  } else {
    console.log('\n⚠️ PreBook לא החזיר token');
    console.log('Status:', preBookResult.status);
    console.log('Full response:', JSON.stringify(preBookResult, null, 2));
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ בדיקה הושלמה');

} catch (error) {
  console.error('\n❌ שגיאה בבדיקה:', error.message);
  if (error.stack) {
    console.error('\nStack trace:', error.stack);
  }
  process.exit(1);
}
