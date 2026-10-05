---
sidebar_position: 1
title: Overview
---

# API Reference

Seluruh endpoint CritiPlay didokumentasikan dalam format OpenAPI dan dapat dicoba langsung secara interaktif.

👉 **[Buka API Reference Interaktif](http://127.0.0.1:8000/scalar)**

## Autentikasi

Semua endpoint (kecuali registrasi, login, dan OTP) membutuhkan Bearer Token dari Laravel Sanctum:

```
Authorization: Bearer <token>
```

## Base URL

| Environment | URL |
|---|---|
| Local Development | `http://127.0.0.1:8000/api` |
| Production | *(belum di-deploy)* |

## Format Response

Seluruh response menggunakan format JSON. Response sukses umumnya berbentuk:

```json
{
  "message": "...",
  "data": { ... }
}
```

Response error umumnya berbentuk:

```json
{
  "message": "..."
}
```

dengan HTTP status code yang sesuai (`400`, `401`, `403`, `404`, `422`, `500`).