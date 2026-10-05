---
sidebar_position: 2
title: Game Discovery
---

# Game Discovery

CritiPlay tidak menyimpan data game secara manual. Data diimpor dari **IGDB** dan disimpan lokal agar query cepat.

## Import Game dari IGDB

```
POST /api/games/import
Body: { "igdb_id": 1942 }
```

Jika game dengan `igdb_id` tersebut sudah pernah diimpor, sistem akan mengembalikan data yang sudah ada (tidak duplikat).

## Daftar & Detail Game

```
GET /api/games              → semua game
GET /api/games/{id}         → detail satu game
```

## Pencarian Game

```
GET /api/games/search?q=witcher
```

## Top Rated — per Aspek

Fitur ini mendukung tampilan seperti "Gameplay Terbaik", "Story Terbaik", "Visual Terbaik" di homepage.

```
GET /api/games/top-rated?type=overall
GET /api/games/top-rated?type=gameplay
GET /api/games/top-rated?type=story
GET /api/games/top-rated?type=visual
```

Hanya game dengan minimal 1 review yang akan muncul di hasil.

:::info
Route `/games/search`, `/games/import`, dan `/games/top-rated` harus didaftarkan **sebelum** `Route::apiResource('games', ...)` di `routes/api.php`, karena path dinamis `/games/{game}` akan menangkap path spesifik ini jika urutannya terbalik.
:::