const { Client } = require('pg');

async function fakeMigration() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        await client.connect();
        console.log(`✅ Connected to database: ${process.env.DB_NAME}`);

        // Kiểm tra xem bảng migrations có tồn tại không
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'migrations'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('⚠️  Bảng migrations chưa tồn tại, đang tạo...');
            await client.query(`
                CREATE TABLE "migrations" (
                    "id" SERIAL PRIMARY KEY,
                    "timestamp" bigint NOT NULL,
                    "name" character varying NOT NULL
                );
            `);
            console.log('✅ Đã tạo bảng migrations');
        }

        // Kiểm tra migration hiện tại
        console.log('\n=== Migrations hiện tại trong database ===');
        const currentMigrations = await client.query('SELECT * FROM migrations ORDER BY timestamp');
        if (currentMigrations.rowCount === 0) {
            console.log('  (Chưa có migration nào)');
        } else {
            currentMigrations.rows.forEach(row => {
                console.log(`  [X] ${row.name} (timestamp: ${row.timestamp})`);
            });
        }

        // Insert migration InitDb1762919696714 mà KHÔNG chạy SQL
        const migrationTimestamp = 1762919696714;
        const migrationName = 'InitDb1762919696714';

        console.log(`\n🔄 Đang fake migration: ${migrationName}`);
        console.log('   (Chỉ đánh dấu là đã chạy, KHÔNG thực thi SQL, dữ liệu giữ nguyên)');

        const result = await client.query(`
            INSERT INTO migrations (timestamp, name) 
            VALUES ($1, $2) 
            ON CONFLICT DO NOTHING
            RETURNING *;
        `, [migrationTimestamp, migrationName]);

        if (result.rowCount > 0) {
            console.log(`✅ Đã đánh dấu migration ${migrationName} là đã chạy`);
        } else {
            console.log(`⚠️  Migration ${migrationName} đã tồn tại trong bảng migrations`);
        }

        // Hiển thị migrations sau khi update
        console.log('\n=== Migrations sau khi fake ===');
        const updatedMigrations = await client.query('SELECT * FROM migrations ORDER BY timestamp');
        updatedMigrations.rows.forEach(row => {
            console.log(`  [X] ${row.name} (timestamp: ${row.timestamp})`);
        });

        console.log('\n✅ Hoàn tất! Tất cả dữ liệu trong database vẫn giữ nguyên.');
        console.log('   Bạn có thể chạy ứng dụng bình thường.');

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

fakeMigration();

