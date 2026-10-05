---
sidebar_position: 6
title: Social & Interaction
---

# Social & Interaction

:::info Prinsip Desain
CritiPlay adalah **platform review game**, bukan media sosial seperti Instagram atau Reddit. Fitur sosial di sini dibatasi secara sengaja agar tetap mendukung tujuan utama: review dan diskusi seputar game, bukan interaksi sosial bebas.
:::

## Follow

User dapat mengikuti reviewer lain untuk melihat aktivitas mereka. Tidak ada fitur "friend request" dua arah — follow bersifat satu arah seperti Twitter/X, bukan seperti Facebook.

```
POST   /api/users/{userId}/follow
DELETE /api/users/{userId}/follow
GET    /api/users/{userId}/followers
GET    /api/users/{userId}/following
```

User tidak dapat mem-follow dirinya sendiri, dan tidak dapat follow user yang sama dua kali.

## Helpful Vote

Mirip tombol "like", digunakan untuk menandai review yang dianggap berguna oleh user lain. Bersifat toggle — klik lagi untuk membatalkan.

```
POST /api/reviews/{id}/helpful
```

Setiap review menampilkan `helpfulCount` (jumlah total vote, sama untuk semua orang) dan `isHelpfulByMe` (status personal, berbeda tergantung siapa yang login).

## Discussion

Setiap review memiliki ruang diskusi sendiri, tempat user lain dapat menanggapi review tersebut.

```
GET    /api/reviews/{id}/discussions
POST   /api/reviews/{id}/discussions
DELETE /api/discussions/{id}
```

### Kenapa Flat, Bukan Nested Reply?

Desain diskusi di CritiPlay sengaja **tidak mendukung reply bertingkat** (reply ke reply). Setiap komentar berdiri sejajar di dalam satu ruang diskusi per review — mirip pendekatan MyAnimeList, bukan Reddit.

Alasannya: nested reply cenderung mendorong platform menjadi thread debat panjang yang menjauh dari topik review itu sendiri. Dengan struktur flat, diskusi tetap berpusat pada review yang dibahas.

Hanya pemilik komentar yang dapat menghapus komentarnya sendiri.