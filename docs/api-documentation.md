# API Documentation - Try Out TKA13

## Base Information

- **Version:** 1.0.0
- **Base URL:** `http://localhost:3000/api`
- **Authentication:** JWT Bearer Token

## Authentication Endpoints

### POST /api/auth/login

Login user

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
