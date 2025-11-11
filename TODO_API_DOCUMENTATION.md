# TODO API Documentation

## Overview
The TODO API allows users to create and manage hierarchical todo items (mind map style). Each user has their own private list of todos that can be nested infinitely.

## Base URL
All endpoints are prefixed with `/api/todos`

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Data Structure
The API returns todos in a tree structure with the following format:

```json
{
  "title": "Todo title",
  "completed": false,
  "completedItems": 2,
  "totalItems": 5,
  "subtasks": [
    {
      "title": "Subtask 1",
      "completed": true,
      "completedItems": 0,
      "totalItems": 1,
      "subtasks": []
    }
  ]
}
```

## Endpoints

### 1. Create a Single Todo
**POST** `/api/todos`

Creates a new todo item. Can be a root todo or a child of an existing todo.

**Request Body:**
```json
{
  "title": "Nấu cơm",
  "parent_id": null,  // null for root todo, or UUID of parent todo
  "completed": false  // optional, defaults to false
}
```

**Response:**
```json
{
  "message": "Todo created successfully",
  "data": {
    "id": "uuid",
    "title": "Nấu cơm",
    "completed": false,
    "parent_id": null,
    "user_id": "user-uuid",
    "order": 1,
    "createdAt": "2025-01-11T10:00:00Z",
    "updatedAt": "2025-01-11T10:00:00Z"
  }
}
```

### 2. Create Multiple Todos (Batch)
**POST** `/api/todos/batch`

Creates multiple todos with the same parent. Useful for creating a list of subtasks at once.

**Request Body:**
```json
{
  "parent_id": "parent-uuid",  // optional, null for root todos
  "todos": [
    {
      "title": "Xác định điểm đi và điểm đến",
      "completed": false
    },
    {
      "title": "Chọn loại phương tiện (tàu/xe/máy bay)",
      "completed": false
    },
    {
      "title": "Chọn ngày đi và ngày về",
      "completed": false
    }
  ]
}
```

**Response:**
```json
{
  "message": "Todos created successfully",
  "data": [
    {
      "id": "uuid-1",
      "title": "Xác định điểm đi và điểm đến",
      "completed": false,
      "parent_id": "parent-uuid",
      "user_id": "user-uuid",
      "order": 1,
      "createdAt": "2025-01-11T10:00:00Z",
      "updatedAt": "2025-01-11T10:00:00Z"
    },
    // ... more todos
  ]
}
```

### 3. Get All Todos (Tree Structure)
**GET** `/api/todos`

Retrieves all todos for the authenticated user in a hierarchical tree structure with calculated statistics.

**Response:**
```json
{
  "message": "Todos retrieved successfully",
  "data": [
    {
      "id": "uuid-1",
      "title": "Nấu cơm",
      "completed": false,
      "completedItems": 0,
      "totalItems": 11,
      "subtasks": [],
      "order": 1,
      "createdAt": "2025-01-11T10:00:00Z",
      "updatedAt": "2025-01-11T10:00:00Z"
    },
    {
      "id": "uuid-2",
      "title": "Đi chơi Huế",
      "completed": false,
      "completedItems": 0,
      "totalItems": 16,
      "subtasks": [
        {
          "id": "uuid-3",
          "title": "Lên kế hoạch (thời gian, ngân sách, lịch trình)",
          "completed": false,
          "completedItems": 0,
          "totalItems": 1,
          "subtasks": []
        },
        {
          "id": "uuid-4",
          "title": "Đặt vé (tàu/xe/máy bay, khách sạn)",
          "completed": false,
          "completedItems": 0,
          "totalItems": 8,
          "subtasks": [
            {
              "id": "uuid-5",
              "title": "Xác định điểm đi và điểm đến",
              "completed": false,
              "completedItems": 0,
              "totalItems": 1,
              "subtasks": []
            }
          ]
        }
      ]
    }
  ]
}
```

### 4. Get Single Todo by ID
**GET** `/api/todos/:id`

Retrieves a specific todo with its direct subtasks.

**Response:**
```json
{
  "message": "Todo retrieved successfully",
  "data": {
    "id": "uuid",
    "title": "Đặt vé",
    "completed": false,
    "parent_id": "parent-uuid",
    "user_id": "user-uuid",
    "order": 2,
    "createdAt": "2025-01-11T10:00:00Z",
    "updatedAt": "2025-01-11T10:00:00Z",
    "subtasks": [
      {
        "id": "subtask-uuid",
        "title": "Xác định điểm đi",
        "completed": false,
        "parent_id": "uuid",
        "order": 1
      }
    ]
  }
}
```

### 5. Update Todo
**PUT** `/api/todos/:id`

Updates a todo's properties (title, completed status, or parent).

**Request Body:**
```json
{
  "title": "Updated title",      // optional
  "completed": true,             // optional
  "parent_id": "new-parent-uuid" // optional
}
```

**Response:**
```json
{
  "message": "Todo updated successfully",
  "data": {
    "id": "uuid",
    "title": "Updated title",
    "completed": true,
    "parent_id": "new-parent-uuid",
    "user_id": "user-uuid",
    "order": 1,
    "createdAt": "2025-01-11T10:00:00Z",
    "updatedAt": "2025-01-11T10:30:00Z"
  }
}
```

### 6. Toggle Todo Completed Status
**PATCH** `/api/todos/:id/toggle`

Quickly toggles a todo's completed status without needing to send the full update payload.

**Response:**
```json
{
  "message": "Todo toggled successfully",
  "data": {
    "id": "uuid",
    "title": "Todo title",
    "completed": true,
    "parent_id": null,
    "user_id": "user-uuid",
    "order": 1,
    "createdAt": "2025-01-11T10:00:00Z",
    "updatedAt": "2025-01-11T10:31:00Z"
  }
}
```

### 7. Delete Todo
**DELETE** `/api/todos/:id`

Deletes a todo and all its descendants (cascade delete).

**Response:**
```json
{
  "message": "Todo deleted successfully"
}
```

## Example Usage Scenarios

### Scenario 1: Creating a Simple Root Todo
```bash
POST /api/todos
{
  "title": "Nấu cơm"
}
```

### Scenario 2: Creating a Todo with Subtasks
```bash
# Step 1: Create parent todo
POST /api/todos
{
  "title": "Đi chơi Huế"
}
# Returns: { "data": { "id": "parent-uuid", ... } }

# Step 2: Create subtasks in batch
POST /api/todos/batch
{
  "parent_id": "parent-uuid",
  "todos": [
    { "title": "Lên kế hoạch" },
    { "title": "Đặt vé" },
    { "title": "Chuẩn bị hành lý" }
  ]
}
```

### Scenario 3: Creating Deep Nested Structure
```bash
# Create root
POST /api/todos
{ "title": "Đi chơi Huế" }
# Returns id: "root-id"

# Create level 1
POST /api/todos
{ "title": "Đặt vé", "parent_id": "root-id" }
# Returns id: "level1-id"

# Create level 2 in batch
POST /api/todos/batch
{
  "parent_id": "level1-id",
  "todos": [
    { "title": "Xác định điểm đi và điểm đến" },
    { "title": "Chọn loại phương tiện" },
    { "title": "Chọn ngày đi và về" }
  ]
}
```

## Features

1. **Hierarchical Structure**: Unlimited nesting levels
2. **Cascade Delete**: Deleting a parent automatically deletes all children
3. **Automatic Statistics**: `completedItems` and `totalItems` calculated recursively
4. **User Isolation**: Each user can only access their own todos
5. **Ordering**: Todos maintain their creation order within each level
6. **Batch Creation**: Create multiple todos at once for efficiency

## Error Responses

### 400 Bad Request
```json
{
  "message": "Title is required"
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "message": "Todo not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

