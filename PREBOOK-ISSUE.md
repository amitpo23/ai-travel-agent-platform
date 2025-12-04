# ⚠️ Critical Issue: PreBook Endpoint Returns HTTP 204

## Problem Summary

The Medici Hotels API `/PreBook` endpoint is returning **HTTP 204 No Content** instead of HTTP 200 with a JSON response containing the booking token.

## Test Results

### ✅ Search Works
```bash
POST /api/hotels/GetInnstantSearchPrice
→ HTTP 200 OK
→ Returns: {"items": [...], "code": "12915:standard:twin:RO:..."}
```

### ❌ PreBook Returns Empty Response
```bash
POST /api/hotels/PreBook
Body: {"jsonRequest": "{\"services\":[...]}"}
→ HTTP 204 No Content
→ Returns: (empty body)
```

**Expected:** HTTP 200 with JSON body containing `content.services.hotels[0].token`

**Actual:** HTTP 204 with no body

## Impact

This breaks the complete booking flow because:
1. PreBook is **required** to get a booking token
2. The token from PreBook is **required** for the Book endpoint
3. Without PreBook token, we **cannot complete bookings**

## Booking Flow Status

```
✅ Stage 1: Search (GetInnstantSearchPrice) - WORKING
❌ Stage 2: PreBook - BROKEN (returns 204 instead of token)
⚠️  Stage 3: Book - CANNOT TEST (requires token from Stage 2)
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

### 🔴 Urgent - Contact Medici Support

Contact Medici Hotels technical support and ask:

1. **Is PreBook endpoint working correctly?**
   - Why is it returning HTTP 204 instead of JSON with token?
   - Has the API changed recently?

2. **What is the correct booking flow?**
   - Is PreBook still required?
   - Is there an alternative endpoint?
   - Do we need different credentials?

3. **Can you provide working examples?**
   - Postman collection with working PreBook request
   - Complete booking flow example
   - Updated API documentation

### 🟡 Temporary Workaround

Until PreBook is fixed, the system can:
- ✅ Search hotels successfully
- ✅ Display results to users
- ❌ Cannot complete bookings

### 🟢 Code Changes Made

Updated `server/mediciApi.ts` to handle HTTP 204 responses:
```typescript
// Handle HTTP 204 No Content responses
if (response.status === 204) {
  console.warn(`[MediciAPI] Received 204 No Content - endpoint returned no data`);
  return {} as T;
}
```

This prevents the app from crashing, but bookings still won't work without the token.

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
