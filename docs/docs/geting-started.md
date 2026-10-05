---
sidebar_position: 1
---

# Getting Started

Selamat datang di dokumentasi **CritiPlay** — platform review game dengan sistem rating multi-aspek (gameplay, story, visual).

## Apa itu CritiPlay?

CritiPlay bukan media sosial seperti Instagram atau Reddit. CritiPlay adalah platform **review game**, di mana fokus utamanya adalah:

- Rating game berdasarkan 3 aspek terpisah: **Gameplay**, **Story**, dan **Visual**
- Overall rating dihitung otomatis dari gabungan ketiga aspek tersebut
- Diskusi di tiap review bersifat **flat** (tanpa nested reply), untuk menjaga agar platform tetap fokus pada review, bukan menjadi forum diskusi berantai

## Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | Laravel (PHP) |
| Database | MySQL |
| Auth | Laravel Sanctum |
| Data Game | IGDB API |
| API Docs | Scalar / Swagger (OpenAPI) |
| Project Docs | Docusaurus |

## Prasyarat

Sebelum memulai, pastikan sudah terpasang:

- PHP >= 8.2
- Composer
- MySQL
- Node.js >= 18 (khusus untuk menjalankan dokumentasi ini)

## Instalasi Backend

Clone repository dan masuk ke folder backend:

```bash
git clone https://github.com/critiplay/critiplay-backend.git
cd critiplay-backend
```

Install dependency:

```bash
composer install
```

Salin file environment dan generate application key:

```bash
cp .env.example .env
php artisan key:generate
```

Atur koneksi database di file `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=critiplay_db
DB_USERNAME=root
DB_PASSWORD=
```

Jalankan migration:

```bash
php artisan migrate
```

Jalankan server lokal:

```bash
php artisan serve
```

Backend sekarang bisa diakses di `http://127.0.0.1:8000`.

## Autentikasi

CritiPlay menggunakan **Laravel Sanctum** untuk autentikasi berbasis token. Setelah login, sertakan token pada setiap request ke endpoint yang membutuhkan autentikasi: