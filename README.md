# JB Healthcare - Hostinger Deployment Guide

এই প্রোজেক্টটি আপনার হোস্টিংগার (Hostinger) হোস্টিং-এ চিরস্থায়ীভাবে চালানোর জন্য নিচের ধাপগুলো অনুসরণ করুন।

## ১. ফাইল প্রস্তুতি (Build)
- আপনি যদি এই কোডটি ডাউনলোড করেন, তবে প্রথমে `npm run build` কমান্ডটি চালান (যদি আপনার কম্পিউটারে Node.js থাকে)।
- এটি একটি `dist` ফোল্ডার তৈরি করবে। এই ফোল্ডারের ফাইলগুলোই আপনাকে সার্ভারে আপলোড করতে হবে।

## ২. ডাটাবেস সেটআপ (MySQL)
- আপনার হোস্টিংগার প্যানেলে যান।
- একটি নতুন **MySQL Database** তৈরি করুন।
- ডাটাবেসের নাম, ইউজারনেম এবং পাসওয়ার্ডটি নোট করে রাখুন।
- আপনার ডাটাবেস প্যানেলে গিয়ে (phpMyAdmin-এ) নিচের SQL কমান্ডটি চালিয়ে টেবিলটি তৈরি করুন:

```sql
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255),
  user_email VARCHAR(255),
  item_name TEXT,
  amount DECIMAL(10, 2),
  shipping DECIMAL(10, 2),
  payment_method VARCHAR(50),
  payment_type VARCHAR(50),
  sender_name VARCHAR(255),
  sender_contact VARCHAR(20),
  trx_id VARCHAR(100),
  hospital_name VARCHAR(255),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  specialty VARCHAR(100),
  degree TEXT,
  consultationFee INT,
  image TEXT
);
```

## ৩. API কনফিগারেশন
- `api.php` ফাইলটি ওপেন করুন।
- নিচের লাইনগুলো আপনার ডাটাবেস তথ্যের সাথে পরিবর্তন করুন:
  ```php
  $host = 'localhost';
  $db   = 'আপনার_ডাটাবেস_নাম';
  $user = 'আপনার_ডাটাবেস_ইউজার';
  $pass = 'আপনার_ডাটাবেস_পাসওয়ার্ড';
  ```

## ৪. সার্ভারে আপলোড
- হোস্টিংগার **File Manager** এ যান।
- `public_html` ফোল্ডারের ভেতরে `dist` ফোল্ডারের সব ফাইল এবং `api.php` আপলোড করুন।
- আপনার ডোমেইনটি (যেমন: `www.yourdomain.com`) ভিজিট করলেই আপনার অ্যাপটি চালু হয়ে যাবে।

## ইম্পর্টেন্ট নোট (অর্ডার সংক্রান্ত)
- **লগইন আবশ্যক:** অর্ডার বা অ্যাপয়েন্টমেন্ট বুক করার জন্য ইউজারকে অবশ্যই প্রথমে লগইন করতে হবে। লগইন ছাড়া অর্ডার সাবমিট হবে না।
- **ডাটাবেস চেক:** যদি অর্ডার সাবমিট না হয়, তবে নিশ্চিত হোন যে আপনার `api.php`-তে ডাটাবেস ইউজার ও পাসওয়ার্ড সঠিক দেওয়া আছে এবং উপরের SQL কমান্ড দিয়ে টেবিল তৈরি করা হয়েছে।
- **টেস্ট মোড:** গুগল এআই স্টুডিওর প্রিভিউ মোডে অনেক সময় পেমেন্ট বা অর্ডার ঠিকমতো কাজ না-ও করতে পারে। এটি সম্পূর্ণ ঠিকমতো কাজ করবে যখন আপনি এটি আপনার হোস্টিংগার সার্ভারে লাইভ করবেন।

## ৫. অ্যাডমিন লগইন
- অ্যাপে গিয়ে লগইন বাটনে ক্লিক করুন।
- ইউজারনেম: `modaretor`
- পাসওয়ার্ড: `jagad01750`
- সফলভাবে লগইন হলে আপনি স্বয়ংক্রিয়ভাবে **Admin Dashboard** দেখতে পাবেন।

---
শুভকামনা,
JB Healthcare Team
