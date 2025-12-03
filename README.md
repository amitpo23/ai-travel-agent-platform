# AI Travel Agent Platform

פלטפורמה לניהול סוכני נסיעות מבוססי AI עם אינטגרציה ל-Medici Hotels API.

## Setup

### 1. התקנת Dependencies

```bash
pnpm install
```

### 2. הגדרת Environment Variables

צור קובץ `.env` בשורש הפרויקט עם המשתנים הבאים (ראה `.env.example`):

```bash
# Database
DATABASE_URL=mysql://user:password@localhost:3306/ai_travel_agent

# Medici Hotels API - קבל את הנתונים האלה ממערכת Medici Hotels
MEDICI_API_TOKEN=eyJhbGciOiJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNobWFjLXNoYTI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI API
OPENAI_API_KEY=sk-...

# Server
PORT=3000
NODE_ENV=development
JWT_SECRET=your_random_secret_key_here
```

**חשוב:** חובה להגדיר `MEDICI_API_TOKEN` (Bearer Token) - זה המזהה היחיד הנדרש לחיפוש מלונות!

**💡 צריך Bearer Token חדש?** ראה [מדריך Credentials](MEDICI-CREDENTIALS.md) או הרץ:
```bash
pnpm get-token
```

### 3. הרצת Database Migrations

```bash
pnpm db:push
```

### 4. הרצת השרת

**Development mode:**
```bash
pnpm dev
```

**Production mode:**
```bash
pnpm build
pnpm start
```

## תיעוד API

### Medici Hotels API Integration

המערכת משתמשת ב-Medici Hotels API לחיפוש והזמנת חדרים:

- **GetInnstantSearchPrice** - חיפוש מלונות ומחירים
- **PreBook** - אישור זמינות לפני הזמנה
- **Book** - ביצוע הזמנה
- **CancelRoomDirectJson** - ביטול הזמנה

#### מבנה בקשת API (JSON):

```json
{
  "dateFrom": "2025-03-15",
  "dateTo": "2025-03-16",
  "city": "Dubai",
  "pax": [{"adults": 2, "children": []}],
  "ShowExtendedData": true,
  "limit": 5
}
```

**חשוב:** `ShowExtendedData: true` מחזיר תמונות, תיאור מלא, ו-facilities!

#### דוגמה לשימוש בצ'אט:

```
משתמש: אני רוצה לחפש מלון בדובאי ל-15-16 במרץ ל-2 מבוגרים
AI Agent: בואו אחפש עבורך מלונות בדובאי... [משתמש ב-search_hotels tool]
```

## Troubleshooting / איך לראות לוגים

**📖 קרא את [מדריך הדיבוג המלא](DEBUGGING.md)** - מסביר בדיוק איך לראות לוגים ולמצוא בעיות!

### בדיקה מהירה

הרץ את זה כדי לבדוק שהכל מוגדר נכון:
```bash
pnpm check-config
# או
node check-config.mjs
```

### המערכת לא מחזירה תוצאות מה-API

1. **בדוק הגדרות:** `node check-config.mjs`
2. **הרץ שרת:** `pnpm dev` והשאר את הטרמינל פתוח
3. **בדוק לוגים בטרמינל** - אמור לראות:
   ```
   [MediciAPI] Making POST request to https://medici-backend.azurewebsites.net/api/hotels/GetInnstantSearchPrice
   [MediciAPI] Response status: 200 OK
   [Chat] Search result: { itemsCount: 15, hasItems: true }
   ```
4. **אם יש שגיאות** - הלוגים יראו בדיוק מה הבעיה

### הסוכן לא מבין בקשות לחיפוש מלונות

וודא שב-system prompt של הסוכן יש התייחסות לשימוש ב-tools:
- Tool `search_hotels` דורש: `city`, `dateFrom`, `dateTo`
- הסוכן צריך לבקש מהמשתמש את העיר ותאריכים אם הם חסרים

## פיתוח

הפרויקט בנוי עם:
- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Express + tRPC
- **Database**: MySQL + Drizzle ORM
- **AI**: OpenAI GPT-4 עם Tool Calling
- **API**: Medici Hotels API

## נושאים ידועים

- [ ] צריך להוסיף retry logic ל-API calls
- [ ] צריך להוסיף caching לתוצאות חיפוש
- [ ] צריך לשפר error handling כשהעיר לא נמצאה
