# מדריך דיבוג - איך לראות את הלוגים

## 1️⃣ בדיקה ראשונית - האם ההגדרות תקינות?

הרץ את הסקריפט הזה כדי לבדוק שכל ההגדרות במקום:

```bash
node check-config.mjs
```

הסקריפט יבדוק:
- ✅ האם כל משתני הסביבה מוגדרים
- ✅ האם יש חיבור ל-Medici API
- ✅ האם ה-Bearer token תקף
- ✅ האם ה-client_secret עובד

**אם הסקריפט נכשל** - תקן את הבעיות שהוא מציג ואז המשך לשלב הבא.

---

## 2️⃣ הרצת השרת עם לוגים מלאים

### אופציה א': הרצה רגילה (מומלץ)

```bash
pnpm dev
```

זה יריץ את השרת ב-development mode עם כל הלוגים.

### אופציה ב': הרצה עם פלט מפורט יותר

```bash
NODE_ENV=development DEBUG=* pnpm dev
```

---

## 3️⃣ איך לראות את הלוגים בזמן אמת

### צעד 1: פתח טרמינל והרץ את השרת

```bash
pnpm dev
```

תראה משהו כזה:
```
Server running on http://localhost:3000/
```

### צעד 2: השאר את הטרמינל הזה פתוח!

**חשוב:** אל תסגור את הטרמינל הזה - כאן תראה את כל הלוגים!

### צעד 3: פתח דפדפן וגש לצ'אט

פתח דפדפן וגש ל:
```
http://localhost:3000
```

### צעד 4: נסה לחפש מלון

בצ'אט, כתוב משהו כמו:
```
אני רוצה לחפש מלון בדובאי ל-15-16 במרץ ל-2 מבוגרים
```

### צעד 5: חזור לטרמינל וראה את הלוגים!

אתה אמור לראות לוגים כאלה:

#### ✅ אם הכל עובד:
```
[Chat] Searching hotels with params: {
  city: 'Dubai',
  dateFrom: '2025-03-15',
  dateTo: '2025-03-16',
  adults: 2,
  children: [],
  limit: 5
}
[MediciAPI] Making POST request to https://medici-backend.azurewebsites.net/api/hotels/GetInnstantSearchPrice
[MediciAPI] SearchHotelPrice request: {
  dateFrom: '2025-03-15',
  dateTo: '2025-03-16',
  city: 'Dubai',
  adults: 2,
  paxChildren: [],
  limit: 5,
  ShowExtendedData: true,
  client_secret: '***HIDDEN***'
}
[MediciAPI] Response status: 200 OK
[MediciAPI] SearchHotelPrice response: { itemsCount: 15, hasItems: true }
[Chat] Search result: { itemsCount: 15, hasItems: true }
```

#### ❌ אם יש שגיאה - תראה משהו כזה:
```
[Chat] Searching hotels with params: { city: 'Dubai', ... }
[MediciAPI] Making POST request to ...
[MediciAPI] Response status: 401 Unauthorized
[MediciAPI] Error response: Invalid token
[Chat] Tool search_hotels error: Error: Medici API error: 401 - Invalid token
[Chat] Tool search_hotels full error details: {
  message: 'Medici API error: 401 - Invalid token',
  stack: '...',
  functionArgs: { city: 'Dubai', ... }
}
```

---

## 4️⃣ פענוח שגיאות נפוצות

### שגיאה: `MEDICI_API_TOKEN environment variable is not set`
**פתרון:** צור קובץ `.env` עם:
```bash
MEDICI_API_TOKEN=eyJhbGc...
MEDICI_CLIENT_SECRET=zlbgGGxz...
```

### שגיאה: `401 Unauthorized`
**פתרון:** ה-Bearer token לא תקף. בדוק שהעתקת את כל ה-token (הוא ארוך מאוד!)

### שגיאה: `city: ''` (מחרוזת ריקה)
**פתרון:** הסוכן לא קיבל את העיר מהמשתמש. וודא שכתבת עיר בבקשה.

### לא רואה בכלל לוגים של `[MediciAPI]`
**פתרון:** השרת לא רץ, או שה-tool לא מופעל. וודא ש:
1. השרת רץ (`pnpm dev`)
2. כתבת בקשה שכוללת חיפוש מלון

---

## 5️⃣ טיפים לדיבוג מתקדם

### צילום מסך של הלוגים
אם אתה רוצה לשמור את הלוגים:
```bash
pnpm dev 2>&1 | tee server-logs.txt
```

זה ישמור את כל הפלט גם לקובץ `server-logs.txt`.

### סינון רק לוגים רלוונטיים
אם יש יותר מדי לוגים:
```bash
pnpm dev 2>&1 | grep -E "\[Chat\]|\[MediciAPI\]"
```

זה יראה רק לוגים של Chat ו-MediciAPI.

### בדיקה ידנית של ה-API
אם אתה רוצה לבדוק את ה-API ישירות בלי השרת:
```bash
node test-with-secret.mjs
```

---

## 6️⃣ מה לעשות אם אתה תקוע?

1. **הרץ:** `node check-config.mjs` - ראה אם ההגדרות תקינות
2. **העתק את הלוגים** מהטרמינל (כל הפלט)
3. **שתף אותי** - אשלח לך את הלוגים ואני אעזור למצוא את הבעיה

---

## דוגמה מלאה - פלט מוצלח

```bash
$ pnpm dev

Server running on http://localhost:3000/

# --- כאן אתה פותח דפדפן וכותב בקשה בצ'אט ---

[Chat] Searching hotels with params: {
  city: 'Dubai',
  dateFrom: '2025-03-15',
  dateTo: '2025-03-16',
  adults: 2,
  children: [],
  limit: 5
}
[MediciAPI] Making POST request to https://medici-backend.azurewebsites.net/api/hotels/GetInnstantSearchPrice
[MediciAPI] SearchHotelPrice request: {
  dateFrom: '2025-03-15',
  dateTo: '2025-03-16',
  city: 'Dubai',
  adults: 2,
  paxChildren: [],
  limit: 5,
  ShowExtendedData: true,
  client_secret: '***HIDDEN***'
}
[MediciAPI] Response status: 200 OK
[MediciAPI] SearchHotelPrice response: { itemsCount: 15, hasItems: true }
[Chat] Search result: { itemsCount: 15, hasItems: true }

# --- הצלחה! 15 מלונות נמצאו ---
```
