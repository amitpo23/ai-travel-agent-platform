#!/usr/bin/env node
/**
 * סקריפט מתקדם לקבלת Bearer Token מ-Medici API
 * מנסה גם עם token + key שנתנו לך
 */

// הנתונים שקיבלת מ-Medici B2B
const CREDENTIALS = {
  client_secret: 'zlbgGGxz~|l3.Q?XXAT)uT!Lty,kJC>R?`:k?oQH$I=P7rL<R:Em:qDaM1G(jFU7',
  token: '$2y$10$QcGPkHG9Rk1VRTClz0HIsO3qQpm3JEU84QqfZadIVIoVHn5M7Tpnu',
  key: '$2y$10$zmUK0OGNeeTtiGcV/cpWsOrZY7VXbt0Bzp16VwPPQ8z46DNV6esum'
};

const TOKEN_API_URL = 'https://medici-backend.azurewebsites.net/api/auth/OnlyNightUsersTokenAPI';

console.log('🔐 מבקש Bearer Token מ-Medici API (מתקדם)...\n');
console.log('API URL:', TOKEN_API_URL);
console.log('='.repeat(70) + '\n');

const attempts = [
  {
    name: 'JSON: רק client_secret',
    config: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_secret: CREDENTIALS.client_secret })
    }
  },
  {
    name: 'JSON: client_secret + token',
    config: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_secret: CREDENTIALS.client_secret,
        token: CREDENTIALS.token
      })
    }
  },
  {
    name: 'JSON: client_secret + key',
    config: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_secret: CREDENTIALS.client_secret,
        key: CREDENTIALS.key
      })
    }
  },
  {
    name: 'JSON: כל השלושה',
    config: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(CREDENTIALS)
    }
  },
  {
    name: 'Form-urlencoded: רק client_secret',
    config: {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_secret: CREDENTIALS.client_secret }).toString()
    }
  },
  {
    name: 'Form-urlencoded: client_secret + token',
    config: {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_secret: CREDENTIALS.client_secret,
        token: CREDENTIALS.token
      }).toString()
    }
  },
  {
    name: 'Form-urlencoded: כל השלושה',
    config: {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(CREDENTIALS).toString()
    }
  },
  {
    name: 'Authorization Header: token + key',
    config: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CREDENTIALS.token}`,
        'X-API-Key': CREDENTIALS.key
      },
      body: JSON.stringify({ client_secret: CREDENTIALS.client_secret })
    }
  }
];

let attemptNumber = 0;
for (const attempt of attempts) {
  attemptNumber++;
  console.log(`\n📤 נסיון ${attemptNumber}/${attempts.length}: ${attempt.name}`);
  console.log('-'.repeat(70));

  try {
    const response = await fetch(TOKEN_API_URL, attempt.config);
    console.log(`📥 סטטוס: ${response.status} ${response.statusText}`);

    const contentType = response.headers.get('content-type') || '';

    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (response.ok) {
      console.log('✅ הצלחה!\n');
      console.log(JSON.stringify(data, null, 2));

      // חיפוש ה-token בתגובה
      const possibleTokenFields = ['token', 'access_token', 'bearer_token', 'jwt', 'accessToken'];
      let foundToken = null;

      if (typeof data === 'object') {
        for (const field of possibleTokenFields) {
          if (data[field]) {
            foundToken = data[field];
            break;
          }
        }
      }

      if (foundToken) {
        console.log('\n🎉 Bearer Token נמצא!');
        console.log('='.repeat(70));
        console.log(foundToken);
        console.log('='.repeat(70));
        console.log('\n💡 הוסף את זה ל-.env שלך:');
        console.log(`MEDICI_API_TOKEN=${foundToken}`);
        console.log('\n✅ הנסיון הזה עבד! זכור את זה לפעם הבאה.\n');
        process.exit(0);
      } else {
        console.log('⚠️  קיבלנו תגובה מוצלחת אבל לא מצאנו Bearer Token בתגובה');
      }
    } else {
      console.log('❌ שגיאה:');
      if (typeof data === 'string') {
        console.log(data.substring(0, 200));
      } else {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  } catch (error) {
    console.error('❌ חריגה:', error.message);
  }
}

console.log('\n' + '='.repeat(70));
console.log('\n❌ כל הנסיונות נכשלו!\n');
console.log('📋 מה לעשות עכשיו:\n');
console.log('1. 📞 צור קשר עם Medici Support וברר:');
console.log('   - מה הפורמט הנכון של הבקשה ל-OnlyNightUsersTokenAPI?');
console.log('   - האם צריך credentials נוספים?');
console.log('   - מה ה-endpoint הנכון לקבלת Bearer Token?');
console.log('');
console.log('2. 📧 אולי יש להם API documentation או Postman collection?');
console.log('');
console.log('3. ✅ ה-Bearer Token הקיים שלך עובד ותקף עד 2035!');
console.log('   אין צורך להחליף אותו עכשיו.');
console.log('   Token: eyJhbGciOiJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNobWFjLXNoYTI1NiIsInR5cCI6IkpXVCJ9...');
console.log('');
console.log('4. 🔍 בדוק שהשרת שלך מוריד נכון:');
console.log('   node test-instant-search.mjs');
console.log('');
