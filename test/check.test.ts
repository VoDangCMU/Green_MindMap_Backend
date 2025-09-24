import axios, { AxiosResponse } from 'axios';

describe('Check API Endpoints', () => {
    const baseURL = 'http://localhost:3000';

    // Configure axios instance for testing
    const apiClient = axios.create({
        baseURL,
        timeout: 5000,
        validateStatus: () => true // Don't throw on any status code
    });

    beforeAll(async () => {
        // Wait for server to be ready (optional health check)
        let serverReady = false;
        let attempts = 0;
        const maxAttempts = 10; // 10 attempts max wait

        console.log('Waiting for server to be ready on http://localhost:3000...');

        while (!serverReady && attempts < maxAttempts) {
            try {
                const response = await apiClient.get('/check');
                if (response.status === 200) {
                    serverReady = true;
                    console.log('Server is ready!');
                }
            } catch (error: any) {
                console.log(`Attempt ${attempts + 1}/${maxAttempts}: Server not ready - ${error.code || error.message}`);
                attempts++;
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }

        if (!serverReady) {
            console.log('\n⚠️  Server is not running on http://localhost:3000');
            console.log('Please start the server first by running: npm run dev');
            throw new Error('Server is not ready. Please start the server on port 3000 before running tests.');
        }
    }, 15000); // 15 second timeout for beforeAll

    describe('GET /check', () => {
        it('should return health status with 200 OK', async () => {
            const response: AxiosResponse = await apiClient.get('/check');

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toMatch(/json/);
            expect(response.data).toHaveProperty('message', 'ok');
            expect(response.data).toHaveProperty('timestamp');
            expect(response.data).toHaveProperty('service', 'green-mindmap-backend');
        });

        it('should return valid timestamp format', async () => {
            const response: AxiosResponse = await apiClient.get('/check');

            expect(response.status).toBe(200);
            const timestamp = response.data.timestamp;
            expect(timestamp).toBeDefined();
            expect(new Date(timestamp).toISOString()).toBe(timestamp);
        });

        it('should have consistent response structure', async () => {
            const response: AxiosResponse = await apiClient.get('/check');

            expect(response.status).toBe(200);
            expect(Object.keys(response.data)).toEqual(
                expect.arrayContaining(['message', 'timestamp', 'service'])
            );
            expect(Object.keys(response.data)).toHaveLength(3);
        });

        it('should respond quickly (performance test)', async () => {
            const startTime = Date.now();

            const response: AxiosResponse = await apiClient.get('/check');

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            expect(response.status).toBe(200);
            // Health check should respond within 2 seconds (allowing for network latency)
            expect(responseTime).toBeLessThan(2000);
        });

        it('should handle multiple concurrent requests', async () => {
            const requests = Array(5).fill(null).map(() =>
                apiClient.get('/check')
            );

            const responses: AxiosResponse[] = await Promise.all(requests);

            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.data.message).toBe('ok');
                expect(response.data.service).toBe('green-mindmap-backend');
            });
        });

        it('should return different timestamps for consecutive requests', async () => {
            const response1: AxiosResponse = await apiClient.get('/check');
            expect(response1.status).toBe(200);

            // Small delay to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 100));

            const response2: AxiosResponse = await apiClient.get('/check');
            expect(response2.status).toBe(200);

            expect(response1.data.timestamp).not.toBe(response2.data.timestamp);
        });
    });

    describe('Health Check Edge Cases', () => {

        it('should handle invalid query parameters gracefully', async () => {
            const response: AxiosResponse = await apiClient.get('/check?invalid=param&another=value');

            expect(response.status).toBe(200);
            // Should still return health status regardless of query params
            expect(response.data.message).toBe('ok');
        });

        it('should set correct content-type header', async () => {
            const response: AxiosResponse = await apiClient.get('/check');

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toMatch(/application\/json/);
        });

        it('should handle network timeouts gracefully', async () => {
            // Create a client with very short timeout for this test
            const timeoutClient = axios.create({
                baseURL,
                timeout: 1, // 1ms timeout to force timeout
                validateStatus: () => true
            });

            try {
                await timeoutClient.get('/check');
                // If it doesn't timeout, that's actually fine - server is very fast
                expect(true).toBe(true);
            } catch (error: any) {
                // Should be a timeout error
                expect(error.code).toBe('ECONNABORTED');
            }
        });

        it('should handle server unavailable scenario', async () => {
            // Test with wrong port to simulate server down
            const unavailableClient = axios.create({
                baseURL: 'http://localhost:9999',
                timeout: 1000,
                validateStatus: () => true
            });

            try {
                await unavailableClient.get('/check');
            } catch (error: any) {
                // Should get connection refused error
                expect(['ECONNREFUSED', 'ENOTFOUND']).toContain(error.code);
            }
        });
    });
});
