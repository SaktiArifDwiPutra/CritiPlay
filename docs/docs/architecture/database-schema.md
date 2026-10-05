---
sidebar_position: 2
title: Database Schema
---

# Database Schema

## `users`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint | Primary key |
| name | string | |
| email | string | unique |
| password | string | nullable (untuk akun Google OAuth) |
| google_id | string | nullable |
| role | string | default `user` |
| avatar | string | nullable, path relatif di storage |
| email_verified_at | timestamp | nullable |
| otp | string | nullable, untuk verifikasi registrasi |
| otp_expires_at | timestamp | nullable |

## `games`

Data global, bukan milik user tertentu — satu baris game bisa direview dan dimasukkan ke library oleh banyak user.

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint | Primary key |
| igdb_id | bigint | unique, referensi ke IGDB |
| name | string | |
| cover_url | string | nullable |
| release_year | string | nullable |
| genres | json | array string |
| platforms | json | array string |
| summary | text | nullable |
| avg_gameplay | decimal | hasil agregat, auto-update |
| avg_story | decimal | hasil agregat, auto-update |
| avg_visual | decimal | hasil agregat, auto-update |
| avg_overall | decimal | hasil agregat, auto-update |
| total_reviews | integer | default 0 |

## `reviews`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint | Primary key |
| user_id | foreignId | → `users` |
| game_id | foreignId | → `games` |
| rating_gameplay | decimal(3,1) | 1–10 |
| rating_story | decimal(3,1) | 1–10 |
| rating_visual | decimal(3,1) | 1–10 |
| rating_overall | decimal(3,1) | rata-rata 3 aspek, dihitung otomatis |
| review_text | text | nullable |

Unique constraint: `[user_id, game_id]` — satu user hanya bisa membuat satu review per game.

## `game_user` (pivot — Library)

| Kolom | Tipe | Keterangan |
|---|---|---|
| user_id | foreignId | → `users` |
| game_id | foreignId | → `games` |
| status | string | `plan_to_play`, `playing`, `completed`, `dropped` |

## `follows`

| Kolom | Tipe | Keterangan |
|---|---|---|
| follower_id | foreignId | → `users`, yang mengikuti |
| following_id | foreignId | → `users`, yang diikuti |

Unique constraint: `[follower_id, following_id]`.

## `review_helpful_votes`

| Kolom | Tipe | Keterangan |
|---|---|---|
| user_id | foreignId | → `users` |
| review_id | foreignId | → `reviews` |

Unique constraint: `[user_id, review_id]` — satu user hanya bisa vote sekali per review (toggle).

## `review_discussions`

| Kolom | Tipe | Keterangan |
|---|---|---|
| review_id | foreignId | → `reviews` |
| user_id | foreignId | → `users` |
| content | text | |

Tidak ada kolom `parent_id` — diskusi bersifat flat, tidak mendukung nested reply. Ini keputusan desain yang disengaja (lihat [Social & Interaction](/docs/features/social-interaction)).

## Relasi Model

```
User
├── hasMany Review
├── hasMany Review (via ReviewHelpfulVote)
├── belongsToMany Game (via game_user) — Library
├── belongsToMany User (via follows, as follower) — Following
└── belongsToMany User (via follows, as following) — Followers

Game
├── hasMany Review
└── belongsToMany User (via game_user)

Review
├── belongsTo User
├── belongsTo Game
├── hasMany ReviewHelpfulVote
└── hasMany ReviewDiscussion
```