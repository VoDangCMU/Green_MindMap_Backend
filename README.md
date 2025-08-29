# Green MindMap Backend

Backend API cho ứng dụng Green MindMap được xây dựng bằng Node.js, TypeScript và TypeORM.

## Yêu cầu hệ thống

- Node.js >= 16.x
- Docker & Docker Compose
- Yarn hoặc npm

## Cài đặt dự án

### 1. Clone repository và cài đặt dependencies
```bash
git clone <repository-url>
cd Green_MindMap_Backend
yarn install
```

### 2. Cấu hình môi trường
Tạo file `.env` ở thư mục gốc dự án:
```bash
touch .env
```

Hoặc copy từ file mẫu:
```bash
cp .env.example .env
```

Sau đó cập nhật các biến môi trường cần thiết trong file `.env`.

### 3. Khởi động Database và Cache
```bash
# Load biến môi trường
source .env

# Khởi động PostgreSQL và Redis bằng Docker
cd deploy/docker
docker compose up -d
```

### 4. Chạy Migration (nếu cần)
```bash
# Sinh migration tự động từ entities
./generate_migration.sh InitDB

# Hoặc tạo migration trống để chỉnh sửa thủ công
./create_migration.sh CustomMigration

# Chạy migration
npm run migration:run
```

### 5. Khởi động ứng dụng
```bash
# Development mode
yarn dev

# Production mode
yarn build
yarn start
```

## Scripts có sẵn

### Development
- `yarn dev` - Chạy ứng dụng ở chế độ development với hot reload
- `yarn build` - Build ứng dụng cho production
- `yarn start` - Chạy ứng dụng đã được build

### Database Migration
- `./generate_migration.sh <migration-name>` - Sinh migration tự động từ thay đổi entities
- `./create_migration.sh <migration-name>` - Tạo migration trống để chỉnh sửa thủ công
- `npm run migration:run` - Chạy các migration chưa được thực thi
- `npm run migration:revert` - Rollback migration gần nhất

### Linting & Testing
- `yarn lint` - Kiểm tra code style
- `yarn test` - Chạy unit tests
- `yarn test:e2e` - Chạy end-to-end tests

## Cấu trúc dự án

```
src/
├── config/          # Cấu hình ứng dụng và validation schemas
├── controller/      # API controllers
├── entity/          # TypeORM entities (database models)
├── infrastructure/  # Database, cache, logger setup
├── middlewares/     # Express middlewares
├── migrations/      # Database migration files
├── repository/      # Data access layer
├── routes/          # API route definitions
├── runner/          # Migration runners
└── utils/           # Utility functions
```

## API Documentation

API được thiết kế theo RESTful principles:

- `GET /health` - Health check endpoint
- `POST /auth/login` - Đăng nhập
- `POST /auth/register` - Đăng ký
- `GET /users` - Lấy danh sách users
- ...

Chi tiết API documentation có thể truy cập tại: `http://localhost:3000/docs` (khi chạy ở development mode)

## Development Workflow

### 1. Tạo Entity mới
1. Tạo file entity trong `src/entity/`
2. Sinh migration: `./generate_migration.sh AddNewEntity`
3. Chạy migration: `npm run migration:run`

### 2. Thêm API endpoint mới
1. Tạo/cập nhật controller trong `src/controller/`
2. Thêm route trong `src/routes/`
3. Thêm middleware nếu cần trong `src/middlewares/`

### 3. Testing
```bash
# Chạy tests
yarn test

# Chạy tests với coverage
yarn test:coverage
```

## Deployment

### Docker
```bash
# Build image
docker build -t green-mindmap-backend .

# Run container
docker run -p 3000:3000 green-mindmap-backend
```

### Kubernetes
```bash
# Staging environment
cd deploy/k8s/staging
./apply.sh

# Production environment
cd deploy/k8s/production
./apply.sh
```

## Troubleshooting

### Lỗi kết nối database
1. Kiểm tra Docker containers đang chạy: `docker ps`
2. Kiểm tra logs: `docker logs <container-id>`
3. Kiểm tra cấu hình trong file `.env`

### Lỗi migration
1. Kiểm tra kết nối database
2. Xem logs chi tiết: `npm run migration:show`
3. Rollback nếu cần: `npm run migration:revert`

## Contributing

1. Fork repository
2. Tạo feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Tạo Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
