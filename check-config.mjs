#!/usr/bin/env node
/**
 * סקריפט לבדיקת הגדרות המערכת
 * להריץ עם: node check-config.mjs
 */

import 'dotenv/config';

console.log('🔍 בודק הגדרות מערכת...\n');
console.log('='.repeat(60));

// בדיקת משתני סביבה
const requiredEnvVars = {
  'MEDICI_API_TOKEN': 'Bearer token לאימות מול Medici API (בheader בלבד)',
  'OPENAI_API_KEY': 'מפתח API של OpenAI',
  'DATABASE_URL': 'כתובת התחברות למסד נתונים',
};

// NOTE: MEDICI_CLIENT_SECRET is NOT needed for GetInnstantSearchPrice
// Only the Bearer Token (MEDICI_API_TOKEN) is required in the Authorization header

console.log('\n📋 בדיקת משתני סביבה:\n');

let allGood = true;
for (const [key, description] of Object.entries(requiredEnvVars)) {
  const value = process.env[key];
  const exists = !!value;
  const icon = exists ? '✅' : '❌';

  console.log(`${icon} ${key}`);
  console.log(`   תיאור: ${description}`);

  if (exists) {
    // הצג רק את ה-10 תווים הראשונים
    const preview = value.substring(0, 30) + '...';
    console.log(`   ערך: ${preview}`);
  } else {
    console.log(`   ⚠️  חסר! הוסף למשתנה זה לקובץ .env`);
    allGood = false;
  }
  console.log('');
}

console.log('='.repeat(60));

if (allGood) {
  console.log('\n✅ כל משתני הסביבה מוגדרים!\n');

  // נסיון לבדוק את ה-API
  console.log('🔍 בודק חיבור ל-Medici API...\n');

  // Using official Medici API format
  // NOTE: client_secret is NOT needed and causes errors! Only Bearer Token is required.
  const testRequest = {
    dateFrom: '2025-12-10',
    dateTo: '2025-12-11',
    city: 'Tel Aviv',  // Using Tel Aviv as it has more availability
    pax: [{
      adults: 2,
      children: []
    }],
    limit: 2,
    ShowExtendedData: true  // Returns images, descriptions, facilities
  };

  console.log('📤 שולח בקשת טסט:');
  console.log(JSON.stringify(testRequest, null, 2));
  console.log('');

  try {
    const response = await fetch('https://medici-backend.azurewebsites.net/api/hotels/GetInnstantSearchPrice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MEDICI_API_TOKEN}`
      },
      body: JSON.stringify(testRequest)
    });

    console.log(`📥 תגובה: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`\n✅ הצלחה! קיבלנו ${data.items?.length || 0} תוצאות`);

      if (data.items && data.items.length > 0) {
        console.log('\n📊 דוגמה לתוצאה ראשונה:');
        const first = data.items[0];
        console.log(`   - שם מלון: ${first.hotelName || 'N/A'}`);
        console.log(`   - מחיר: ${first.price?.amount || 'N/A'} ${first.price?.currency || ''}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`\n❌ שגיאה מה-API:`);
      console.log(errorText);
    }
  } catch (error) {
    console.log(`\n❌ שגיאת רשת:`, error.message);
  }
} else {
  console.log('\n❌ חסרים משתני סביבה!\n');
  console.log('💡 פתרון:');
  console.log('   1. צור קובץ .env בשורש הפרויקט');
  console.log('   2. העתק את התוכן מ-.env.example');
  console.log('   3. מלא את הערכים החסרים');
  console.log('   4. הרץ שוב: node check-config.mjs\n');
}

console.log('='.repeat(60));
