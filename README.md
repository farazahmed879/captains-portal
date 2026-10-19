# 🏆 Captains Portal - Sports Pro Management System

A production-ready sports team, player ledger, tournament ROI, and financial tracking platform built for team captains.

---

## 🛠 Tech Stack

* **Backend**: Node.js + Express.js + TypeScript
* **Database**: MongoDB (Atlas / Local) with Mongoose ODM
* **Frontend**: Next.js 14 (App Router) + TypeScript + Vanilla CSS Design System (Luxury Dark Sports Theme)
* **Architecture**: Normalized Relational Document Model, Code-First, Multi-Tenant Ready, Component-Based

---

## 📊 Normalized Database Architecture (Replaces Spreadsheet)

| Collection | Responsibility & Fields |
| :--- | :--- |
| **`tenants`** | Multi-tenant organization container (`name`, `slug`, `isActive`). |
| **`users`** | Super Admin & Captains with bcrypt authentication & JWT tokens. |
| **`teams`** | Multiple teams under one captain (e.g. *Shaheen Warriors XI* - Hard Ball & *Karachi Night Kingsmen* - Tape Ball). |
| **`players`** | Player profiles (roles, batting & bowling styles, jersey numbers, WhatsApp numbers, active teams). |
| **`tournaments`** | **First-Class Entity**: Entry fees invested, expected prize, actual prize won, format, dedicated sponsors, net tournament ROI. |
| **`matches`** | Friendly vs Tournament stage matches, detailed costs (ground rent, balls, umpires, refreshments), squad list, result, MOM awards. |
| **`matchpayments`** | Per-player ledger: assigned match fee, paid amount, status (`paid`, `partial`, `pending`), payment method (Cash, Easypaisa, Jazzcash, Bank), date. |
| **`expenses`** | Team expenditures with date-stamps (kit bags, balls, jerseys printing, transport, tournament fees). |
| **`sponsors`** | Brand sponsors & grants: contract types (jersey front/back/sleeves, banners), deliverables agreed, prize-share returns paid back. |

---

## 🚀 Quick Setup Instructions

### 1. Configure MongoDB Password
Open [backend/.env](file:///d:/Captains%20Portal/backend/.env) and replace `<YOUR_PASSWORD>` with your MongoDB Atlas password:
```env
PORT=5000
MONGODB_URI=mongodb+srv://farazahmedshaikh879_db_user:<YOUR_PASSWORD>@cluster0.pxvrnbb.mongodb.net/captains_portal?retryWrites=true&w=majority
JWT_SECRET=captains_portal_super_secret_jwt_key_2026
CLIENT_URL=http://localhost:3000
```

### 2. Seed Database with Initial Super Admin & Sample Cricket Data
Run the seed command:
```bash
npm run seed:backend
```
This populates:
- **Super Admin Account**: `admin@captainsportal.com` / `admin123`
- **2 Teams**: *Shaheen Warriors XI* (Hard Ball) & *Karachi Night Kingsmen* (Tape Ball)
- **12 Registered Players** with styles and jersey numbers
- **1 Tournament** (*Karachi Ramadan Night Cup 2026*) with Champions Trophy & Rs. 120,000 cash prize
- **Friendly & Tournament Matches** with ground costs, squad collections, and MOM awards
- **Team Expenditures & Sponsor Investments**

### 3. Start Backend & Frontend Dev Servers
In Terminal 1 (Backend):
```bash
npm run dev:backend
```
Backend runs on: `http://localhost:5000`

In Terminal 2 (Frontend):
```bash
npm run dev:frontend
```
Frontend runs on: `http://localhost:3000`
"# captains-portal" 
