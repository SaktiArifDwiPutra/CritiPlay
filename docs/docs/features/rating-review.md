---
sidebar_position: 3
title: Rating & Review
---

# Rating & Review

Sistem rating CritiPlay berbeda dari platform review pada umumnya yang hanya memiliki satu skor. Setiap review terdiri dari **3 aspek terpisah**.

## 3 Aspek Rating

| Aspek | Rentang |
|---|---|
| Gameplay | 1–10 |
| Story | 1–10 |
| Visual | 1–10 |

## Overall Rating

Overall rating dihitung otomatis dari rata-rata ketiga aspek, dibulatkan 1 angka desimal:

```
overall = (gameplay + story + visual) / 3
```

Perhitungan ini terjadi di dua level:

1. **Per review** — overall rating milik review individual user
2. **Per game** — rata-rata dari overall semua user yang mereview game tersebut, disimpan di `games.avg_overall`

## Membuat Review

```
POST /api/reviews
Body: {
  "game_id": 1,
  "rating_gameplay": 8,
  "rating_story": 10,
  "rating_visual": 7,
  "review_text": "opsional"
}
```

Satu user hanya bisa membuat **satu review per game**. Percobaan review kedua akan ditolak (400).

## Mengubah & Menghapus Review

```
PUT /api/reviews/{id}
DELETE /api/reviews/{id}
```

Setiap kali review dibuat, diubah, atau dihapus, sistem menghitung ulang seluruh rata-rata (`avg_gameplay`, `avg_story`, `avg_visual`, `avg_overall`, `total_reviews`) pada data game terkait.

## Melihat Review per Game

```
GET /api/games/{gameId}/reviews
```

Setiap review menyertakan data penulis (`userId`, `userName`, `userAvatar`) untuk ditampilkan dan di-klik menuju [Public Profile](/docs/features/profile).