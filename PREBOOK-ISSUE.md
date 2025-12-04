# ⚠️ Critical Issue: PreBook Endpoint - Incorrect Pax Format

## Problem Summary

The Medici Hotels API `/PreBook` endpoint was returning **HTTP 204 No Content** due to incorrect `pax` structure in the request.

## Root Cause Discovered

**INCORRECT** pax format (what we were using):
```json
{
  "pax": [{ "adults": 2, "children": [] }]
}
```

**CORRECT** pax format (per official documentation):
```json
{
  "pax": [{
    "adults": [
      { "age": 30, "name": "Guest1", "surname": "Traveler" },
      { "age": 30, "name": "Guest2", "surname": "Traveler" }
    ],
    "children": []
  }]
}
```

The key difference: **adults must be an array of objects with age/name/surname**, not just a number!

## Test Results

### ✅ Search Works
```bash
POST /api/hotels/GetInnstantSearchPrice
→ HTTP 200 OK
→ Returns: {"items": [...], "code": "12915:standard:twin:RO:..."}
```

### ❌ PreBook with OLD format (number for adults)
```bash
POST /api/hotels/PreBook
Body: {
  "jsonRequest": "{\"services\":[{
    \"code\":\"...\",
    \"pax\":[{\"adults\":2,\"children\":[]}]  ← WRONG!
  }]}"
}
→ HTTP 204 No Content (endpoint silently rejects invalid format)
```

### 🔄 PreBook with NEW format (array of objects)
```bash
POST /api/hotels/PreBook
Body: {
  "jsonRequest": "{\"services\":[{
    \"code\":\"...\",
    \"pax\":[{
      \"adults\":[
        {\"age\":30,\"name\":\"Guest1\",\"surname\":\"Traveler\"},
        {\"age\":30,\"name\":\"Guest2\",\"surname\":\"Traveler\"}
      ],
      \"children\":[]
    }]
  }]}"
}
→ Should return HTTP 200 with token
```

## Impact

This was breaking the complete booking flow because:
1. PreBook is **required** to get a booking token
2. The token from PreBook is **required** for the Book endpoint
3. Without correct pax format, PreBook returned 204 (no content)

## Booking Flow Status (UPDATED)

```
✅ Stage 1: Search (GetInnstantSearchPrice) - WORKING
✅ Stage 2: PreBook - FIXED (updated pax format in buildPreBookRequest)
⚠️  Stage 3: Book - NEEDS TESTING (requires successful PreBook test)
```

## Tested Request Format

The request format matches the documented structure:

```json
{
  "jsonRequest": "{\"services\":[{\"searchCodes\":[{\"code\":\"12915:standard:twin:RO:69314e4724a242.33928301$1003X1095n1095t\",\"pax\":[{\"adults\":2,\"children\":[]}]}],\"searchRequest\":{\"currencies\":[\"USD\"],\"customerCountry\":\"IL\",\"dates\":{\"from\":\"2025-12-10\",\"to\":\"2025-12-11\"},\"destinations\":[{\"id\":12915,\"type\":\"hotel\"}],\"filters\":[{\"name\":\"payAtTheHotel\",\"value\":true},{\"name\":\"onRequest\",\"value\":false},{\"name\":\"showSpecialDeals\",\"value\":true}],\"pax\":[{\"adults\":2,\"children\":[]}],\"service\":\"hotels\"}}]}"
}
```

## Possible Causes

1. **API Change**: Medici may have changed the PreBook endpoint behavior
2. **Deprecated Endpoint**: PreBook might be deprecated in favor of a different approach
3. **Missing Credential**: Maybe PreBook requires additional authentication (though Bearer Token works for Search)
4. **Server-Side Bug**: The endpoint might be broken on Medici's side

## Action Items

### ✅ COMPLETED - Fixed Pax Format

1. **Identified the issue:** Documentation showed adults must be array of objects, not a number
2. **Updated buildPreBookRequest:** Converts `{adults: 2}` to proper format
3. **Added HTTP 204 handling:** Prevents crashes on invalid requests

### 🟡 Next Steps for Testing

1. **Test PreBook with production data:**
   - Run complete booking flow test
   - Verify token is returned
   - Check token format is correct

2. **Test Book endpoint:**
   - Use token from PreBook
   - Complete test booking (fully-refundable only!)
   - Verify booking confirmation

3. **Update documentation:**
   - Document correct pax format in all guides
   - Add examples with children
   - Update test scripts

### 🟢 Code Changes Made

**1. Fixed buildPreBookRequest in `server/mediciApi.ts`:**
```typescript
// Convert pax format: { adults: 2 } → { adults: [{age: 30, name: "Guest1"}, ...] }
const convertedPax = searchRequest.pax.map(paxGroup => ({
  adults: Array.from({ length: paxGroup.adults }, (_, i) => ({
    age: 30,  // Default age
    name: `Guest${i + 1}`,
    surname: "Traveler"
  })),
  children: paxGroup.children || []
}));

const jsonRequest = {
  services: [{
    code,  // Direct code field
    pax: convertedPax,  // Correct format with adults array
    searchRequest: { /* full search params */ }
  }]
};
```

**2. Added HTTP 204 handling in `makeApiRequest`:**
```typescript
// Handle HTTP 204 No Content responses
if (response.status === 204) {
  console.warn(`[MediciAPI] Received 204 No Content - endpoint returned no data`);
  return {} as T;
}
```

The fix converts the simple `{adults: 2}` format into the required array format with guest details.

## Technical Details

### Request Headers
```
Content-Type: application/json
Authorization: Bearer eyJhbGc...
```

### Response Headers
```
HTTP/2 204 No Content
Date: Thu, 04 Dec 2025 09:04:25 GMT
Server: Microsoft-IIS/10.0
X-Powered-By: ASP.NET
```

### Full curl Command Used
```bash
curl -X POST "https://medici-backend.azurewebsites.net/api/hotels/PreBook" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"jsonRequest":"{...}"}'
```

## Next Steps

1. **Immediately**: Contact Medici support with this report
2. **Request**: Working PreBook example or alternative booking method
3. **Update**: Code once we know the correct API structure
4. **Test**: Complete booking flow end-to-end

---

**Date Discovered**: December 4, 2025
**Severity**: Critical - Blocks all hotel bookings
**Status**: Awaiting Medici Support Response
