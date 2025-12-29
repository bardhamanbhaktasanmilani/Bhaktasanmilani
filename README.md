# Bhakta Sanmilani 🛕  
**Official Donation & Temple Management Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)]  
[![Next.js](https://img.shields.io/badge/Next.js-14-black)]  
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)]  
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay-brightgreen)]  
[![Deployment](https://img.shields.io/badge/Deployment-Vercel-black)]  

A **secure, production-grade donation and temple management platform** designed for religious and charitable organizations.  
Bhakta Sanmilani focuses on **trust, transparency, privacy, and operational reliability**, enabling seamless online donations, automated receipts, and a protected admin dashboard with analytics and reporting.

---

## 📑 Table of Contents

- [Project Overview](#-project-overview)
- [Design Philosophy](#-design-philosophy)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Donation & Payment Flow (Razorpay)](#-donation--payment-flow-razorpay)
- [Security Model](#-security-model)
- [API Reference (Selected)](#-api-reference-selected)
- [Admin Dashboard](#-admin-dashboard)
- [Analytics & Reporting](#-analytics--reporting)
- [Deployment (Vercel)](#-deployment-vercel)
- [Testing & Quality](#-testing--quality)
- [Operational Concerns](#-operational-concerns)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License & Contact](#-license--contact)
- [Acknowledgements](#-acknowledgements)

---

## 🌸 Project Overview

**Bhakta Sanmilani** is a full-stack donation platform built to modern production standards.

It enables:
- Devotees to donate securely via Razorpay
- Automatic receipt generation (PDF + Email)
- Administrators to monitor donations through a protected dashboard
- Auditable, webhook-driven confirmation of payments

The platform is suitable for:
- Temples
- Religious trusts
- Non-profit organizations
- Community donation initiatives

---

## 🧭 Design Philosophy

- **Security by Default**
  - HttpOnly authentication cookies
  - Strong password hashing
  - Rate limiting on sensitive endpoints
  - Strict security headers (CSP, HSTS, etc.)

- **Privacy First**
  - No card, CVV, or UPI credentials stored
  - Minimal donor PII collection
  - Clear data boundaries between public and admin systems

- **Reliability & Integrity**
  - Webhook-verified payments only
  - Idempotent donation storage
  - Server-side order creation

- **Simplicity**
  - Mobile-first donor UX
  - Clean admin workflows
  - Clear operational separation of concerns

---

## ✨ Key Features

### Donor-Facing
- Responsive donation page (mobile & desktop)
- Preset donation amounts + custom amount input
- Razorpay Checkout integration
- Support for UPI, cards, net banking, wallets
- Donation receipt page (PDF)
- Email receipts via SMTP
- Accessibility-friendly UI

### Admin Dashboard
- Secure admin login (JWT + HttpOnly cookies)
- Donation listing with filters and search
- Daily / monthly / yearly donation analytics
- CSV export of donations
- Chart export (PNG) using `html2canvas`
- Single-admin model (extensible to RBAC)

### Security & Compliance
- `bcrypt` password hashing
- Rate limiting (login & critical APIs)
- Secure cookies (`HttpOnly`, `SameSite`)
- Security headers:
  - Content-Security-Policy
  - HSTS
  - X-Frame-Options
  - X-Content-Type-Options
- Razorpay webhook signature verification
- Secret rotation guidance

---

## 🏗 System Architecture

```text
[ Donor Browser ]
        |
        | HTTPS (Donate Page)
        v
[ Next.js Frontend (Vercel) ]
        |
        | Razorpay Checkout (Client)
        v
[ Razorpay Payment Gateway ]
        |
        | Secure Webhook (HMAC Verified)
        v
[ /api/razorpay/webhook ]
        |
        | Verify + Persist Donation
        v
[ Database (Postgres / MongoDB) ]
        |
        | Secure Read
        v
[ Admin Dashboard (Protected) ]
        ^
        |
[ Admin Browser ]


```

**Notes**
- Webhooks are verified server-side using `RAZORPAY_WEBHOOK_SECRET`.
- Orders are created server-side (so `RAZORPAY_KEY_SECRET` stays secret).
- Frontend only receives the public key (`NEXT_PUBLIC_RAZORPAY_KEY_ID`).

---

## 🧰 Technology Stack

**Frontend**
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- Recharts (charts)
- html2canvas (chart export)

**Backend**
- Node.js / Express-style API routes (Next.js / Serverless-ready)
- Authentication: JWT + HttpOnly cookie
- ORM: Prisma (Postgres) or Mongoose (MongoDB) — configurable
- Razorpay SDK
- Email: SMTP (Nodemailer or Resend support)
- Rate limiting & request logging

**DevOps**
- Vercel for frontend & serverless functions
- Managed Postgres (or MongoDB Atlas)
- Secrets: Vercel Environment Variables / Vault in enterprise
- Observability: Logs (EFK), Error tracking (Sentry), Metrics (Prometheus + Grafana optional)

---

# 🚀 Getting Started

Clone & install:

```bash
git clone https://github.com/<org>/bhakta-sanmilani.git
cd bhakta-sanmilani

npm install
# or
pnpm install

```
## ⚙️ Local Development & Environment Setup

### Create environment file

Create a `.env` file in the project root (see **Environment Variables** below).

> ⚠️ **Important:** Never commit `.env` files to version control.

---

### Run development server

```bash
npm run dev
# or
pnpm dev
```
## Build & run production locally:
```
npm run build
npm start
```

## Run tests:
```
npm test
```

## ⚙️ Environment Variables
Create a .env in the project root. DO NOT commit this file.
```
# Public (browser-safe)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX

# Private (server only)
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname?schema=public"
# OR for MongoDB:
# MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true&w=majority"

# Auth + Admin
ADMIN_JWT_SECRET=super_secret_jwt_key
INIT_ADMIN_EMAIL=admin@domain.org
INIT_ADMIN_PASSWORD=change-this-on-first-login

# SMTP (for receipts)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=username
SMTP_PASS=password
SMTP_FROM_EMAIL="Bhakta Sanmilani <noreply@domain.org>"

# Optional: Sentry, monitoring
SENTRY_DSN=
```

## ✅ Best Practices

- Keep `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` **strictly server-only**
- Never expose private Razorpay secrets to the browser or client-side code
- Rotate `RAZORPAY_WEBHOOK_SECRET` immediately if a compromise is suspected
- Update the rotated webhook secret both in:
  - Razorpay Dashboard
  - Vercel Environment Variables
- Use **Vercel Environment Variables** or a **dedicated secrets manager**
  (AWS Secrets Manager, HashiCorp Vault, etc.) in production environments

---

## Payment Flow (Razorpay) — Summary & Security


1. Frontend → POST /api/donations/create-order
   - Sends donation amount and donor metadata

2. Backend → Razorpay Orders API
   - Uses RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET
   - Creates a secure payment order

3. Backend → Frontend
   - Returns Razorpay order_id and public key

4. Frontend → Razorpay Checkout
   - Uses NEXT_PUBLIC_RAZORPAY_KEY_ID + order_id

5. Razorpay → Backend (Webhook)
   - POST /api/razorpay/webhook
   - Contains payment event payload

6. Backend Verification
   - Verifies HMAC signature using RAZORPAY_WEBHOOK_SECRET
   - Marks donation as PAID
   - Persists payment metadata:
     - payment_id
     - order_id
     - amount
     - currency
     - timestamp

7. Post-Processing
   - Sends donation receipt email (if email provided)

## 💳 Donation & Payment Flow (Razorpay)

This section explains the **end-to-end donation lifecycle**, from user interaction to secure backend processing and post-payment actions.

---

### 🖥️ Frontend (Client)

1. User enters the donation amount and submits the form.
2. Frontend sends a request to:

```http
POST /api/donations/create-order
```

---

### 🧠 Backend (Server)

1. Validates the donation request.
2. Creates a **Razorpay Order** using **server-side secret keys**.
3. Returns only:
- `order_id`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` (safe-to-expose public key)

> 🔒 Razorpay **secret keys never leave the server**.

---

### 💳 Razorpay Checkout (Client)

1. Razorpay Checkout modal opens on the client.
2. User completes the payment securely on Razorpay’s hosted interface.

---

### 📡 Payment Confirmation (Webhook)

1. Razorpay sends a payment event to:

```http
POST /api/razorpay/webhook
```


# 📡 API Reference (Selected)

These are the primary backend endpoints used by the application.  
Adapt paths, naming, and authentication middleware to your routing conventions if required.

---

### 🧾 Create Donation Order (Server)

Creates a Razorpay order securely on the server.

```http
POST /api/donations/create-order
Content-Type: application/json
```
2. Backend verifies the webhook using **HMAC SHA256 signature validation**.
3. Only verified events are processed.

---

### 🗄️ Persistence (Database)

- Donation status is marked as **PAID**.
- Transaction metadata is stored securely:
- Order ID
- Payment ID
- Amount
- Timestamp
- Donor details (minimal & privacy-safe)

---

### 📧 Post-Processing

- Donation receipt email is sent automatically **if an email address is provided**.
- Receipt generation happens **after webhook verification**, never on client trust.

---

## 🔐 Security Model

This platform follows a **defense-in-depth security approach**:

- ❌ No card, UPI, or payment credentials are ever stored
- 🔑 Razorpay **secret keys never exposed to the client**
- ✅ Webhook signature verification is **mandatory**
- 🛡️ Admin access protected using:
- JWT-based authentication
- HttpOnly cookies
- Rate limiting on sensitive routes
- 🔄 Recommended:
- Periodic rotation of Razorpay secrets
- Immediate rotation if compromise is suspected

---

> **Security First Principle**  
> Client → Server → Razorpay → Webhook → Database  
>  
> No payment is trusted unless confirmed by Razorpay’s signed webhook.


```json
{
  "amount": 500,
  "donorName": "Optional",
  "donorEmail": "optional@email.com",
  "donorPhone": "optional"
}
```
### Razorpay Webhook
```http
POST /api/razorpay/webhook
```
- Verifies signature
- Persists payment
- Triggers receipt flow

## 📊 Admin Dashboard

The platform includes a **secure, role-protected admin dashboard** for managing and analyzing donations.

### Features
- 🔐 Protected admin routes
- 💰 Donation overview with real-time status
- 🔎 Search and advanced filters
- 📊 Interactive analytics charts
- 📤 Export data as **CSV** and **PNG**
- 🔓 Secure logout and password change flow

---

## 📈 Analytics & Reporting

Designed for transparency and operational insight.

- 📅 Donation trends:
  - Daily
  - Monthly
  - Yearly
- 💵 Total collection summaries
- 📁 Exportable datasets for accounting
- 🖼 Chart screenshots for official reports and audits

---

## ☁️ Deployment (Vercel)

### Deployment Steps
1. Push the repository to **GitHub**
2. Connect the repository in **Vercel**
3. Add required environment variables in the Vercel dashboard
4. Deploy from the `main` branch

### Vercel Handles Automatically
- ⚙️ Build pipeline
- 🌐 Serverless API routes
- 🔒 HTTPS & SSL
- 📈 Auto-scaling and edge optimization

---

## 🧪 Testing & Quality

Quality and reliability are ensured through:

- 🔁 Manual end-to-end flow testing  
  *(donation → webhook → receipt)*
- 🔐 Environment isolation  
  *(test keys vs live keys)*
- 🧹 Linting and static analysis
- 🧠 Full type safety with **TypeScript**
- ✅ Production sanity checks before release

---

## 🛠 Operational Concerns

Best practices for production operations:

- 🔄 Rotate secrets periodically
- 📡 Monitor Razorpay webhook failures
- 🚨 Enable alerts for failed or suspicious payments
- 🗄 Regular database backups

---

## ❗ Troubleshooting

Common issues and resolutions:

- **Invalid amount**  
  Razorpay enforces a minimum transaction limit.

- **Webhook not firing**  
  Verify webhook URL, dashboard configuration, and secret.

- **Email not sending**  
  Check SMTP credentials and sender configuration.

- **Admin login issues**  
  Clear browser cookies and re-login.

---

## 🛣 Roadmap

Planned future enhancements:

- 👥 Multi-admin RBAC (Role-Based Access Control)
- 🎉 Event-based and campaign-specific donations
- 🌍 Internationalization (i18n)
- 🧾 Advanced audit logs
- 🙏 Donor history & self-service portal

---

## 🤝 Contributing

Contributions are welcome and appreciated.

1. Fork the repository
2. Create a new feature branch
3. Commit changes with clear, descriptive messages
4. Open a pull request for review

---

## 📄 License & Contact

This project is licensed under the **MIT License**.

### Contact
- 📧 Email: **bardhamanbhaktasanmilani@gmail.com**
- 🌐 Website: **https://bhaktasanmilani.org**

## 🙏 Acknowledgements

- Devotees and community supporters
- Razorpay for secure payment infrastructure
- Open-source contributors and tools

BhaktaSanmilani — Built with devotion, discipline, and modern engineering.

