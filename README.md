# Printix

Printix is a custom-printing storefront where customers can browse products, upload artwork, design printable areas, preview mockups, manage a cart, place orders, submit reviews, and track their orders. It also includes an admin dashboard for managing products, variants, inventory, orders, reviews, coupons, refunds, analytics, printable areas, and mockups.

## Tech Stack

- React 19 with Vite
- React Router
- Axios
- Konva and React Konva for the designer canvas
- Node.js with Express
- PostgreSQL
- Prisma ORM
- JWT authentication
- Optional Google authentication
- Optional PayMongo payments

## Requirements

Install these before running the project:

- Node.js 20 or newer
- npm
- PostgreSQL 14 or newer
- Git

## Clone the Repository

```bash
git clone https://github.com/R1-LEGENDARY/Printix.git
cd Printix
```

## Install Dependencies

Install the client dependencies:

```bash
cd client
npm install
```

Install the server dependencies:

```bash
cd ../server
npm install
```

## Configure the Server

Create `server/.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/printix?schema=public"
PORT=5000
JWT_SECRET="replace-with-a-long-random-secret"

# Optional Google authentication
GOOGLE_CLIENT_ID=""

# Optional email settings for password reset and notifications
SMTP_HOST=""
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""

# Optional PayMongo settings (test mode only)
PAYMONGO_SECRET_KEY=""
PAYMONGO_PUBLIC_KEY=""
PAYMONGO_WEBHOOK_SECRET=""
```

PayMongo is configured for test mode only in this project. Use PayMongo test keys and test payment methods while developing. Nothing done in this local application affects real customers, live orders, or real payments.

Create a PostgreSQL database named `printix`, or update `DATABASE_URL` to use an existing database.

## Set Up the Database

From the `server` directory:

```bash
npx prisma generate
npx prisma migrate deploy
npm run seed
```

For local development while creating schema changes, use:

```bash
npx prisma migrate dev
```

The seed creates a sample category, product, variants, and printable areas. Product images and mockup files can be uploaded from the admin product form.

## Run the Application

Open two terminals.

Terminal 1, start the API server:

```bash
cd server
npm run dev
```

The API runs at:

```text
http://localhost:5000
```

Terminal 2, start the client:

```bash
cd client
npm run dev
```

The client URL will be shown by Vite, normally:

```text
http://localhost:5173
```

## Client Environment Variables

Create `client/.env` only when optional integrations or a non-default API URL are needed:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SERVER_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=
```

Restart Vite after changing environment variables.

## Admin Access

The application requires a user with the `admin` role to access `/admin` routes.

### Promote a registered user

1. Register the user normally at `/register`.
2. From the `server` directory, open Prisma Studio:

   ```bash
   npx prisma studio
   ```

3. Open the `users` table.
4. Find the registered user by email.
5. Change the `role` value from `customer` to `admin`.
6. Save the record and log in again.
7. Open `/admin`.

### Promote a user with SQL

Run this in the `printix` PostgreSQL database, replacing the email address:

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'user@example.com';
```

The user can then log in with the password they used during registration and open `/admin`.

## Main Routes

### Customer routes

- `/` - Home
- `/register` - Create an account
- `/login` - Sign in
- `/catalog` - Browse products
- `/products/:slug` - Product details
- `/design/:slug` - Product designer
- `/cart` - Shopping cart
- `/checkout` - Checkout
- `/orders` - Order history
- `/orders/:id` - Order confirmation/details
- `/wishlist` - Wishlist
- `/profile` - Profile and addresses

### Admin routes

- `/admin` - Dashboard
- `/admin/products` - Product management
- `/admin/products/new` - Create a product
- `/admin/products/:id` - Edit a product
- `/admin/categories` - Category management
- `/admin/orders` - Order management
- `/admin/orders/:id` - Order details and status
- `/admin/reviews` - Review moderation
- `/admin/coupons` - Coupon management
- `/admin/refunds` - Refund management
- `/admin/analytics` - Sales analytics

## Troubleshooting

### The client cannot reach the API

- Confirm the server is running on port `5000`.
- Check `VITE_API_URL` in `client/.env`.
- Restart the Vite dev server after changing environment variables.

### Prisma cannot connect

- Confirm PostgreSQL is running.
- Confirm the database `printix` exists.
- Check the username, password, port, and database name in `DATABASE_URL`.
- Run `npx prisma generate` and `npx prisma migrate deploy` again.

### Google login is unavailable

Google login requires a configured `GOOGLE_CLIENT_ID` in both the server and client environments. It is optional; email/password authentication works without it.

### Payment is unavailable

Payment integration requires valid PayMongo test credentials and webhook configuration. This project is intended for testing only: use test keys and test payment methods. Nothing done here affects real customers or live payments. The rest of the local storefront can be tested without PayMongo credentials.
