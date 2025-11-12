# Healthy Food Ratio API Documentation

## Overview
This API allows users to submit their plant-based meal data, which is then sent to an external AI service to calculate personality trait adjustments based on the Big Five (OCEAN) model.

## Endpoints

### 1. Create/Update Healthy Food Ratio
**POST** `/api/healthy-food-ratio`

Submit plant-based meal data and receive updated OCEAN scores.

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "plant_meals": 7,
  "total_meals": 10
}
```

**Response (200 OK):**
```json
{
  "metric": "healthy_food_ratio",
  "vt": 0.7,
  "bt": 0.75,
  "r": -0.25131442066185883,
  "n": 0.43750000187499993,
  "contrib": -0.031249999062500033,
  "new_ocean_score": {
    "O": 0.48437500046875,
    "C": 0.595312500140625,
    "E": 0.4,
    "A": 0.7,
    "N": 0.3
  }
}
```

**Process Flow:**
1. User submits plant_meals and total_meals
2. System retrieves user's current OCEAN scores from big_five table
3. System combines data with hardcoded parameters (base_likert: 4, weight: 0.25, direction: "up", sigma_r: 1.0, alpha: 0.5)
4. Request is sent to external AI API: `https://ai-greenmind.khoav4.com/healthy_food_ratio`
5. System updates big_five table with new OCEAN scores
6. System saves metrics data
7. Returns response to client

**Error Responses:**
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - User or Big Five scores not found
- `502 Bad Gateway` - Error communicating with AI service
- `500 Internal Server Error` - Server error

---

### 2. Get Healthy Food Ratio
**GET** `/api/healthy-food-ratio`

Retrieve the current user's healthy food ratio data.

**Authentication:** Required (JWT)

**Response (200 OK):**
```json
{
  "message": "Healthy food ratio retrieved successfully",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "plantMeals": 7,
    "totalMeals": 10,
    "baseLikert": 4,
    "weight": 0.25,
    "direction": "up",
    "sigmaR": 1.0,
    "alpha": 0.5,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### 3. Get All Metrics
**GET** `/api/healthy-food-ratio/metrics`

Retrieve all metrics history for the current user.

**Authentication:** Required (JWT)

**Response (200 OK):**
```json
{
  "message": "Metrics retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "metric": "healthy_food_ratio",
      "vt": 0.7,
      "bt": 0.75,
      "r": -0.25131442066185883,
      "n": 0.43750000187499993,
      "contrib": -0.031249999062500033,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 4. Get Latest Metric
**GET** `/api/healthy-food-ratio/metrics/latest`

Retrieve the most recent metric for the current user.

**Authentication:** Required (JWT)

**Response (200 OK):**
```json
{
  "message": "Latest metric retrieved successfully",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "metric": "healthy_food_ratio",
    "vt": 0.7,
    "bt": 0.75,
    "r": -0.25131442066185883,
    "n": 0.43750000187499993,
    "contrib": -0.031249999062500033,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

---

## Database Tables

### healthy_food_ratio
Stores user's healthy food ratio data with hardcoded parameters.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | uuid | auto | Primary key |
| userId | uuid | - | Foreign key to users table |
| plantMeals | integer | - | Number of plant-based meals |
| totalMeals | integer | - | Total number of meals |
| baseLikert | integer | 4 | Base Likert scale value |
| weight | double precision | 0.25 | Weight parameter |
| direction | varchar(10) | "up" | Direction parameter |
| sigmaR | double precision | 1.0 | Sigma R parameter |
| alpha | double precision | 0.5 | Alpha parameter |
| createdAt | timestamp | now() | Creation timestamp |
| updatedAt | timestamp | now() | Last update timestamp |

### metrics
Stores the calculated metrics returned from the AI service.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| userId | uuid | Foreign key to users table |
| metric | varchar(100) | Metric name (e.g., "healthy_food_ratio") |
| vt | double precision | VT value from AI |
| bt | double precision | BT value from AI |
| r | double precision | R value from AI |
| n | double precision | N value from AI |
| contrib | double precision | Contribution value from AI |
| createdAt | timestamp | Creation timestamp |
| updatedAt | timestamp | Last update timestamp |

---

## External AI Service

**Endpoint:** `https://ai-greenmind.khoav4.com/healthy_food_ratio`

**Method:** POST

**Request Format:**
```json
{
  "plant_meals": 7,
  "total_meals": 10,
  "base_likert": 4,
  "weight": 0.25,
  "direction": "up",
  "sigma_r": 1.0,
  "alpha": 0.5,
  "ocean_score": {
    "O": 0.5,
    "C": 0.6,
    "E": 0.4,
    "A": 0.7,
    "N": 0.3
  }
}
```

**Response Format:**
```json
{
  "metric": "healthy_food_ratio",
  "vt": 0.7,
  "bt": 0.75,
  "r": -0.25131442066185883,
  "n": 0.43750000187499993,
  "contrib": -0.031249999062500033,
  "new_ocean_score": {
    "O": 0.48437500046875,
    "C": 0.595312500140625,
    "E": 0.4,
    "A": 0.7,
    "N": 0.3
  }
}
```

---

## Notes
- The parameters (base_likert, weight, direction, sigma_r, alpha) are currently hardcoded with default values
- Each user can only have one healthy_food_ratio record (automatically updated on subsequent requests)
- Multiple metrics records are created for each calculation (full history)
- The Big Five scores are automatically updated after each successful AI service call

