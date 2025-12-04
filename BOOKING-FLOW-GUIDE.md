# מדריך תהליך ההזמנה המלא 🏨

תיעוד מפורט של כל שלבי ההזמנה במערכת Medici Hotels

---

## 📋 סקירה כללית

תהליך ההזמנה מורכב מ-**3 שלבים**:

```
1. Search (חיפוש) → 2. PreBook (אישור זמינות) → 3. Book (הזמנה סופית)
```

---

## 🔍 שלב 1: Search - חיפוש מלונות

### Endpoint
```
POST /api/hotels/GetInnstantSearchPrice
```

### Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_TOKEN"
}
```

### Request Body
```json
{
  "dateFrom": "2025-12-10",
  "dateTo": "2025-12-11",
  "city": "Tel Aviv",
  "pax": [{
    "adults": 2,
    "children": []
  }],
  "ShowExtendedData": true,
  "limit": 5
}
```

### Response (מקוצר)
```json
{
  "items": [{
    "code": "12915:standard:twin:RO:692fec3fe5c7d4.47273632$1003X1095n1095t",
    "items": [{
      "hotelName": "Sea Net",
      "hotelId": "12915",
      "name": "Standard Twin",
      "category": "standard",
      "bedding": "twin",
      "board": "RO",
      "pax": {
        "adults": 2,
        "children": []
      }
    }],
    "price": {
      "amount": 80.54,
      "currency": "USD"
    },
    "cancellation": {
      "type": "fully-refundable",
      "frames": [...]
    }
  }]
}
```

### מה לשמור מהתגובה:
✅ **code** - הקוד של ההצעה (נצטרך ל-PreBook)
✅ **hotelId** - מזהה המלון
✅ **price** - המחיר
✅ **items[0]** - פרטי החדר

---

## 📝 שלב 2: PreBook - אישור זמינות וקבלת Token

### Endpoint
```
POST /api/hotels/PreBook
```

### Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_TOKEN"
}
```

### Request Body
```json
{
  "jsonRequest": "{\"services\":[{\"searchCodes\":[{\"code\":\"12915:standard:twin:RO:692fec3fe5c7d4.47273632$1003X1095n1095t\",\"pax\":[{\"adults\":2,\"children\":[]}]}],\"searchRequest\":{\"currencies\":[\"USD\"],\"customerCountry\":\"IL\",\"dates\":{\"from\":\"2025-12-10\",\"to\":\"2025-12-11\"},\"destinations\":[{\"id\":12915,\"type\":\"hotel\"}],\"filters\":[{\"name\":\"payAtTheHotel\",\"value\":true},{\"name\":\"onRequest\",\"value\":false},{\"name\":\"showSpecialDeals\",\"value\":true}],\"pax\":[{\"adults\":2,\"children\":[]}],\"service\":\"hotels\"}}]}"
}
```

### ⚠️ פורמט Pax הנכון (CRITICAL!)

**חשוב מאוד:** `pax.adults` חייב להיות **מערך של אובייקטים** עם פרטי אורחים, לא מספר!

**WRONG** ❌:
```json
{"pax": [{"adults": 2, "children": []}]}
```

**CORRECT** ✅:
```json
{"pax": [{
  "adults": [
    {"age": 30, "name": "Guest1", "surname": "Traveler"},
    {"age": 30, "name": "Guest2", "surname": "Traveler"}
  ],
  "children": []
}]}
```

### Request Body (מפוענח לקריאות)
```javascript
{
  jsonRequest: JSON.stringify({
    services: [{
      code: "12915:standard:twin:RO:692fec3fe5c7d4.47273632$1003X1095n1095t", // מהשלב הקודם
      pax: [{
        adults: [
          {age: 30, name: "Guest1", surname: "Traveler"},
          {age: 30, name: "Guest2", surname: "Traveler"}
        ],
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
          id: 12915, // hotelId מהשלב הקודם
          type: "hotel"
        }],
        filters: [
          { name: "payAtTheHotel", value: true },
          { name: "onRequest", value: false },
          { name: "showSpecialDeals", value: true }
        ],
        pax: [{ adults: 2, children: [] }],
        service: "hotels"
      }
    }]
  })
}
```

### Response (חשוב!)
```json
{
  "content": {
    "services": {
      "hotels": [{
        "token": "eyJzdGF0dXMiOjIwMCw...",  // ← ה-TOKEN הזה חובה לשלב 3!
        "code": "12915:standard:twin:RO:...",
        "price": {
          "amount": 80.54,
          "currency": "USD"
        },
        "netPrice": {
          "amount": 80.54,
          "currency": "USD"
        },
        "cancellation": {
          "type": "fully-refundable",
          "frames": [...]
        },
        "items": [{
          "name": "Standard Twin",
          "category": "standard",
          "hotelId": "12915",
          "pax": {
            "adults": 2,
            "children": []
          }
        }]
      }]
    }
  }
}
```

### מה לשמור מהתגובה:
✅ **token** - ה-Token לשלב 3 (חובה!)
✅ **code** - הקוד המאושר
✅ **price** - המחיר הסופי המאושר

---

## ✅ שלב 3: Book - ביצוע הזמנה סופית

### Endpoint
```
POST /api/hotels/Book
```

### Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_TOKEN"
}
```

### Request Body
```json
{
  "jsonRequest": "{\"customer\":{\"title\":\"MR\",\"name\":{\"first\":\"John\",\"last\":\"Doe\"},\"birthDate\":\"1990-01-01\",\"contact\":{\"address\":\"123 Main St\",\"city\":\"Tel Aviv\",\"country\":\"IL\",\"email\":\"john@example.com\",\"phone\":\"+972501234567\",\"state\":\"IL\",\"zip\":\"12345\"}},\"paymentMethod\":{\"methodName\":\"account_credit\"},\"reference\":{\"agency\":\"AI Travel Agent Platform\",\"voucherEmail\":\"john@example.com\"},\"services\":[{\"bookingRequest\":[{\"code\":\"12915:standard:twin:RO:692fec3fe5c7d4.47273632$1003X1095n1095t\",\"pax\":[{\"adults\":[{\"lead\":true,\"title\":\"MR\",\"name\":{\"first\":\"John\",\"last\":\"Doe\"},\"contact\":{\"address\":\"123 Main St\",\"city\":\"Tel Aviv\",\"country\":\"IL\",\"email\":\"john@example.com\",\"phone\":\"+972501234567\",\"state\":\"IL\",\"zip\":\"12345\"}}],\"children\":[]}],\"token\":\"eyJzdGF0dXMiOjIwMCw...\"}],\"searchRequest\":{\"currencies\":[\"USD\"],\"customerCountry\":\"IL\",\"dates\":{\"from\":\"2025-12-10\",\"to\":\"2025-12-11\"},\"destinations\":[{\"id\":12915,\"type\":\"hotel\"}],\"filters\":[{\"name\":\"payAtTheHotel\",\"value\":true},{\"name\":\"onRequest\",\"value\":false},{\"name\":\"showSpecialDeals\",\"value\":true}],\"pax\":[{\"adults\":2,\"children\":[]}],\"service\":\"hotels\"}}]}"
}
```

### Request Body (מפוענח לקריאות)
```javascript
{
  jsonRequest: JSON.stringify({
    customer: {
      title: "MR",
      name: {
        first: "John",
        last: "Doe"
      },
      birthDate: "1990-01-01",
      contact: {
        address: "123 Main St",
        city: "Tel Aviv",
        country: "IL",
        email: "john@example.com",
        phone: "+972501234567",
        state: "IL",
        zip: "12345"
      }
    },
    paymentMethod: {
      methodName: "account_credit"  // תשלום דרך חשבון
    },
    reference: {
      agency: "AI Travel Agent Platform",
      voucherEmail: "john@example.com"
    },
    services: [{
      bookingRequest: [{
        code: "12915:standard:twin:RO:...",  // מהשלב הראשון
        pax: [{
          adults: [{
            lead: true,  // האורח הראשון = מוביל
            title: "MR",
            name: {
              first: "John",
              last: "Doe"
            },
            contact: {
              address: "123 Main St",
              city: "Tel Aviv",
              country: "IL",
              email: "john@example.com",
              phone: "+972501234567",
              state: "IL",
              zip: "12345"
            }
          }],
          children: []
        }],
        token: "eyJzdGF0dXMiOjIwMCw..."  // ← ה-TOKEN מהשלב הקודם!
      }],
      searchRequest: {
        currencies: ["USD"],
        customerCountry: "IL",
        dates: {
          from: "2025-12-10",
          to: "2025-12-11"
        },
        destinations: [{
          id: 12915,
          type: "hotel"
        }],
        filters: [
          { name: "payAtTheHotel", value: true },
          { name: "onRequest", value: false },
          { name: "showSpecialDeals", value: true }
        ],
        pax: [{ adults: 2, children: [] }],
        service: "hotels"
      }
    }]
  })
}
```

### Response
```json
{
  "BookingID": 12345,
  "Status": "Confirmed",
  "ConfirmationCode": "ABC123XYZ",
  "HotelConfirmationCode": "HOTEL-456",
  "TotalPrice": 80.54,
  "Currency": "USD"
}
```

---

## 🔧 קוד דוגמה מלא (JavaScript)

```javascript
// שלב 1: חיפוש
const searchResult = await fetch('https://medici-backend.azurewebsites.net/api/hotels/GetInnstantSearchPrice', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${BEARER_TOKEN}`
  },
  body: JSON.stringify({
    dateFrom: '2025-12-10',
    dateTo: '2025-12-11',
    city: 'Tel Aviv',
    pax: [{ adults: 2, children: [] }],
    ShowExtendedData: true
  })
});

const searchData = await searchResult.json();
const selectedOffer = searchData.items[0];

// שלב 2: PreBook
const preBookResult = await fetch('https://medici-backend.azurewebsites.net/api/hotels/PreBook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${BEARER_TOKEN}`
  },
  body: JSON.stringify({
    jsonRequest: JSON.stringify({
      services: [{
        searchCodes: [{
          code: selectedOffer.code,
          pax: [{ adults: 2, children: [] }]
        }],
        searchRequest: {
          currencies: ['USD'],
          customerCountry: 'IL',
          dates: {
            from: '2025-12-10',
            to: '2025-12-11'
          },
          destinations: [{
            id: parseInt(selectedOffer.items[0].hotelId),
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
  })
});

const preBookData = await preBookResult.json();
const bookingToken = preBookData.content.services.hotels[0].token;

// שלב 3: Book
const bookResult = await fetch('https://medici-backend.azurewebsites.net/api/hotels/Book', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${BEARER_TOKEN}`
  },
  body: JSON.stringify({
    jsonRequest: JSON.stringify({
      customer: {
        title: 'MR',
        name: { first: 'John', last: 'Doe' },
        birthDate: '1990-01-01',
        contact: {
          address: '123 Main St',
          city: 'Tel Aviv',
          country: 'IL',
          email: 'john@example.com',
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
        voucherEmail: 'john@example.com'
      },
      services: [{
        bookingRequest: [{
          code: selectedOffer.code,
          pax: [{
            adults: [{
              lead: true,
              title: 'MR',
              name: { first: 'John', last: 'Doe' },
              contact: {
                address: '123 Main St',
                city: 'Tel Aviv',
                country: 'IL',
                email: 'john@example.com',
                phone: '+972501234567',
                state: 'IL',
                zip: '12345'
              }
            }],
            children: []
          }],
          token: bookingToken // ← מהשלב הקודם!
        }],
        searchRequest: {
          currencies: ['USD'],
          customerCountry: 'IL',
          dates: {
            from: '2025-12-10',
            to: '2025-12-11'
          },
          destinations: [{
            id: parseInt(selectedOffer.items[0].hotelId),
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
  })
});

const bookData = await bookResult.json();
console.log('הזמנה הושלמה!', bookData);
```

---

## ⚠️ נקודות חשובות

### 1. Token מ-PreBook חובה!
אי אפשר לעשות Book ללא ה-token מ-PreBook. ה-token תקף לזמן מוגבל.

### 2. פורמט ה-jsonRequest
שים לב ש-PreBook ו-Book מצפים ל-`jsonRequest` שהוא **string של JSON**, לא אובייקט!

```javascript
// ✅ נכון
{ jsonRequest: JSON.stringify({ ... }) }

// ❌ לא נכון
{ ... }
```

### 3. Code חייב להיות זהה
ה-`code` חייב להיות **אותו קוד בדיוק** בכל 3 השלבים.

### 4. pax צריך להיות עקבי
מבנה ה-`pax` צריך להיות זהה בכל השלבים.

---

## 🐛 בעיות נפוצות ופתרונות

### PreBook מחזיר שגיאה
- ✅ בדוק שה-code נכון
- ✅ בדוק שה-hotelId הוא מספר (parseInt)
- ✅ בדוק שהתאריכים תקפים ובפורמט YYYY-MM-DD
- ✅ בדוק שה-jsonRequest הוא string ולא object

### Book מחזיר שגיאה
- ✅ בדוק שיש token מ-PreBook
- ✅ בדוק שה-token לא פג (תקף לזמן מוגבל)
- ✅ בדוק שכל הפרטי לקוח מלאים
- ✅ בדוק שה-email תקף

### "Invalid code" error
- ✅ ה-code השתנה או פג
- ✅ צריך לעשות Search מחדש

---

## 📊 סיכום זרימה

```
User Input
    ↓
[Search] חיפוש מלונות
    ↓ (code, hotelId, price)
User selects room
    ↓
[PreBook] אישור זמינות
    ↓ (token)
User provides details
    ↓
[Book] הזמנה סופית
    ↓
Confirmation!
```

---

## ✅ Checklist לבדיקה

- [ ] Search עובד ומחזיר results
- [ ] שמרתי את ה-code ו-hotelId
- [ ] PreBook עובד ומחזיר token
- [ ] Token נשמר ונשלח ל-Book
- [ ] פרטי לקוח מלאים ותקינים
- [ ] Book מחזיר confirmation

---

זהו! עכשיו יש לך מדריך מלא לתהליך ההזמנה 🎉
