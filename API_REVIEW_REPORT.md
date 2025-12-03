# סקירת קריאות API - AI Travel Agent Platform

## תאריך: 2025-12-03

---

## 🔴 בעיות קריטיות שצריכות תיקון מיידי

### 1. **אי-התאמה בין Tool Definition לקריאת API** (chatRouter.ts)
**קובץ:** `server/chatRouter.ts:311-321`

**הבעיה:**
```typescript
// Tool Definition (line 46):
hotelName: {
  type: "string",
  description: "Name of the hotel to search (e.g., 'Dizengoff Inn')",
}

// API Call (line 315):
city: functionArgs.city || functionArgs.destination || '',
```

- ה-Tool מבקש `hotelName` אבל הקוד משתמש ב-`city` ו-`destination` שלא מוגדרים
- זה יגרום לכך שכל חיפוש מלון יישלח עם `city: ''` ריק!
- ה-Medici API דורש `city` או מיקום אחר, לא שם מלון

**תיקון נדרש:**
```typescript
// Option 1: Change tool to use 'city' instead of 'hotelName'
city: {
  type: "string",
  description: "City to search for hotels (e.g., 'Tel Aviv', 'Jerusalem')",
}

// Option 2: OR use hotelName correctly
city: functionArgs.hotelName,
```

---

### 2. **חוסר פרמטר hotelName בכלי book_room** (chatRouter.ts:388)
**קובץ:** `server/chatRouter.ts:106-189, 388`

**הבעיה:**
```typescript
// line 388 - trying to use hotelName
hotelName: functionArgs.hotelName || "Unknown",

// But book_room tool (lines 106-189) doesn't have hotelName parameter!
```

**תיקון נדרש:**
הוסף `hotelName` לפרמטרים של `book_room` tool:
```typescript
hotelName: {
  type: "string",
  description: "Hotel name for booking record",
}
```

---

### 3. **URL כתובת API קשיחה בקוד** (mediciApi.ts:6)
**קובץ:** `server/mediciApi.ts:6`

**הבעיה:**
```typescript
const MEDICI_API_BASE_URL = "https://medici-backend.azurewebsites.net/api/hotels";
```

- כתובת API מוקשחת בקוד
- לא ניתן לשנות ל-staging/dev/production

**תיקון נדרש:**
```typescript
const MEDICI_API_BASE_URL = process.env.MEDICI_API_BASE_URL ||
  "https://medici-backend.azurewebsites.net/api/hotels";
```

---

### 4. **אין Timeout לבקשות API**
**קבצים:** `mediciApi.ts:25`, `llm.ts:315`

**הבעיה:**
- אין timeout מוגדר ל-fetch requests
- בקשה תקועה יכולה לחכות לנצח
- גורם ל-poor user experience

**תיקון נדרש:**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 sec

const response = await fetch(url, {
  ...options,
  signal: controller.signal,
});

clearTimeout(timeoutId);
```

---

### 5. **הודעת שגיאה שגויה** (llm.ts:219)
**קובץ:** `server/_core/llm.ts:218-220`

**הבעיה:**
```typescript
if (!ENV.forgeApiKey) {
  throw new Error("OPENAI_API_KEY is not configured");  // ❌ Wrong name!
}
```

- ההודעה אומרת "OPENAI_API_KEY"
- אבל המשתנה האמיתי הוא `BUILT_IN_FORGE_API_KEY`

**תיקון:**
```typescript
throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
```

---

## ⚠️ בעיות אבטחה (Security Issues)

### 1. **אין אימות משתמש בנקודות קצה ציבוריות**
**קובץ:** `server/chatRouter.ts:191-480`

**הבעיה:**
- כל הנקודות משתמשות ב-`publicProcedure`
- כל אחד יכול לשלוח הודעות ולבצע הזמנות
- אין rate limiting על הודעות

**תיקון נדרש:**
```typescript
// Add authentication
.input(z.object({
  conversationId: z.number(),
  message: z.string().max(5000), // Limit message length
}))
// Add rate limiting middleware
```

---

### 2. **חשיפת מידע רגיש בשגיאות**
**קובץ:** `mediciApi.ts:34-37`, `llm.ts:324-328`

**הבעיה:**
```typescript
const errorText = await response.text();
throw new Error(`Medici API error: ${response.status} - ${errorText}`);
```

- שגיאות API חיצוני נחשפות ישירות למשתמש
- עלול לחשוף מידע רגיש על מבנה המערכת

**תיקון:**
```typescript
console.error(`Medici API error: ${response.status} - ${errorText}`);
throw new Error(`Hotel search failed. Please try again later.`);
```

---

### 3. **אין ולידציה של קלט משתמש**
**קבצים:** `chatRouter.ts:231-234`, `mediciApi.ts:222-241`

**הבעיה:**
- תאריכים לא עוברים ולידציה
- מספר אנשים לא מוגבל
- שמות עיר/מלון לא מסוננים מפני SQL injection או XSS

**תיקון נדרש:**
```typescript
// Validate dates
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
if (!dateRegex.test(dateFrom) || !dateRegex.test(dateTo)) {
  throw new Error("Invalid date format");
}

// Validate dates are in future
const checkIn = new Date(dateFrom);
if (checkIn < new Date()) {
  throw new Error("Check-in date must be in the future");
}

// Validate adults count
if (adults < 1 || adults > 10) {
  throw new Error("Adults must be between 1-10");
}

// Sanitize city name
const sanitizedCity = city.replace(/[^\w\s-]/g, '').trim();
```

---

### 4. **Client Secret בגוף הבקשה**
**קובץ:** `mediciApi.ts:225-234`

**הבעיה:**
```typescript
const requestWithSecret = {
  ...request,
  client_secret: clientSecret  // Secret in request body
};
```

- הסוד נשלח בגוף הבקשה (לא בheader)
- עלול להישמר בלוגים
- עלול להיחשף בניטור network

**המלצה:**
בדוק אם ה-Medici API תומך ב-header authentication במקום body

---

## 🐛 באגים ובעיות לוגיקה

### 1. **totalPrice לא מתעדכן מתשובת API**
**קובץ:** `chatRouter.ts:384-396`

**הבעיה:**
```typescript
await db.createBooking({
  // ...
  totalPrice: 0, // ❌ Always 0!
  currency: "USD",
  status: "confirmed",
  bookingData: bookResult as Record<string, unknown>,
});
```

**תיקון:**
```typescript
// Extract price from bookResult
const totalPrice = bookResult.content?.services?.hotels?.[0]?.price?.amount || 0;
const currency = bookResult.content?.services?.hotels?.[0]?.price?.currency || "USD";

await db.createBooking({
  // ...
  totalPrice,
  currency,
  // ...
});
```

---

### 2. **הנחות מגדר קשיחות**
**קובץ:** `chatRouter.ts:348, 363-364`

**הבעיה:**
```typescript
title: "MR",  // Always MR!
firstName: i === 0 ? functionArgs.customerFirstName : `Guest${i + 1}`,
```

- כל האורחים מוגדרים כ-"MR"
- שמות אורחים נוספים: "Guest2", "Guest3" - לא מקצועי

**תיקון:**
הוסף פרמטר `customerTitle` לכלי, או בקש מידע נוסף על אורחים

---

### 3. **State מוגדר כמו Country**
**קובץ:** `chatRouter.ts:356`

**הבעיה:**
```typescript
state: functionArgs.customerCountry,  // Should be customerState!
```

**תיקון:**
```typescript
state: functionArgs.customerState || "",
```

---

### 4. **מגבלת הודעות היסטוריה**
**קובץ:** `chatRouter.ts:284`

**הבעיה:**
```typescript
...messageHistory.slice(-10)  // Only last 10 messages
```

- בשיחה ארוכה, הקשר יאבד
- הזמנה שהתחילה לפני 10 הודעות תישכח

**המלצה:**
```typescript
// Keep last 20 messages, or use token-based truncation
...messageHistory.slice(-20)

// OR implement smart context window management
```

---

### 5. **תוצאות חיפוש מוגבלות ל-5 ללא הודעה**
**קובץ:** `chatRouter.ts:325`

**הבעיה:**
```typescript
data: searchResult.items?.slice(0, 5) || [], // Silently limits to 5
```

**תיקון:**
הוסף הודעה לכלי:
```typescript
data: {
  items: searchResult.items?.slice(0, 5) || [],
  total: searchResult.items?.length || 0,
  showing: Math.min(5, searchResult.items?.length || 0),
}
```

---

## 📊 בעיות Best Practices

### 1. **מודל LLM קשיח בקוד**
**קובץ:** `llm.ts:283`

```typescript
model: "gemini-2.5-flash",  // Hardcoded
```

**תיקון:**
```typescript
model: ENV.llmModel || "gemini-2.5-flash",
```

---

### 2. **טיפוסים רופפים**
**קובץ:** `mediciApi.ts:48-49`

```typescript
adults: string | number;  // Inconsistent type
children: any[];          // Too loose
```

**תיקון:**
```typescript
adults: number;
children: Array<{ age: number }>;
```

---

### 3. **אין Retry Logic לבקשות שנכשלו**
**כל קבצי API**

**המלצה:**
```typescript
async function fetchWithRetry(url: string, options: any, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;

      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status}`);
      }
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
```

---

### 4. **אין Logging מסודר**
**כל הקבצים**

**המלצה:**
```typescript
// Add structured logging
import { logger } from './logger';

logger.info('Medici API Request', {
  endpoint: 'GetInnstantSearchPrice',
  city: request.city,
  dateFrom: request.dateFrom,
  dateTo: request.dateTo,
});

logger.error('Medici API Error', {
  endpoint: 'GetInnstantSearchPrice',
  statusCode: response.status,
  error: errorText,
});
```

---

### 5. **אין Rate Limiting**

**המלצה:**
הוסף rate limiting middleware:
```typescript
import rateLimit from 'express-rate-limit';

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many messages, please try again later.'
});
```

---

## 🔧 המלצות לשיפור

### 1. **Environment Variables חסרים**
הוסף למשתנה הסביבה:
```bash
MEDICI_API_BASE_URL=https://medici-backend.azurewebsites.net/api/hotels
MEDICI_REQUEST_TIMEOUT=30000
LLM_MODEL=gemini-2.5-flash
LLM_MAX_TOKENS=32768
MAX_MESSAGE_LENGTH=5000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

### 2. **API Response Caching**
הוסף caching לחיפושי מלונות:
```typescript
import { Redis } from 'ioredis';
const redis = new Redis();

// Cache search results for 5 minutes
const cacheKey = `search:${city}:${dateFrom}:${dateTo}:${adults}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// ... make API call ...
await redis.setex(cacheKey, 300, JSON.stringify(result));
```

---

### 3. **Transaction Management**
עטוף פעולות DB בטרנזקציות:
```typescript
// When creating booking
await db.transaction(async (trx) => {
  await db.createMessage({ ... }, trx);
  await db.createBooking({ ... }, trx);
});
```

---

### 4. **Input Validation Schema**
השתמש ב-Zod לולידציה:
```typescript
const SearchHotelSchema = z.object({
  city: z.string().min(2).max(100).regex(/^[a-zA-Z\s-]+$/),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().int().min(1).max(10),
  children: z.array(z.number().int().min(0).max(17)).max(5),
}).refine(data => {
  const checkIn = new Date(data.dateFrom);
  const checkOut = new Date(data.dateTo);
  return checkOut > checkIn;
}, "Check-out must be after check-in");
```

---

### 5. **API Client Class**
צור API client class מסודר:
```typescript
class MediciApiClient {
  private baseUrl: string;
  private apiToken: string;
  private timeout: number;

  constructor() {
    this.baseUrl = process.env.MEDICI_API_BASE_URL!;
    this.apiToken = process.env.MEDICI_API_TOKEN!;
    this.timeout = parseInt(process.env.MEDICI_REQUEST_TIMEOUT || '30000');
  }

  async searchHotels(params: SearchParams): Promise<SearchResponse> {
    // Validate input
    SearchHotelSchema.parse(params);

    // Make request with timeout and retry
    return this.makeRequest('GetInnstantSearchPrice', params);
  }

  private async makeRequest<T>(endpoint: string, body: any): Promise<T> {
    // Implement timeout, retry, logging
  }
}
```

---

## 📋 סיכום ראשונות

| רמת חומרה | מספר בעיות | דוגמאות |
|-----------|-------------|----------|
| 🔴 קריטי | 5 | אי-התאמת tool/API, URL קשיח, אין timeout |
| ⚠️ אבטחה | 4 | אין authentication, חשיפת errors, אין validation |
| 🐛 באגים | 5 | totalPrice=0, title=MR, state=country |
| 📊 Best Practices | 5 | מודל קשיח, טיפוסים רופפים, אין retry |

---

## ✅ צעדים הבאים מומלצים

### קדימות גבוהה (יש לתקן מיד):
1. ✅ תקן אי-התאמה של `hotelName` vs `city` בכלי search
2. ✅ הוסף `hotelName` לכלי book_room
3. ✅ תקן הודעת שגיאה של OPENAI_API_KEY
4. ✅ הוסף timeout לכל בקשות API
5. ✅ העבר MEDICI_API_BASE_URL למשתנה סביבה

### קדימות בינונית:
6. הוסף input validation עם Zod
7. הוסף retry logic
8. תקן את totalPrice להיות מתשובת API
9. הסר הנחות מגדר קשיחות
10. הוסף rate limiting

### קדימות נמוכה (שיפורים):
11. הוסף structured logging
12. הוסף API response caching
13. צור API client class
14. הוסף transaction management
15. הוסף monitoring ו-alerts

---

**נוצר על ידי:** Claude Code
**תאריך:** 2025-12-03
