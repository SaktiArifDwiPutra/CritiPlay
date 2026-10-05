---
sidebar_position: 1
title: Autentikasi
---

# Autentikasi

CritiPlay menggunakan **Laravel Sanctum** untuk autentikasi berbasis token, dengan tambahan verifikasi email via OTP.

## Alur Registrasi

1. User mendaftar dengan `name`, `email`, `password`
2. Sistem generate kode OTP 6 digit, dikirim ke email user, berlaku 10 menit
3. User memasukkan OTP untuk verifikasi
4. Setelah terverifikasi, `email_verified_at` terisi dan token akses diterbitkan

POST /api/register
POST /api/verify-otp
POST /api/resend-otp (rate limit: 3 request/menit)

## Login

POST /api/login

Login akan ditolak (403) jika email belum diverifikasi melalui OTP.

## Login via Google

CritiPlay juga mendukung login menggunakan akun Google (OAuth), untuk user yang tidak ingin membuat password terpisah.

GET /api/auth/google/redirect
GET /api/auth/google/callback

## Reset Password

POST /api/forgot-password
POST /api/reset-password


## Menggunakan Token

Setelah login/verifikasi berhasil, sertakan token pada setiap request yang membutuhkan autentikasi:


## Logout

POST /api/logout

Menghapus token akses yang sedang digunakan (current access token saja, bukan semua token aktif user).