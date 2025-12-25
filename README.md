# Bhakta Sanmilani 🛕  
**Official Donation & Temple Management Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)]  
[![Next.js](https://img.shields.io/badge/Next.js-14-black)]  
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)]  
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay-brightgreen)]  
[![Deployment](https://img.shields.io/badge/Deployment-Vercel-black)]  

A secure, production-ready **temple donation website** with **online payments**, **admin dashboard**, **analytics**, and **privacy-first architecture**, built using modern web technologies.

---

## 🌸 Project Overview

**Bhakta Sanmilani** is a full-stack donation platform designed for religious and charitable organizations.  
It enables devotees to make secure online donations while allowing administrators to manage, monitor, and analyze donations through a protected admin panel.

The platform focuses on:
- Transparency
- Security
- Simplicity
- Compliance

---

## ✨ Features

### 🙏 Donor-Facing
- Secure online donations via **Razorpay**
- Mobile-friendly, responsive UI
- Donation acknowledgment & receipt flow
- Privacy-respecting data handling
- Informational pages (About, Contact, Privacy Policy, Terms)

### 🔐 Admin Dashboard
- Secure admin authentication (JWT + HttpOnly cookies)
- Donation analytics with charts (daily / monthly / yearly)
- Donation comparison & trends
- CSV & PNG export for reports
- Production-grade security headers

### 📊 Analytics
- Filter by date range
- Daily / Monthly / Yearly aggregation
- Amount / Count / Stacked chart modes
- Responsive charts (Recharts)
- Export analytics as CSV or image

### 🔒 Security
- Password hashing using **bcrypt**
- Rate limiting on sensitive endpoints
- Secure cookies (HttpOnly, SameSite)
- CSP, HSTS, X-Frame-Options enabled
- No storage of sensitive payment data

---

## 🧰 Tech Stack

### Frontend
- **Next.js 14 (App Router)**
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **Recharts** (analytics & charts)
- **html2canvas** (chart export)

### Backend
- **Node.js**
- **Express / API Routes**
- **JWT Authentication**
- **PostgreSQL / MongoDB** (based on deployment)
- **Razorpay SDK**

### DevOps & Deployment
- **Vercel** (Frontend)
- **Cloud-hosted DB**
- **Environment-based configuration**
- **Production security headers**

---

## 📁 Project Structure
.
├── app
│ ├── admin
│ │ ├── dashboard
│ │ │ └── analytics
│ │ │ └── analytics.tsx
│ │ └── login
│ ├── api
│ │ ├── admin
│ │ │ ├── login
│ │ │ └── donations
│ │ └── payments
│ ├── privacy-policy
│ ├── terms-and-conditions
│ └── page.tsx
├── components
│ ├── layout
│ ├── sections
│ └── ui
├── lib
│ ├── auth.ts
│ ├── db.ts
│ └── security.ts
├── public
├── styles
├── README.md
└── package.json


---

## 🔐 Authentication Flow

- Admin login protected via JWT
- Tokens stored in **HttpOnly cookies**
- Automatic logout on password change
- Rate-limited login attempts
- Role-based access (single-admin model)

---

## 💳 Payment Flow (Razorpay)

1. User initiates donation
2. Razorpay Checkout opens securely
3. Payment verified server-side
4. Donation stored with:
   - Amount
   - Payment ID
   - Status
   - Timestamp
5. Data reflected in admin analytics

> ⚠️ No card, CVV, or UPI credentials are ever stored.

---

## 📊 Analytics Module

| Feature | Description |
|------|------------|
| Timeframes | Daily / Monthly / Yearly |
| Filters | Custom date range |
| Metrics | Amount, Count, Stacked |
| Comparison | Last 30 days vs previous |
| Export | CSV & PNG |
| Charts | Fully responsive |

---

## ⚙️ Environment Variables

Create a `.env` file:
```

NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Exposed to browser – safe public key only

# DATABASE_URL=""
DIRECT_URL=""
DATABASE_URL="s"
# Database already exists:
# DATABASE_URL=...

# SMTP / email config
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
SMTP_FROM_EMAIL=""

ORG_CONTACT_EMAIL=

ADMIN_JWT_SECRET=
INIT_ADMIN_PASSWORD=
#password : BhaktaSanmilan@12345

```

**Never commit `.env` files to version control.**

---

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

---
```
## 🌐 Deployment

### Frontend (Vercel)

- Connect the GitHub repository to **Vercel**
- Configure required **environment variables**
- Automatic deployment on every push to the `main` branch

### Database

- Hosted **PostgreSQL** or **MongoDB**
- Secure connection via environment variables
- Credentials are never exposed to the frontend

---

## 📜 Legal Pages

The website includes dedicated legal pages to ensure transparency and compliance:

- `/privacy-policy`
- `/terms-and-conditions`

These pages are written specifically for a **donation-based religious trust** and cover:

- Data privacy and protection
- Donation terms and conditions
- Refund and cancellation policy
- Legal compliance under Indian law

---

## 🛡️ Compliance & Best Practices

This project follows industry-standard security and compliance practices:

- Adheres to **OWASP security recommendations**
- Implements **GDPR-style privacy handling**
- Aligns with **Indian IT Act** data protection practices
- Fully compliant with **Razorpay payment standards**

---

## 👥 Contribution

This project is currently **maintained privately** for the trust.

If contributions are enabled in the future:

1. Fork the repository
2. Create a feature branch
3. Commit changes with clear, descriptive messages
4. Open a Pull Request for review

---

## 📞 Contact

**Organization:** Bhakta Sanmilani  
**Email:** bardhamanbhaktasanmilani@gmail.com
**Website:** www.bhaktasanmilani.org

---

> _“Service to humanity is service to the divine.”_

🙏 Thank you for supporting our mission.


