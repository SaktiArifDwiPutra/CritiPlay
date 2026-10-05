---
sidebar_position: 4
title: Library
---

# Library

Fitur untuk melacak status game yang sedang/sudah/akan dimainkan user — mirip konsep "watchlist".

## Status yang Tersedia

| Status | Keterangan |
|---|---|
| `plan_to_play` | Direncanakan untuk dimainkan |
| `playing` | Sedang dimainkan |
| `completed` | Sudah selesai dimainkan |
| `dropped` | Berhenti dimainkan sebelum selesai |

## Menambah / Mengubah Status Game di Library

```
POST /api/library
Body: { "game_id": 1, "status": "playing" }
```

Jika game sudah ada di library user, status akan diperbarui (bukan membuat entri baru).

## Melihat Library

```
GET /api/library                    → semua game di library
GET /api/library?status=playing     → filter berdasarkan status
```

## Menghapus dari Library

```
DELETE /api/library/{gameId}
```