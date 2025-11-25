# GET /behavior-feedbacks/ - Get All Behavior Feedbacks

## Description
Lấy tất cả behavior feedbacks của user hiện tại từ các metrics behavior (night_out_freq, brand_novelty, daily_distance_km, etc.)

## Authentication
Required: YES (JWT Bearer Token)

## Request

### Headers
```
Authorization: Bearer <your_jwt_token>
```

### Method
```
GET /behavior-feedbacks/
```

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Behavior feedbacks retrieved successfully",
  "data": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "metric": "night_out_freq",
      "vt": 4.0,
      "bt": 2.0,
      "r": 1.0,
      "n": 0.7310585786300049,
      "contrib": 0.09242343145200196,
      "mechanismFeedback": {
        "awareness": "Nhận thức về hoạt động xã hội trung bình.",
        "motivation": "Có động lực hiện tại — hành vi tăng/ổn định so với baseline.",
        "capability": "Người dùng có khả năng thực hiện hành vi; cần hỗ trợ duy trì.",
        "opportunity": "Cơ hội thực hiện hành vi tốt."
      },
      "reason": "Metric `night_out_freq` ảnh hưởng tới trait `E`: n=0.731, contrib=0.092 (vừa tăng). Baseline bt=2.000, vt=4.000.",
      "oceanScore": {
        "O": 0.5,
        "C": 0.6,
        "E": 0.446211715726001,
        "A": 0.7,
        "N": 0.3
      },
      "createdAt": "2024-11-25T10:30:00.000Z",
      "updatedAt": "2024-11-25T10:30:00.000Z"
    },
    {
      "id": "a1b2c3d4-e5f6-4789-9abc-def012345678",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "metric": "brand_novelty",
      "vt": 0.4,
      "bt": 3.0,
      "r": -0.87,
      "n": 0.3078436,
      "contrib": 0.0615687,
      "mechanismFeedback": {
        "awareness": "Người dùng có nhận thức về việc khám phá thương hiệu mới.",
        "motivation": "Động lực thấp - người dùng xu hướng gắn bó với thương hiệu quen thuộc.",
        "capability": "Có khả năng thử nghiệm nhưng chưa thực hiện.",
        "opportunity": "Cần tạo cơ hội tiếp cận thương hiệu mới dễ dàng hơn."
      },
      "reason": "Metric `brand_novelty` ảnh hưởng tới trait `O`: n=0.308, contrib=0.062 (giảm). User ít thử thương hiệu mới.",
      "oceanScore": {
        "O": 0.45,
        "C": 0.6,
        "E": 0.446211715726001,
        "A": 0.7,
        "N": 0.3
      },
      "createdAt": "2024-11-24T15:20:00.000Z",
      "updatedAt": "2024-11-24T15:20:00.000Z"
    },
    {
      "id": "9876fedc-ba98-4321-8765-fedcba987654",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "metric": "daily_distance_km",
      "vt": 15.5,
      "bt": 10.0,
      "r": 0.55,
      "n": 0.6456789,
      "contrib": 0.1291358,
      "mechanismFeedback": {
        "awareness": "Nhận thức tốt về hoạt động di chuyển hàng ngày.",
        "motivation": "Động lực cao - tăng quãng đường di chuyển so với baseline.",
        "capability": "Có đủ khả năng thể chất và thời gian để di chuyển xa hơn.",
        "opportunity": "Môi trường và điều kiện thuận lợi cho việc di chuyển."
      },
      "reason": "Metric `daily_distance_km` ảnh hưởng tới trait `E`: n=0.646, contrib=0.129 (tăng mạnh). User di chuyển xa hơn, cho thấy xu hướng ngoại hướng.",
      "oceanScore": {
        "O": 0.45,
        "C": 0.6,
        "E": 0.52,
        "A": 0.7,
        "N": 0.3
      },
      "createdAt": "2024-11-23T09:15:00.000Z",
      "updatedAt": "2024-11-23T09:15:00.000Z"
    },
    {
      "id": "bbbbcccc-dddd-4444-eeee-ffff00001111",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "metric": "list_adherence",
      "vt": 0.85,
      "bt": 3.5,
      "r": 0.89,
      "n": 0.7894561,
      "contrib": 0.1578912,
      "mechanismFeedback": {
        "awareness": "Nhận thức rõ ràng về tầm quan trọng của việc hoàn thành danh sách công việc.",
        "motivation": "Động lực cao - tỷ lệ hoàn thành task tốt.",
        "capability": "Có kỹ năng quản lý thời gian và công việc hiệu quả.",
        "opportunity": "Môi trường làm việc hỗ trợ tốt cho việc hoàn thành công việc."
      },
      "reason": "Metric `list_adherence` ảnh hưởng tới trait `C`: n=0.789, contrib=0.158 (tăng mạnh). User có tính kỷ luật cao trong việc hoàn thành công việc.",
      "oceanScore": {
        "O": 0.45,
        "C": 0.72,
        "E": 0.52,
        "A": 0.7,
        "N": 0.3
      },
      "createdAt": "2024-11-22T14:45:00.000Z",
      "updatedAt": "2024-11-22T14:45:00.000Z"
    },
    {
      "id": "ccccdddd-eeee-5555-ffff-000011112222",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "metric": "public_transit_ratio",
      "vt": 0.7,
      "bt": 4.0,
      "r": 0.65,
      "n": 0.6789012,
      "contrib": 0.1357802,
      "mechanismFeedback": {
        "awareness": "Có nhận thức về lợi ích môi trường của phương tiện công cộng.",
        "motivation": "Động lực tốt - tăng tỷ lệ sử dụng phương tiện công cộng.",
        "capability": "Có khả năng sử dụng phương tiện công cộng thuận lợi.",
        "opportunity": "Hệ thống giao thông công cộng phát triển tốt ở khu vực sinh sống."
      },
      "reason": "Metric `public_transit_ratio` ảnh hưởng tới trait `A`: n=0.679, contrib=0.136 (tăng). User có xu hướng quan tâm đến cộng đồng và môi trường.",
      "oceanScore": {
        "O": 0.45,
        "C": 0.72,
        "E": 0.52,
        "A": 0.78,
        "N": 0.3
      },
      "createdAt": "2024-11-21T11:30:00.000Z",
      "updatedAt": "2024-11-21T11:30:00.000Z"
    },
    {
      "id": "ddddeeee-ffff-6666-0000-111122223333",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "metric": "spend_variability",
      "vt": 0.45,
      "bt": 2.8,
      "r": -0.78,
      "n": 0.3234567,
      "contrib": 0.0646913,
      "mechanismFeedback": {
        "awareness": "Nhận thức về thói quen chi tiêu của bản thân.",
        "motivation": "Động lực trung bình - chi tiêu có xu hướng ổn định.",
        "capability": "Có khả năng kiểm soát chi tiêu tốt.",
        "opportunity": "Thu nhập ổn định tạo điều kiện cho việc quản lý tài chính."
      },
      "reason": "Metric `spend_variability` ảnh hưởng tới trait `N`: n=0.323, contrib=0.065 (giảm). User có xu hướng chi tiêu ổn định, ít biến động.",
      "oceanScore": {
        "O": 0.45,
        "C": 0.72,
        "E": 0.52,
        "A": 0.78,
        "N": 0.26
      },
      "createdAt": "2024-11-20T16:00:00.000Z",
      "updatedAt": "2024-11-20T16:00:00.000Z"
    },
    {
      "id": "eeeeffff-0000-7777-1111-222233334444",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "metric": "novel_location_ratio",
      "vt": 0.35,
      "bt": 3.2,
      "r": 0.42,
      "n": 0.5678901,
      "contrib": 0.1135780,
      "mechanismFeedback": {
        "awareness": "Có nhận thức về việc khám phá địa điểm mới.",
        "motivation": "Động lực trung bình - thỉnh thoảng đến địa điểm mới.",
        "capability": "Có khả năng và thời gian để khám phá địa điểm mới.",
        "opportunity": "Nhiều địa điểm mới trong khu vực để khám phá."
      },
      "reason": "Metric `novel_location_ratio` ảnh hưởng tới trait `O`: n=0.568, contrib=0.114 (tăng vừa phải). User có xu hướng khám phá địa điểm mới.",
      "oceanScore": {
        "O": 0.52,
        "C": 0.72,
        "E": 0.52,
        "A": 0.78,
        "N": 0.26
      },
      "createdAt": "2024-11-19T13:20:00.000Z",
      "updatedAt": "2024-11-19T13:20:00.000Z"
    }
  ],
  "count": 7
}
```

### Error Response (401 Unauthorized)

```json
{
  "error": "Unauthorized"
}
```

### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Failed to get behavior feedbacks",
  "details": "Error message here"
}
```

## Field Descriptions

### Response Fields

- `success` (boolean): Trạng thái thành công của request
- `message` (string): Thông báo mô tả kết quả
- `data` (array): Danh sách các behavior feedback
- `count` (number): Tổng số feedback

### Behavior Feedback Object Fields

- `id` (string, UUID): ID duy nhất của feedback
- `userId` (string, UUID): ID của user
- `metric` (string): Loại metric (night_out_freq, brand_novelty, daily_distance_km, list_adherence, public_transit_ratio, spend_variability, novel_location_ratio)
- `vt` (number): Value hiện tại (current value)
- `bt` (number): Baseline value (giá trị tham chiếu)
- `r` (number): Normalized ratio
- `n` (number): Gaussian influence score
- `contrib` (number): Contribution to trait change
- `mechanismFeedback` (object): COM-B feedback
  - `awareness` (string): Nhận thức về hành vi
  - `motivation` (string): Động lực thực hiện hành vi
  - `capability` (string): Khả năng thực hiện hành vi
  - `opportunity` (string): Cơ hội thực hiện hành vi
- `reason` (string): Giải thích chi tiết về feedback
- `oceanScore` (object): OCEAN personality scores sau khi cập nhật
  - `O` (number): Openness (0-1)
  - `C` (number): Conscientiousness (0-1)
  - `E` (number): Extraversion (0-1)
  - `A` (number): Agreeableness (0-1)
  - `N` (number): Neuroticism (0-1)
- `createdAt` (string, ISO 8601): Thời gian tạo feedback
- `updatedAt` (string, ISO 8601): Thời gian cập nhật feedback

## Notes

- Feedbacks được sắp xếp theo thời gian tạo (mới nhất trước)
- Mỗi lần user cập nhật metrics behavior (gọi API POST metrics), một feedback mới sẽ được tạo
- Feedback giúp tracking lịch sử thay đổi personality traits dựa trên behavior
- OCEAN scores trong mỗi feedback là scores SAU KHI metric đó được áp dụng

