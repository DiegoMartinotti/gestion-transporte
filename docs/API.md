# API Documentation

## Overview
This API provides endpoints for managing transportation routes, clients, sites, and trips. It's built with Express.js and uses MongoDB as its database.

## Authentication
The API uses JWT (JSON Web Token) for authentication. All protected endpoints require a Bearer token in the Authorization header.

## Getting Started

### Prerequisites
- Node.js v14 or higher
- MongoDB v4.4 or higher
- npm or yarn package manager

### Environment Variables
```
MONGODB_URI=mongodb://localhost:27017/your-database
JWT_SECRET=your-secret-key
PORT=5000
```

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start the server: `npm start`

## API Base URL
Development: `http://localhost:5000/api`

## Interactive Documentation
Access the interactive Swagger documentation at `/api-docs` when the server is running.

## Rate Limiting
The API implements rate limiting to prevent abuse:
- 100 requests per 15 minutes for public endpoints
- 1000 requests per 15 minutes for authenticated endpoints

## Error Handling
All errors follow a consistent format:
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```