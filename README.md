# NOBITOS APP — Phase 1 Backend
**Express.js + TypeScript API**

Express.js + Node.js backend for Nobitos App Phase 1 MVP.

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase project with Phase 1 database schema

### Installation

```bash
# Install dependencies
npm install

# Create .env file from template
cp .env.example .env.local

# Update .env.local with your Supabase credentials
# DB_HOST, DB_PASSWORD, and JWT_SECRET are required
```

### Development

```bash
# Start development server with auto-reload
npm run dev

# Server runs on http://localhost:5000
# API base URL: http://localhost:5000/api/v1
# Health check: http://localhost:5000/api/v1/health
```

### Production Build

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── index.ts                    # Main Express app
├── config/
│   ├── database.ts            # Supabase connection
│   ├── jwt.ts                 # JWT handling
│   └── env.ts                 # Environment validation
├── middleware/
│   ├── auth.ts                # JWT authentication
│   ├── rbac.ts                # Role-based access control
│   ├── errorHandler.ts        # Error handling
│   └── auditLog.ts            # Audit logging
├── controllers/
│   ├── authController.ts      # Auth endpoints
│   ├── poController.ts        # Purchase order endpoints
│   ├── stockController.ts     # Stock endpoints
│   └── handoverController.ts  # Handover endpoints
├── services/
│   ├── authService.ts         # Auth business logic
│   ├── poService.ts           # PO business logic
│   └── stockService.ts        # Stock business logic
├── routes/
│   ├── auth.ts                # Auth routes
│   ├── index.ts               # Route aggregator
│   └── other routes
└── types/
    └── index.ts               # TypeScript interfaces
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` — Create new user
- `POST /api/v1/auth/login` — Login and get JWT token
- `POST /api/v1/auth/logout` — Logout (requires auth)

### Health Check
- `GET /api/v1/health` — Server status

### Other Endpoints (Phase 1)
- `POST /api/v1/purchase-orders` — Create PO
- `GET /api/v1/purchase-orders` — List POs
- `PUT /api/v1/purchase-orders/:id/confirm` — Confirm PO
- `GET /api/v1/stock/current` — Current stock levels
- `GET /api/v1/stock/history` — Stock history
- `POST /api/v1/handovers` — Create handover
- `POST /api/v1/handovers/:id/verify-pin` — Verify PIN

See `BACKEND_API_SPECIFICATION.md` for complete endpoint details.

## Authentication

All protected endpoints require JWT Bearer token in Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# Type checking
npm run type-check
```

## Deployment

### To Sumopod VPS

See `DEPLOYMENT.md` for step-by-step VPS deployment guide.

Quick summary:
1. Clone repo to VPS
2. Install dependencies: `npm install`
3. Create `.env` with production credentials
4. Build: `npm run build`
5. Start with PM2: `pm2 start dist/index.js --name "nobitos-backend"`

### Docker

```bash
# Build Docker image
docker build -t nobitos-backend .

# Run container
docker run -p 5000:5000 --env-file .env nobitos-backend
```

## Configuration

All configuration is via environment variables (.env file). See `.env.example` for template.

### Required Variables
- `DB_HOST` — Supabase database host
- `DB_PASSWORD` — Supabase database password
- `JWT_SECRET` — Secret key for JWT signing

### Optional Variables
- `PORT` — Server port (default: 5000)
- `NODE_ENV` — Environment (development/production)
- `CORS_ORIGIN` — CORS allowed origins
- `JWT_EXPIRY` — JWT token expiry time (default: 24h)

## Error Handling

All errors return standardized JSON response:

```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Human readable error message",
  "details": {}
}
```

## Logging

- Request/response logging via middleware
- Audit logs stored in `audit_logs` table
- Error logs printed to console and file (future enhancement)

## Database

Backend connects to Supabase PostgreSQL with 12 tables:
- users
- organizations
- items
- suppliers
- purchase_orders
- po_items
- stock_ledger
- current_stock
- delivery_orders
- delivery_items
- handover_pins
- audit_logs

All write operations logged to `audit_logs` (append-only).

## Support

For issues or questions:
1. Check `BACKEND_API_SPECIFICATION.md` for API details
2. Check error logs and audit_logs table
3. Verify .env configuration
4. Check database connectivity

## License

MIT
