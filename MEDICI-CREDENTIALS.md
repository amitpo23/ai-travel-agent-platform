# מדריך Medici Hotels Credentials

## 🔑 סוגי ה-Credentials

יש לך **3 סוגים של credentials** מ-Medici:

### 1️⃣ Bearer Token (JWT)
```
eyJhbGciOiJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNobWFjLXNoYTI1NiIsInR5cCI6IkpXVCJ9...
```

**שימוש:** נשלח בכותרת `Authorization` של כל בקשת API

**איפה:**
- GetInnstantSearchPrice
- PreBook
- Book
- CancelRoomDirectJson

**תוקף:** עד 18/07/2035 (עוד 10 שנים!)

**דוגמה:**
```bash
curl -H "Authorization: Bearer eyJhbGc..." \
  https://medici-backend.azurewebsites.net/api/hotels/GetInnstantSearchPrice
```

---

### 2️⃣ Client Secret
```
zlbgGGxz~|l3.Q?XXAT)uT!Lty,kJC>R?`:k?oQH$I=P7rL<R:Em:qDaM1G(jFU7
```

**שימוש:** נשלח ב-**body** של בקשות מסוימות

**איפה:**
- GetInnstantSearchPrice (בbody, לא בheader!)
- אולי גם בקריאה לקבלת Bearer Token חדש

**דוגמה:**
```json
{
  "dateFrom": "2025-03-15",
  "dateTo": "2025-03-16",
  "city": "Dubai",
  "pax": [{"adults": 2, "children": []}],
  "client_secret": "zlbgGGxz~|l3.Q?XXAT)uT!Lty,kJC>R?`:k?oQH$I=P7rL<R:Em:qDaM1G(jFU7"
}
```

---

### 3️⃣ Token (Bcrypt Hash)
```
$2y$10$QcGPkHG9Rk1VRTClz0HIsO3qQpm3JEU84QqfZadIVIoVHn5M7Tpnu
```

**מה זה:** Hash של סיסמה (Bcrypt format)

**שימוש אפשרי:**
- אולי נדרש כדי לקבל Bearer Token חדש
- אולי credential עזר לאימות B2B

**לא ברור בדיוק איפה להשתמש בזה** - צריך לברר עם Medici

---

### 4️⃣ Key (Bcrypt Hash)
```
$2y$10$zmUK0OGNeeTtiGcV/cpWsOrZY7VXbt0Bzp16VwPPQ8z46DNV6esum
```

**מה זה:** עוד Hash (Bcrypt format)

**שימוש אפשרי:**
- אולי נדרש ביחד עם ה-token
- אולי מפתח API נוסף

**לא ברור בדיוק** - צריך לברר עם Medici

---

## 📋 איך להשתמש ב-Credentials

### למה שצריך עכשיו (GetInnstantSearchPrice):

```javascript
// בקשה לחיפוש מלונות
await fetch('https://medici-backend.azurewebsites.net/api/hotels/GetInnstantSearchPrice', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${MEDICI_API_TOKEN}`  // ← Bearer Token בheader
  },
  body: JSON.stringify({
    dateFrom: '2025-03-15',
    dateTo: '2025-03-16',
    city: 'Dubai',
    pax: [{ adults: 2, children: [] }],
    client_secret: MEDICI_CLIENT_SECRET,  // ← Client Secret בbody
    ShowExtendedData: true
  })
});
```

---

## 🔄 איך לקבל Bearer Token חדש

### אופציה 1: דרך הסקריפטים
```bash
# נסיון בסיסי
node get-bearer-token.mjs

# נסיון מתקדם (מנסה כל קומבינציה אפשרית)
node get-bearer-token-advanced.mjs
```

### אופציה 2: דרך Medici Admin Panel
1. גש ל: https://admin.medicihotels.com/
2. התחבר עם המשתמש שלך
3. לך ל: Settings → API Keys
4. צור Token חדש או העתק את הקיים

### אופציה 3: צור קשר עם Medici Support
שאל אותם:
- מה ה-endpoint הנכון לקבלת Bearer Token?
- איזה credentials צריך לשלוח (token + key + client_secret)?
- מה הפורמט הנכון של הבקשה?

---

## 📁 היכן לשמור

### קובץ `.env`:
```bash
# Bearer Token - לכל בקשות ה-API
MEDICI_API_TOKEN=eyJhbGciOiJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNobWFjLXNoYTI1NiIsInR5cCI6IkpXVCJ9.eyJQZXJtaXNzaW9ucyI6IjEiLCJVc2VySWQiOiIyNCIsIm5iZiI6MTc1MjQ3NTYwNCwiZXhwIjoyMDY4MDA4NDA0LCJpc3MiOiJodHRwczovL2FkbWluLm1lZGljaWhvdGVscy5jb20vIiwiYXVkIjoiaHR0cHM6Ly9hZG1pbi5tZWRpY2lob3RlbHMuY29tLyJ9.eA8EeHx6gGRtGBts4yXAWnK5P0Wl_LQLD1LKobYBV4U

# Client Secret - נשלח בbody של בקשות
MEDICI_CLIENT_SECRET=zlbgGGxz~|l3.Q?XXAT)uT!Lty,kJC>R?`:k?oQH$I=P7rL<R:Em:qDaM1G(jFU7

# Token + Key - לא בטוח איפה להשתמש
MEDICI_B2B_TOKEN=$2y$10$QcGPkHG9Rk1VRTClz0HIsO3qQpm3JEU84QqfZadIVIoVHn5M7Tpnu
MEDICI_B2B_KEY=$2y$10$zmUK0OGNeeTtiGcV/cpWsOrZY7VXbt0Bzp16VwPPQ8z46DNV6esum

# שאר ההגדרות
OPENAI_API_KEY=sk-...
DATABASE_URL=mysql://...
```

---

## ⚠️ אבטחה

**אל תשתף אף אחד מה-credentials האלה!**

- ❌ לא במיילים
- ❌ לא בצ'אטים
- ❌ לא בקוד (רק ב-.env)
- ❌ לא ב-git
- ✅ רק בקובץ `.env` שלא מתעלה

---

## 🧪 בדיקה

בדוק שהכל עובד:
```bash
# בדוק הגדרות
pnpm check-config

# בדוק חיבור ל-API
node test-instant-search.mjs

# נסה לקבל Bearer Token חדש
node get-bearer-token-advanced.mjs
```

---

## ❓ שאלות נפוצות

**Q: למה צריך גם Bearer Token וגם Client Secret?**
A: Bearer Token = מזהה אותך (authentication)
   Client Secret = אימות נוסף לבקשות רגישות (authorization)

**Q: מתי ה-Bearer Token מתפוגג?**
A: שלך תקף עד 18/07/2035 - עוד 10 שנים! לא צריך לחדש עכשיו.

**Q: מה עושים אם ה-Bearer Token פג?**
A: הרץ את `get-bearer-token-advanced.mjs` או צור קשר עם Medici Support.

**Q: למה יש גם token וגם key (bcrypt)?**
A: לא ברור - צריך לשאול את Medici. אולי לקבלת Bearer Token חדש.

**Q: האם אפשר לשתף את ה-credentials עם צוות?**
A: רק דרך ערוץ מאובטח (1Password, LastPass, וכו'). לא במייל/צ'אט!
