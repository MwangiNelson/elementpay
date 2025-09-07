# ElementPay - Crypto Payment Gateway

A Next.js application that allows users to connect their wallets and create crypto payment orders with real-time status tracking via polling and webhooks.

## Features

- **Multi-wallet support**: Connect MetaMask, WalletConnect, and other popular wallets
- **Order management**: Create and track crypto payment orders
- **Real-time updates**: Order status updates via polling and webhook notifications
- **Race condition handling**: First finalizer (polling/webhook) wins, duplicates ignored
- **Timeout handling**: 60-second timeout with retry functionality
- **Modern UI**: Beautiful, responsive design with dark mode support

## Tech Stack

- **Framework**: Next.js 14+ (App Router) with TypeScript
- **Wallet Integration**: wagmi/viem, RainbowKit
- **Styling**: Tailwind CSS
- **State Management**: React hooks with proper cleanup

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/MwangiNelson/elementpay.git
cd elementpay
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

The `.env.local` file should contain:
```
WEBHOOK_SECRET=shh_super_secret
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### Create Order
**POST** `/api/mock/orders/create`

Creates a new payment order.

**Request body:**
```json
{
  "amount": 1500,
  "currency": "KES",
  "token": "USDC",
  "note": "optional"
}
```

**Response:**
```json
{
  "order_id": "ord_0xabc123",
  "status": "created",
  "amount": 1500,
  "currency": "KES",
  "token": "USDC",
  "created_at": "2025-09-02T10:00:00Z"
}
```

### Get Order Status
**GET** `/api/mock/orders/:order_id`

Returns order with time-based status progression:
- 0–7s → `created`
- 8–17s → `processing`
- ≥18s → `settled` (80%) or `failed` (20%)

**Response:**
```json
{
  "order_id": "ord_0xabc123",
  "status": "processing",
  "amount": 1500,
  "currency": "KES",
  "token": "USDC",
  "created_at": "2025-09-02T10:00:00Z"
}
```

**Error (404):**
```json
{
  "error": "order_not_found",
  "message": "No order with id ord_..."
}
```

### Webhook Endpoint
**POST** `/api/webhooks/elementpay`

Receives webhook notifications with signature verification.

**Headers:**
- `X-Webhook-Signature`: `t=<unix_ts>,v1=<base64sig>`
- `Content-Type`: `application/json`

**Verification:**
- Compute `mac = base64(HMAC_SHA256(SECRET, "{t}.{raw_body}"))`
- Compare with `v1` using constant-time comparison
- Reject if `|now - t| > 300s` (5 minutes)

## Testing Webhooks

### Valid Webhook (should return 2xx):
```bash
curl -X POST http://localhost:3000/api/webhooks/elementpay \
  -H 'Content-Type: application/json' \
  -H 'X-Webhook-Signature: t=1710000000,v1=3QXTcQv0m0h4QkQ0L0w9ZsH1YFhZgMGnF0d9Xz4P7nQ=' \
  -d '{"type":"order.settled","data":{"order_id":"ord_0xabc123","status":"settled"}}'
```

### Invalid Signature (should return 401/403):
```bash
curl -X POST http://localhost:3000/api/webhooks/elementpay \
  -H 'Content-Type: application/json' \
  -H 'X-Webhook-Signature: t=1710000300,v1=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=' \
  -d '{"type":"order.failed","data":{"order_id":"ord_0xabc123","status":"failed"}}'
```

### Expired Signature (should return 403):
```bash
curl -X POST http://localhost:3000/api/webhooks/elementpay \
  -H 'Content-Type: application/json' \
  -H 'X-Webhook-Signature: t=1709990000,v1=3QXTcQv0m0h4QkQ0L0w9ZsH1YFhZgMGnF0d9Xz4P7nQ=' \
  -d '{"type":"order.processing","data":{"order_id":"ord_0xabc123","status":"processing"}}'
```

## Application Flow

1. **Home Page**: Navigation to wallet and orders pages
2. **Wallet Page**: Connect/disconnect wallet with MetaMask and WalletConnect support
3. **Orders Page**: 
   - Form validation (amount > 0, required fields)
   - Order creation with immediate processing modal
   - Real-time status polling every 3 seconds
   - Webhook listener for instant updates
   - Race condition handling (first finalizer wins)
   - 60-second timeout with retry option
   - Receipt card with final status

## Architecture Notes

### Order Status Flow
- Orders start as `created` and progress through `processing` to `settled`/`failed`
- Status determined by time elapsed since creation
- Polling and webhooks compete to update UI first
- Background processes stopped after finalization

### Race Condition Handling
- First final state (`settled`/`failed`) is authoritative
- Subsequent updates for same order are ignored
- All background processes (polling, webhooks) stopped after finalization

### Error Handling
- Form validation with inline error messages
- API error handling with user-friendly messages
- Timeout handling with retry functionality
- Graceful fallbacks for wallet connection issues

### Security
- Webhook signature verification using HMAC-SHA256
- Constant-time signature comparison
- Timestamp validation for replay attack prevention
- Raw body verification as required by spec

## Environment Variables

Create a `.env.local` file with:

```bash
WEBHOOK_SECRET=shh_super_secret
```

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   │   ├── mock/orders/   # Order management endpoints
│   │   └── webhooks/      # Webhook endpoint
│   ├── orders/            # Orders page
│   ├── wallet/            # Wallet connection page
│   └── providers.tsx      # Wallet providers setup
├── lib/                   # Shared utilities
│   ├── storage.ts         # In-memory order storage
│   └── wagmi.ts          # Wallet configuration
└── types/                 # TypeScript type definitions
    └── index.ts
```

## Assumptions

1. **In-memory storage**: Orders stored in memory (no database required)
2. **Mock webhooks**: Webhook verification implemented but no actual webhook delivery
3. **Simplified wallet**: No actual blockchain transactions, just connection demo
4. **Development environment**: Optimized for local development and testing

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

## License

MIT