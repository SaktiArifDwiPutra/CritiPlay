---
sidebar_position: 5
title: Profile & Public Profile
---

# Profile & Public Profile

Ada dua jenis endpoint profil: profil pribadi (lengkap, termasuk email) dan profil publik (terbatas, bisa dilihat user lain).

## Profil Pribadi

```
GET /api/profile
```

Mengembalikan data lengkap milik user yang sedang login: nama, email, avatar, statistik library, jumlah review, dan aktivitas terbaru.

## Mengubah Profil

```
POST /api/profile
```

Mendukung perubahan `name`, `email`, dan upload `avatar` (format jpeg/png/jpg, maksimal 2MB).

:::warning
Karena endpoint ini menerima file upload (`multipart/form-data`), gunakan method `POST` dengan method spoofing (`_method=PUT`) jika route didaftarkan sebagai `PUT`. Browser tidak dapat mem-parsing body `multipart/form-data` pada request `PUT` murni.
:::

Jika email diubah, `email_verified_at` akan direset ke `null` dan perlu verifikasi ulang.

## Profil Publik

```
GET /api/users/{id}/profile
```

Berbeda dari profil pribadi, endpoint ini **tidak menyertakan email**, demi privasi. Mengembalikan:
- Nama dan avatar
- Statistik library (jumlah game per status)
- Total review
- 5 aktivitas library terbaru
- Jumlah followers/following
- Status apakah user yang login sedang mem-follow profil ini (`is_following`)

## Pencarian User

```
GET /api/users/search?q=restu
```

Pencarian dilakukan berdasarkan `name`, tidak case-sensitive. User yang sedang login tidak akan muncul di hasil pencariannya sendiri.