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
MEDICI_CLIENT_SECRET=zlbgGGxz~|l3.Q?XXAT)uT!Lty,kJC>R?`:k?oQH$I=P7rL<R:Em:qDaM1G(jFU7

# OpenAI API
OPENAI_API_KEY=sk-...

# Server
PORT=3000
NODE_ENV=development
JWT_SECRET=your_random_secret_key_here
```

**חשוב:** ללא הגדרת `MEDICI_API_TOKEN` ו-`MEDICI_CLIENT_SECRET`, חיפוש מלונות לא יעבוד!

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

#### דוגמה לשימוש בצ'אט:

```
משתמש: אני רוצה לחפש מלון בדובאי ל-15-16 במרץ ל-2 מבוגרים
AI Agent: בואו אחפש עבורך מלונות בדובאי... [משתמש ב-search_hotels tool]
```

## Troubleshooting

### המערכת לא מחזירה תוצאות מה-API

1. בדוק שהגדרת את `MEDICI_API_TOKEN` ו-`MEDICI_CLIENT_SECRET` ב-`.env`
2. בדוק בקונסול את הלוגים:
   ```
   [MediciAPI] Making POST request to https://medici-backend.azurewebsites.net/api/hotels/GetInnstantSearchPrice
   [MediciAPI] Response status: 200 OK
   [Chat] Search result: { itemsCount: 15, hasItems: true }
   ```
3. אם אתה רואה שגיאות, הלוגים יראו את השגיאה המדויקת מה-API

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
