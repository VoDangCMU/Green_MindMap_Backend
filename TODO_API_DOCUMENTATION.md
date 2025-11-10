# TODO API Documentation

## Overview
API để quản lý danh sách công việc (TODO list) theo dạng cây phân cấp. Mỗi user có danh sách todo riêng.

## Base URL
```
/api/todos
```

## Authentication
Tất cả các endpoint đều yêu cầu JWT token trong header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Tạo một TODO đơn lẻ
**POST** `/api/todos`

Tạo một todo item, có thể là node gốc hoặc node con.

**Request Body:**
```json
{
  "title": "Nấu cơm",
  "parent_id": null,  // null nếu là node gốc, hoặc UUID của parent
  "completed": false  // optional, mặc định là false
}
```

**Response (201):**
```json
{
  "message": "Todo created successfully",
  "data": {
    "id": "uuid",
    "title": "Nấu cơm",
    "completed": false,
    "parent_id": null,
    "user_id": "uuid",
    "order": 1,
    "createdAt": "2025-11-10T10:00:00.000Z",
    "updatedAt": "2025-11-10T10:00:00.000Z"
  }
}
```

---

### 2. Tạo nhiều TODO cùng lúc
**POST** `/api/todos/batch`

Tạo nhiều todo items cùng một parent. Hữu ích khi tạo nhiều subtasks cho một todo.

**Request Body:**
```json
{
  "parent_id": "uuid-of-parent",  // optional, null nếu tạo nhiều root todos
  "todos": [
    {
      "title": "Xác định điểm đi và điểm đến",
      "completed": false,
      "parent_id": null  // optional, override parent_id ở ngoài
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

**Response (201):**
```json
{
  "message": "Todos created successfully",
  "data": [
    {
      "id": "uuid-1",
      "title": "Xác định điểm đi và điểm đến",
      "completed": false,
      "parent_id": "uuid-of-parent",
      "user_id": "uuid",
      "order": 1,
      "createdAt": "2025-11-10T10:00:00.000Z",
      "updatedAt": "2025-11-10T10:00:00.000Z"
    },
    // ... more todos
  ]
}
```

---

### 3. Lấy danh sách TODO (dạng cây)
**GET** `/api/todos`

Lấy toàn bộ todos của user theo cấu trúc cây phân cấp, tự động tính toán completedItems và totalItems.

**Response (200):**
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
      "subtasks": [
        {
          "id": "uuid-2",
          "title": "Mua gạo",
          "completed": false,
          "completedItems": 0,
          "totalItems": 1,
          "subtasks": []
        }
      ],
      "parent_id": null,
      "order": 1,
      "createdAt": "2025-11-10T10:00:00.000Z",
      "updatedAt": "2025-11-10T10:00:00.000Z"
    },
    {
      "id": "uuid-3",
      "title": "Đi chơi Huế",
      "completed": false,
      "completedItems": 0,
      "totalItems": 16,
      "subtasks": [
        {
          "id": "uuid-4",
          "title": "Lên kế hoạch",
          "completed": false,
          "completedItems": 0,
          "totalItems": 1,
          "subtasks": []
        },
        {
          "id": "uuid-5",
          "title": "Đặt vé",
          "completed": false,
          "completedItems": 0,
          "totalItems": 8,
          "subtasks": [
            {
              "id": "uuid-6",
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

---

### 4. Lấy một TODO theo ID
**GET** `/api/todos/:id`

Lấy thông tin chi tiết của một todo và các subtasks trực tiếp (không đệ quy).

**Response (200):**
```json
{
  "message": "Todo retrieved successfully",
  "data": {
    "id": "uuid",
    "title": "Đặt vé",
    "completed": false,
    "parent_id": "uuid-parent",
    "user_id": "uuid",
    "order": 2,
    "createdAt": "2025-11-10T10:00:00.000Z",
    "updatedAt": "2025-11-10T10:00:00.000Z",
    "subtasks": [
      {
        "id": "uuid-child",
        "title": "Chọn ngày đi",
        "completed": false,
        "parent_id": "uuid",
        "user_id": "uuid",
        "order": 1
      }
    ]
  }
}
```

---

### 5. Cập nhật TODO
**PUT** `/api/todos/:id`

Cập nhật thông tin todo (title, completed, hoặc parent_id).

**Request Body:**
```json
{
  "title": "Nấu cơm chiều",  // optional
  "completed": true,          // optional
  "parent_id": "new-parent-uuid"  // optional
}
```

**Response (200):**
```json
{
  "message": "Todo updated successfully",
  "data": {
    "id": "uuid",
    "title": "Nấu cơm chiều",
    "completed": true,
    "parent_id": null,
    "user_id": "uuid",
    "order": 1,
    "createdAt": "2025-11-10T10:00:00.000Z",
    "updatedAt": "2025-11-10T10:05:00.000Z"
  }
}
```

---

### 6. Toggle trạng thái TODO
**PATCH** `/api/todos/:id/toggle`

Chuyển đổi trạng thái completed của todo (true <-> false).

**Response (200):**
```json
{
  "message": "Todo toggled successfully",
  "data": {
    "id": "uuid",
    "title": "Nấu cơm",
    "completed": true,
    "parent_id": null,
    "user_id": "uuid",
    "order": 1,
    "createdAt": "2025-11-10T10:00:00.000Z",
    "updatedAt": "2025-11-10T10:10:00.000Z"
  }
}
```

---

### 7. Xóa TODO
**DELETE** `/api/todos/:id`

Xóa một todo và tất cả các subtasks của nó (cascade delete).

**Response (200):**
```json
{
  "message": "Todo deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Title is required"
}
```

### 404 Not Found
```json
{
  "message": "Todo not found"
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthorized"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

---

## Ví dụ tạo cấu trúc TODO như yêu cầu

### Bước 1: Tạo todo gốc "Nấu cơm"
```bash
POST /api/todos
{
  "title": "Nấu cơm"
}
```

### Bước 2: Tạo todo gốc "Đi chơi Huế"
```bash
POST /api/todos
{
  "title": "Đi chơi Huế"
}
```

### Bước 3: Tạo subtasks cho "Đi chơi Huế"
```bash
POST /api/todos/batch
{
  "parent_id": "<id-cua-di-choi-hue>",
  "todos": [
    {
      "title": "Lên kế hoạch (thời gian, ngân sách, lịch trình)"
    },
    {
      "title": "Đặt vé (tàu/xe/máy bay, khách sạn)"
    }
  ]
}
```

### Bước 4: Tạo subtasks cho "Đặt vé"
```bash
POST /api/todos/batch
{
  "parent_id": "<id-cua-dat-ve>",
  "todos": [
    {
      "title": "Xác định điểm đi và điểm đến"
    },
    {
      "title": "Chọn loại phương tiện (tàu/xe/máy bay)"
    },
    {
      "title": "Chọn ngày đi và ngày về (nếu có)"
    },
    {
      "title": "Tìm kiếm và so sánh các lựa chọn"
    },
    {
      "title": "Chọn chuyến đi/khách sạn phù hợp"
    }
  ]
}
```

### Bước 5: Lấy toàn bộ danh sách
```bash
GET /api/todos
```

Sẽ trả về cấu trúc cây hoàn chỉnh với completedItems và totalItems được tính tự động!

