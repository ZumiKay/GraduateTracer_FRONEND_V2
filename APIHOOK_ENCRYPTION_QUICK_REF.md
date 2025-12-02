# ApiHook Encryption - Quick Reference

## 🎯 Two Encryption Modes

### Mode 1: Full URL Encryption (`encrypt: true`)

Encrypts entire URL → Sends to `/de/encryptedUrl` endpoint

```typescript
const response = await ApiRequest({
  method: "GET",
  url: "/api/sensitive/data",
  encrypt: true, // ← Full URL encrypted
});
```

**Flow:** URL → Encrypted → POST `/de/encryptedUrl` → Backend decrypts

---

### Mode 2: Partial Parameter Encryption (`encrypt: ["paramName"]`)

Encrypts specific URL parameters → Sends to regular endpoint

```typescript
const response = await ApiRequest({
  method: "GET",
  url: "/api/user/:userId/profile",
  encrypt: ["userId"], // ← Only userId encrypted
});
```

**Result:** `/api/user/encryptedValue/profile`

---

## 📊 Usage Comparison

| Feature     | Full URL            | Partial Params        |
| ----------- | ------------------- | --------------------- |
| Use Case    | Sensitive endpoints | Selective protection  |
| Encrypt     | Entire URL          | Only specified params |
| Endpoint    | `/de/encryptedUrl`  | Original endpoint     |
| Complexity  | Higher              | Lower                 |
| Performance | Slightly slower     | Faster                |

---

## 💻 Code Examples

### Example 1: Get Student Response (Full Encryption)

```typescript
const response = await ApiRequest({
  method: "GET",
  url: "/api/responses/123",
  encrypt: true,
});
```

### Example 2: Get Student Data (Partial Encryption)

```typescript
const response = await ApiRequest({
  method: "GET",
  url: "/api/students/:studentId/data",
  encrypt: ["studentId"],
});
```

### Example 3: POST with Encryption

```typescript
const response = await ApiRequest({
  method: "POST",
  url: "/api/submit",
  data: { score: 85, comment: "Good" },
  encrypt: true,
});
```

### Example 4: With React Query

```typescript
const { data } = useQuery({
  queryKey: ["response", id],
  queryFn: createQueryFn({
    method: "GET",
    url: `/api/response/:id`,
    encrypt: ["id"],
  }),
});
```

---

## 🔄 What Happens Behind the Scenes

### Full URL Encryption (`encrypt: true`)

```
1. Request: /api/endpoint/123
   ↓
2. Fetch public key from /encrypt/public-key
   ↓
3. Encrypt: /api/endpoint/123 → "encryptedBase64..."
   ↓
4. Send to /de/encryptedUrl with encrypted data
   ↓
5. Backend decrypts and routes request
```

### Partial Parameter Encryption (`encrypt: ["id"]`)

```
1. URL: /api/endpoint/:id/details
   ↓
2. Identify 'id' parameter segment
   ↓
3. Encrypt segment: "123" → "encryptedValue"
   ↓
4. Send to /api/endpoint/encryptedValue/details
```

---

## ✅ Feature Checklist

- ✅ Full URL encryption support
- ✅ Partial parameter encryption
- ✅ Public key caching
- ✅ Automatic key fetching
- ✅ RSA-OAEP encryption
- ✅ AES fallback for large data
- ✅ Error handling
- ✅ Backward compatible
- ✅ Type-safe

---

## 🔐 How Encryption Works

### RSA-OAEP (Small data < 180 bytes)

```
URL → RSA encrypt → Base64URL → Send
```

### Hybrid AES + RSA (Large data)

```
AES key (random)
    ↓
Encrypt URL with AES → RSA encrypt AES key
    ↓
Combine: encKey:IV:encData
    ↓
Base64URL encode → Send
```

---

## 📝 Default Behavior

| Scenario           | What Happens                                   |
| ------------------ | ---------------------------------------------- |
| `encrypt: true`    | Full URL encrypted, sent to `/de/encryptedUrl` |
| `encrypt: ["id"]`  | Parameter "id" encrypted, sent to original URL |
| `encrypt: false`   | No encryption (default)                        |
| No `encrypt` param | No encryption (default)                        |

---

## 🚀 Key Points

✅ **Automatic Key Management**

- Fetches public key on first use
- Caches for performance
- Call `refreshPublicKey()` to rotate

✅ **Transparent to You**

- Encryption happens automatically
- Just pass `encrypt` parameter
- Works with existing code

✅ **Production Ready**

- Error handling included
- Fallback mechanisms
- Performance optimized

✅ **Backward Compatible**

- Existing code works unchanged
- Only enable encryption where needed
- No breaking changes

---

## 📞 Common Questions

**Q: When should I use `encrypt: true`?**
A: For highly sensitive URLs you want fully hidden (gradebook, student records, etc.)

**Q: When should I use `encrypt: ["id"]`?**
A: When you want selective protection on specific parameters

**Q: What if encryption fails?**
A: Gracefully handled with error response, never crashes

**Q: Is there performance impact?**
A: Minimal (~10-50ms for RSA, key caching reduces overhead)

**Q: Do I need HTTPS?**
A: Yes, use encryption + HTTPS for defense in depth

**Q: How do I rotate keys?**
A: Call `refreshPublicKey()` after server key rotation

---

## 🧪 Quick Test

```typescript
// Test full URL encryption
const test1 = await ApiRequest({
  method: "GET",
  url: "/api/test",
  encrypt: true,
});

// Test partial encryption
const test2 = await ApiRequest({
  method: "GET",
  url: "/api/user/:userId",
  encrypt: ["userId"],
});

// Test no encryption
const test3 = await ApiRequest({
  method: "GET",
  url: "/api/test",
});
```

---

**Version:** 2.0.0  
**Status:** ✅ Ready  
**Date:** November 6, 2025
