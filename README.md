## Chạy dự án trong môi trường dev

### 1. Cài đặt các package cần thiết
```bash
yanr install
```

### 2. Khởi động database & cache database
```bash
source .env
docker compose up -d
```

### 3. Chạy dự án
```bash
yarn dev
```