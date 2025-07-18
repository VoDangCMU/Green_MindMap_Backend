## Chạy dự án trong môi trường dev

### 1. Cài đặt các package cần thiết
```bash
yarn install
```

### 2. Tạo file .env
```bash
touch .env
```
- hoặc thêm file `.env` ở thư mục gốc dự án

### 3. Khởi động database & cache database
```bash
source .env

cd deploy/docker

docker compose up -d
```

### 4. Chạy dự án
```bash
yarn dev
```