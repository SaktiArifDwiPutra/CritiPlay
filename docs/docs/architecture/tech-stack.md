---
sidebar_position: 1
title: Tech Stack
---

# Tech Stack

## Backend

| Layer | Teknologi |
|---|---|
| Framework | Laravel (PHP 8.3) |
| Database | MySQL |
| Autentikasi | Laravel Sanctum (token-based) |
| Social Login | Google OAuth |
| Email/OTP | Laravel Mail |
| Sumber Data Game | IGDB API |

## Dokumentasi

| Kebutuhan | Tool |
|---|---|
| Dokumentasi umum (panduan, changelog) | Docusaurus |
| API Reference interaktif | Scalar (render dari OpenAPI spec) |

## Alasan Pemilihan

### Laravel Sanctum, bukan Passport
Sanctum dipilih karena CritiPlay adalah aplikasi dengan satu frontend (SPA/mobile), bukan platform yang perlu melayani banyak pihak ketiga dengan OAuth penuh. Sanctum lebih ringan dan cukup untuk kebutuhan token-based auth.

### IGDB untuk data game
Daripada menyimpan data game secara manual satu per satu, CritiPlay mengimpor data dari IGDB (nama, cover, genre, platform, summary) melalui `igdb_id` sebagai identifier unik, lalu disimpan secara lokal agar query cepat dan tidak bergantung pada rate limit IGDB saat runtime.

### Skema rating 3 kolom terpisah, bukan JSON
Rating per-aspek (`rating_gameplay`, `rating_story`, `rating_visual`) disimpan sebagai kolom desimal terpisah, bukan dalam satu kolom JSON. Ini memungkinkan query `ORDER BY` langsung di level database untuk fitur seperti "Gameplay Terbaik" tanpa perlu parsing JSON yang lambat.