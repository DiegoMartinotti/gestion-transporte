# API Endpoints Documentation

## Authentication Endpoints

### POST /api/auth/login
- Login with username and password
- Returns JWT token
- Rate limit: 5 requests per minute

### POST /api/auth/refresh
- Refresh expired JWT token
- Requires valid refresh token

## Client Endpoints

### GET /api/clientes
- List all clients
- Supports pagination and filters
- Query parameters:
  - page: Page number
  - limit: Items per page
  - activo: Filter by active status

### POST /api/clientes
- Create new client
- Required fields: nombre, codigo
- Validates unique codigo

### GET /api/clientes/:id
- Get client details
- Includes associated tramos

## Tramo Endpoints

### GET /api/tramos
- List all tramos
- Supports:
  - Pagination
  - Filtering by cliente, tipo
  - Date range filtering for vigencia

### POST /api/tramos
- Create new tramo
- Validates:
  - Site existence
  - Date conflicts
  - Client existence

### PUT /api/tramos/:id
- Update tramo
- Partial updates supported
- Validates date conflicts

### POST /api/tramos/updateVigenciaMasiva
- Bulk update tramo dates
- Validates conflicts
- Returns success/conflict list

## Site Endpoints

### GET /api/sites
- List all sites
- Supports location-based queries
- Query parameters:
  - lat: Latitude for proximity search
  - lng: Longitude for proximity search
  - radius: Search radius in km

### POST /api/sites/bulk
- Bulk import sites
- Supports CSV format
- Validates duplicates

## Error Responses
All endpoints may return:
- 400: Bad Request - Invalid input
- 401: Unauthorized - Invalid/missing token
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Resource doesn't exist
- 409: Conflict - Resource conflict
- 429: Too Many Requests - Rate limit exceeded
- 500: Internal Server Error