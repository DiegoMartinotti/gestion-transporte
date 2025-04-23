# Architecture Documentation

## System Overview
The application follows a client-server architecture with:
- Frontend: React-based SPA with Material-UI
- Backend: Express.js REST API
- Database: MongoDB

## Directory Structure
```
├── backend/               # Express.js backend
│   ├── controllers/      # Route controllers
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── services/        # Business logic
│   └── utils/           # Helper functions
└── docs/                # Documentation
```

## Key Technologies
- Backend:
  - Node.js & Express
  - MongoDB & Mongoose
  - JWT Authentication
  - Express-rate-limit
  - Swagger/OpenAPI


## Security Measures
1. JWT-based authentication
2. Rate limiting
3. Input validation
4. CORS configuration
5. Helmet security headers

## Data Flow
1. Client makes authenticated request
2. Request passes through middleware (auth, rate limiting)
3. Controller handles request
4. Service layer processes business logic
5. MongoDB operations via Mongoose
6. Response formatted and sent back

## Error Handling
Centralized error handling through middleware with standardized error responses.