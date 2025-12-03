#!/usr/bin/env node
/**
 * סקריפט לקבלת Bearer Token חדש מ-Medici API
 *
 * שימוש:
 *   node get-bearer-token.mjs
 */

const CLIENT_SECRET = 'zlbgGGxz~|l3.Q?XXAT)uT!Lty,kJC>R?`:k?oQH$I=P7rL<R:Em:qDaM1G(jFU7';
const TOKEN_API_URL = 'https://medici-backend.azurewebsites.net/api/auth/OnlyNightUsersTokenAPI';

console.log('🔐 מבקש Bearer Token חדש מ-Medici API...\n');
console.log('API URL:', TOKEN_API_URL);
console.log('Client Secret:', CLIENT_SECRET.substring(0, 20) + '...');
console.log('='.repeat(70) + '\n');

// נסיון 1: JSON body
console.log('📤 נסיון 1: שליחת בקשה עם JSON body\n');

try {
  const response1 = await fetch(TOKEN_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_secret: CLIENT_SECRET
    })
  });

  console.log('📥 תגובה:', response1.status, response1.statusText);

  const contentType = response1.headers.get('content-type');
  console.log('Content-Type:', contentType);

  let data1;
  if (contentType && contentType.includes('application/json')) {
    data1 = await response1.json();
  } else {
    data1 = await response1.text();
  }

  if (response1.ok) {
    console.log('\n✅ הצלחה! קיבלנו Bearer Token:\n');
    console.log(JSON.stringify(data1, null, 2));

    if (data1.token || data1.access_token || data1.bearer_token) {
      const token = data1.token || data1.access_token || data1.bearer_token;
      console.log('\n🎉 Bearer Token:');
      console.log(token);
      console.log('\n💡 עכשיו העתק את ה-token ל-.env:');
      console.log(`MEDICI_API_TOKEN=${token}`);
      process.exit(0);
    }
  } else {
    console.log('\n❌ שגיאה בנסיון 1:');
    console.log(data1);
  }
} catch (error) {
  console.error('❌ חריגה בנסיון 1:', error.message);
}

console.log('\n' + '='.repeat(70) + '\n');

// נסיון 2: Form-urlencoded
console.log('📤 נסיון 2: שליחת בקשה עם application/x-www-form-urlencoded\n');

try {
  const params = new URLSearchParams();
  params.append('client_secret', CLIENT_SECRET);

  const response2 = await fetch(TOKEN_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString()
  });

  console.log('📥 תגובה:', response2.status, response2.statusText);

  const contentType = response2.headers.get('content-type');
  console.log('Content-Type:', contentType);

  let data2;
  if (contentType && contentType.includes('application/json')) {
    data2 = await response2.json();
  } else {
    data2 = await response2.text();
  }

  if (response2.ok) {
    console.log('\n✅ הצלחה! קיבלנו Bearer Token:\n');
    console.log(JSON.stringify(data2, null, 2));

    if (data2.token || data2.access_token || data2.bearer_token) {
      const token = data2.token || data2.access_token || data2.bearer_token;
      console.log('\n🎉 Bearer Token:');
      console.log(token);
      console.log('\n💡 עכשיו העתק את ה-token ל-.env:');
      console.log(`MEDICI_API_TOKEN=${token}`);
      process.exit(0);
    }
  } else {
    console.log('\n❌ שגיאה בנסיון 2:');
    console.log(data2);
  }
} catch (error) {
  console.error('❌ חריגה בנסיון 2:', error.message);
}

console.log('\n' + '='.repeat(70) + '\n');

// נסיון 3: Multipart form-data
console.log('📤 נסיון 3: שליחת בקשה עם multipart/form-data\n');

try {
  const formData = new FormData();
  formData.append('client_secret', CLIENT_SECRET);

  const response3 = await fetch(TOKEN_API_URL, {
    method: 'POST',
    body: formData
  });

  console.log('📥 תגובה:', response3.status, response3.statusText);

  const contentType = response3.headers.get('content-type');
  console.log('Content-Type:', contentType);

  let data3;
  if (contentType && contentType.includes('application/json')) {
    data3 = await response3.json();
  } else {
    data3 = await response3.text();
  }

  if (response3.ok) {
    console.log('\n✅ הצלחה! קיבלנו Bearer Token:\n');
    console.log(JSON.stringify(data3, null, 2));

    if (data3.token || data3.access_token || data3.bearer_token) {
      const token = data3.token || data3.access_token || data3.bearer_token;
      console.log('\n🎉 Bearer Token:');
      console.log(token);
      console.log('\n💡 עכשיו העתק את ה-token ל-.env:');
      console.log(`MEDICI_API_TOKEN=${token}`);
      process.exit(0);
    }
  } else {
    console.log('\n❌ שגיאה בנסיון 3:');
    console.log(data3);
  }
} catch (error) {
  console.error('❌ חריגה בנסיון 3:', error.message);
}

console.log('\n' + '='.repeat(70));
console.log('\n❌ כל הנסיונות נכשלו!\n');
console.log('💡 פתרונות אפשריים:');
console.log('   1. בדוק שה-client_secret נכון');
console.log('   2. צור קשר עם Medici לקבל את ה-endpoint הנכון');
console.log('   3. השתמש ב-Bearer Token הקיים שכבר עובד:');
console.log('      eyJhbGciOiJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNobWFjLXNoYTI1NiIsInR5cCI6IkpXVCJ9...');
console.log('   4. ה-Token הקיים תקף עד 2035 - אין צורך להחליף!\n');
