# API Usage Guide

Hướng dẫn sử dụng API - Chỉ bao gồm Endpoint, Request & Response templates.

---

## 📋 Mục lục

1. [User Answers API](#user-answers-api)
2. [Pre-App Survey API](#pre-app-survey-api)
3. [Location API](#location-api)
4. [Big Five (OCEAN) API](#big-five-ocean-api)

---

## User Answers API

Base URL: `/api/user-answers`

### 1. Get Answers by User ID

```
GET /api/user-answers/user/:userId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "answers": [
    {
      "trait": "O",
      "template_id": "T_FREQ_01",
      "intent": "frequency",
      "question": "Người có tính cách O, giới tính Nữ, độ tuổi 24...",
      "ans": "thường xuyên",
      "score": 4,
      "key": "pos",
      "kind": "frequency"
    }
  ]
}
```

---

### 2. Submit Answer

```
POST /api/user-answers/submit
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "answers": [
    {
      "questionId": "qa1b2c3d-4e5f-6g7h-8i9j-0k1l2m3n4o5p",
      "answer": "thường xuyên"
    },
    {
      "questionId": "qb2c3d4e-5f6g-7h8i-9j0k-1l2m3n4o5p6q",
      "answer": "Có"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Submit success",
  "totalAnswered": 2,
  "data": [
    {
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "questionId": "qa1b2c3d-4e5f-6g7h-8i9j-0k1l2m3n4o5p",
      "answer": "thường xuyên",
      "timestamp": "2025-11-10T10:30:00.000Z"
    }
  ]
}
```

---

## Pre-App Survey API

Base URL: `/api/pre-app-survey`

### 1. Submit Pre-App Survey

```
POST /api/pre-app-survey/submit
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "answers": {
    "daily_spending": "5000",
    "spending_variation": "2",
    "brand_trial": "3",
    "shopping_list": "3",
    "daily_distance": "10",
    "new_places": "3",
    "public_transport": "4",
    "stable_schedule": "2",
    "night_outings": "7",
    "healthy_eating": "3",
    "social_media": "2",
    "goal_setting": "4",
    "mood_swings": "4"
  },
  "isCompleted": true,
  "completedAt": "2025-11-10T11:23:59.748Z"
}
```

**Response:**
```json
{
  "message": "Pre-app survey saved successfully",
  "data": {
    "id": "abc123de-f456-7890-gh12-ijklmnopqrst",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "dailySpending": 5000,
    "spendingVariation": 2,
    "brandTrial": 3,
    "shoppingList": 3,
    "dailyDistance": 10,
    "newPlaces": 3,
    "publicTransport": 4,
    "stableSchedule": 2,
    "nightOutings": 7,
    "healthyEating": 3,
    "socialMedia": 2,
    "goalSetting": 4,
    "moodSwings": 4,
    "isCompleted": true,
    "completedAt": "2025-11-10T11:23:59.748Z"
  }
}
```

---

### 2. Get Pre-App Survey

```
GET /api/pre-app-survey/:userId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "abc123de-f456-7890-gh12-ijklmnopqrst",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "dailySpending": 5000,
  "spendingVariation": 2,
  "brandTrial": 3,
  "shoppingList": 3,
  "dailyDistance": 10,
  "newPlaces": 3,
  "publicTransport": 4,
  "stableSchedule": 2,
  "nightOutings": 7,
  "healthyEating": 3,
  "socialMedia": 2,
  "goalSetting": 4,
  "moodSwings": 4,
  "isCompleted": true,
  "completedAt": "2025-11-10T11:23:59.748Z"
}
```

---

### 3. Update Parameters

```
PUT /api/pre-app-survey/parameters
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "params": {
    "daily_spending": {
      "sigmoid": 0.5,
      "weight": 1.2,
      "direction": "positive",
      "alpha": 0.8
    },
    "spending_variation": {
      "sigmoid": 0.6,
      "weight": 1.0,
      "direction": "negative",
      "alpha": 0.7
    }
  }
}
```

**Response:**
```json
{
  "message": "Parameters updated successfully",
  "data": {
    "id": "abc123de-f456-7890-gh12-ijklmnopqrst",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "dailySpending": 5000,
    "dailySpendingSigmoid": 0.5,
    "dailySpendingWeight": 1.2,
    "dailySpendingDirection": "positive",
    "dailySpendingAlpha": 0.8,
    "spendingVariation": 2,
    "spendingVariationSigmoid": 0.6,
    "spendingVariationWeight": 1.0,
    "spendingVariationDirection": "negative",
    "spendingVariationAlpha": 0.7
  }
}
```

---

## Location API

Base URL: `/api/locations`

⚠️ **Chú ý:** `userId` được lấy từ JWT token, không cần truyền trong request body.

### 1. Create Location

```
POST /api/locations
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "latitude": 16.0544,
  "longitude": 108.2022,
  "address": "Da Nang, Vietnam"
}
```

**Response:**
```json
{
  "message": "Location saved successfully",
  "data": {
    "id": "loc123ab-cd45-ef67-89gh-ijklmnopqrst",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "latitude": 16.0544,
    "longitude": 108.2022,
    "address": "Da Nang, Vietnam",
    "createdAt": "2025-11-10T12:00:00.000Z",
    "updatedAt": "2025-11-10T12:00:00.000Z"
  }
}
```

---

### 2. Get All Locations

```
GET /api/locations
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Locations retrieved successfully",
  "data": [
    {
      "id": "loc123ab-cd45-ef67-89gh-ijklmnopqrst",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "latitude": 16.0544,
      "longitude": 108.2022,
      "address": "Da Nang, Vietnam",
      "createdAt": "2025-11-10T12:00:00.000Z"
    },
    {
      "id": "loc456cd-ef78-90ab-12cd-efghijklmnop",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "latitude": 21.0285,
      "longitude": 105.8542,
      "address": "Ha Noi, Vietnam",
      "createdAt": "2025-11-09T08:30:00.000Z"
    }
  ],
  "count": 2
}
```

---

### 3. Get Latest Location

```
GET /api/locations/latest
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Latest location retrieved successfully",
  "data": {
    "id": "loc123ab-cd45-ef67-89gh-ijklmnopqrst",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "latitude": 16.0544,
    "longitude": 108.2022,
    "address": "Da Nang, Vietnam",
    "createdAt": "2025-11-10T12:00:00.000Z"
  }
}
```

---

### 4. Update Location

```
PUT /api/locations/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "latitude": 16.0600,
  "longitude": 108.2100,
  "address": "Da Nang City, Vietnam"
}
```

**Response:**
```json
{
  "message": "Location updated successfully",
  "data": {
    "id": "loc123ab-cd45-ef67-89gh-ijklmnopqrst",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "latitude": 16.0600,
    "longitude": 108.2100,
    "address": "Da Nang City, Vietnam",
    "createdAt": "2025-11-10T12:00:00.000Z",
    "updatedAt": "2025-11-10T12:30:00.000Z"
  }
}
```

---

### 5. Delete Location

```
DELETE /api/locations/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Location deleted successfully",
  "data": {
    "id": "loc123ab-cd45-ef67-89gh-ijklmnopqrst",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "latitude": 16.0544,
    "longitude": 108.2022,
    "address": "Da Nang, Vietnam"
  }
}
```

---

## Big Five (OCEAN) API

Base URL: `/api/big-five`

⚠️ **Chú ý:** Scores được lưu dạng phần trăm (0-100) cho O, C, E, A, N.

### 1. Submit Big Five Scores

```
POST /api/big-five/submit
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "scores": {
    "O": 33.33,
    "C": 66.67,
    "E": 41.67,
    "A": 44.44,
    "N": 75.0
  }
}
```

**Response:**
```json
{
  "message": "Big Five scores saved successfully",
  "data": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "scores": {
      "O": 33.33,
      "C": 66.67,
      "E": 41.67,
      "A": 44.44,
      "N": 75.0
    }
  }
}
```

---

### 2. Get Big Five by User ID

```
GET /api/big-five/user/:userId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "scores": {
    "O": 33.33,
    "C": 66.67,
    "E": 41.67,
    "A": 44.44,
    "N": 75.0
  }
}
```

---

### 3. Update Big Five Scores

```
PUT /api/big-five/user/:userId
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "scores": {
    "O": 40.0,
    "E": 50.0
  }
}
```

**Response:**
```json
{
  "message": "Big Five scores updated successfully",
  "data": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "scores": {
      "O": 40.0,
      "C": 66.67,
      "E": 50.0,
      "A": 44.44,
      "N": 75.0
    }
  }
}
```

---

### 4. Delete Big Five Scores

```
DELETE /api/big-five/user/:userId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Big Five data deleted successfully",
  "data": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "scores": {
      "O": 33.33,
      "C": 66.67,
      "E": 41.67,
      "A": 44.44,
      "N": 75.0
    }
  }
}
```

---

### 5. Get All Big Five (Admin Only)

```
GET /api/big-five
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "All Big Five data retrieved successfully",
  "count": 2,
  "data": [
    {
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "username": "john_doe",
      "scores": {
        "O": 33.33,
        "C": 66.67,
        "E": 41.67,
        "A": 44.44,
        "N": 75.0
      },
      "createdAt": "2025-11-10T10:00:00.000Z",
      "updatedAt": "2025-11-10T10:00:00.000Z"
    }
  ]
}
```

---

## Authentication

### Login

```
POST /api/auth/login
Content-Type: application/json
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "john_doe",
    "email": "user@example.com"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

**Last Updated:** November 10, 2025
