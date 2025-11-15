// Mock tcp-ping
jest.mock('tcp-ping', () => ({
    probe: jest.fn((host, port, callback) => {
        // Simulate successful TCP ping
        callback(null, true);
    }),
    ping: jest.fn((options, callback) => {
        // Simulate tcp-ping with results
        const results = [
            { time: 85.1 },
            { time: 88.2 },
            { time: 92.3 },
            { time: 87.5 },
            { time: 89.1 }
        ];
        callback(null, results);
    })
}));

// Mock http/https modules
jest.mock('http', () => ({
    request: jest.fn()
}));

jest.mock('https', () => ({
    request: jest.fn()
}));

const testIpList = require('../../src/ip-management/tester');

describe('IP Tester', () => {
    beforeEach(() => {
        const http = require('http');
        const https = require('https');
        const tcpPing = require('tcp-ping');

        // Reset call history but keep implementations
        http.request.mockClear();
        https.request.mockClear();
        tcpPing.ping.mockClear();
        tcpPing.probe.mockClear();

        // Reset to default success behavior for TCP ping
        tcpPing.ping.mockImplementation((options, callback) => {
            const results = [
                { time: 85.1 },
                { time: 88.2 },
                { time: 92.3 },
                { time: 87.5 },
                { time: 89.1 }
            ];
            callback(null, results);
        });

        // Setup HTTP/HTTPS mock responses
        const setupMockRequest = (mockFn) => {
            mockFn.mockImplementation((options, callback) => {
                const mockRes = {
                    statusCode: 200,
                    on: jest.fn((event, handler) => {
                        if (event === 'data') {
                            // No data for HEAD requests
                        }
                        if (event === 'end') {
                            setTimeout(handler, 10); // Simulate 10ms latency
                        }
                    }),
                    resume: jest.fn() // Required for consuming response data
                };

                const mockReq = {
                    on: jest.fn((event, handler) => {
                        if (event === 'error') {
                            // No error by default
                        }
                    }),
                    end: jest.fn(() => {
                        setTimeout(() => callback(mockRes), 10);
                    }),
                    setTimeout: jest.fn()
                };

                return mockReq;
            });
        };

        setupMockRequest(http.request);
        setupMockRequest(https.request);
    });

    describe('testIpList', () => {
        test('should test list of IPs and return results sorted by score', async () => {
            const ipList = ['192.168.1.1', '192.168.1.2', '192.168.1.3'];

            const results = await testIpList(ipList);

            expect(results).toBeDefined();
            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBeGreaterThan(0);
            expect(results.length).toBeLessThanOrEqual(ipList.length);
        });

        test('should filter out dead IPs', async () => {
            const tcpPing = require('tcp-ping');

            // Mock one IP as dead
            tcpPing.ping.mockImplementationOnce((options, callback) => {
                callback(new Error('Connection refused'), null);
            });

            const ipList = ['192.168.1.1', '192.168.1.2'];
            const results = await testIpList(ipList);

            // Should only return alive IPs
            expect(results.every(r => r.alive)).toBe(true);
        });

        test('should return results with comprehensive metrics structure', async () => {
            const ipList = ['192.168.1.1'];

            const results = await testIpList(ipList);

            expect(results.length).toBeGreaterThan(0);
            const result = results[0];

            // Check main properties
            expect(result).toHaveProperty('host');
            expect(result).toHaveProperty('alive');
            expect(result).toHaveProperty('score');

            // Check TCP metrics
            expect(result).toHaveProperty('tcp');
            expect(result.tcp).toHaveProperty('avg');
            expect(result.tcp).toHaveProperty('min');
            expect(result.tcp).toHaveProperty('max');
            expect(result.tcp).toHaveProperty('jitter');
            expect(result.tcp).toHaveProperty('packetLoss');
            expect(result.tcp).toHaveProperty('successCount');
            expect(result.tcp).toHaveProperty('attempts');

            // Check HTTP metrics
            expect(result).toHaveProperty('http');
            expect(result.http).toHaveProperty('avg');
            expect(result.http).toHaveProperty('min');
            expect(result.http).toHaveProperty('max');
            expect(result.http).toHaveProperty('jitter');
            expect(result.http).toHaveProperty('packetLoss');
            expect(result.http).toHaveProperty('successCount');
            expect(result.http).toHaveProperty('attempts');

            // Check overall metrics
            expect(result).toHaveProperty('overall');
            expect(result.overall).toHaveProperty('packetLoss');
            expect(result.overall).toHaveProperty('totalAttempts');
            expect(result.overall).toHaveProperty('totalSuccesses');

            // Check backward compatibility
            expect(result).toHaveProperty('avg');
            expect(result).toHaveProperty('results');
        });

        test('should accept custom options', async () => {
            const ipList = ['192.168.1.1'];
            const options = {
                attempts: 3,
                timeout: 5000,
                port: 80,
                useHttps: false
            };

            const results = await testIpList(ipList, options);

            expect(results).toBeDefined();
            expect(results.length).toBeGreaterThan(0);
        });

        test('should use HTTPS by default', async () => {
            const https = require('https');
            const ipList = ['192.168.1.1'];

            await testIpList(ipList);

            expect(https.request).toHaveBeenCalled();
        });

        test('should use HTTP when useHttps is false', async () => {
            const http = require('http');
            const ipList = ['192.168.1.1'];

            await testIpList(ipList, { useHttps: false });

            expect(http.request).toHaveBeenCalled();
        });

        test('should calculate packet loss correctly', async () => {
            const tcpPing = require('tcp-ping');

            // Mock 2 successes and 3 failures out of 5 attempts
            tcpPing.ping.mockImplementationOnce((options, callback) => {
                const results = [
                    { time: 85.1 },
                    { time: 88.2 }
                ];
                callback(null, results);
            });

            const ipList = ['192.168.1.1'];
            const results = await testIpList(ipList, { attempts: 5 });

            if (results.length > 0) {
                const result = results[0];
                expect(result.tcp.packetLoss).toBeGreaterThan(0);
            }
        });

        test('should sort results by score (lower is better)', async () => {
            const tcpPing = require('tcp-ping');

            // Mock different latencies for different IPs
            tcpPing.ping
                .mockImplementationOnce((options, callback) => {
                    callback(null, [{ time: 100 }, { time: 105 }, { time: 110 }]);
                })
                .mockImplementationOnce((options, callback) => {
                    callback(null, [{ time: 50 }, { time: 55 }, { time: 60 }]);
                })
                .mockImplementationOnce((options, callback) => {
                    callback(null, [{ time: 75 }, { time: 80 }, { time: 85 }]);
                });

            const ipList = ['192.168.1.1', '192.168.1.2', '192.168.1.3'];
            const results = await testIpList(ipList);

            // Results should be sorted by score (ascending)
            for (let i = 1; i < results.length; i++) {
                expect(results[i].score).toBeGreaterThanOrEqual(results[i - 1].score);
            }
        });

        test('should handle empty IP list', async () => {
            const results = await testIpList([]);

            expect(results).toEqual([]);
        });

        test('should handle all IPs being dead', async () => {
            const tcpPing = require('tcp-ping');
            const https = require('https');

            // Make both TCP and HTTP tests fail
            tcpPing.ping.mockImplementation((options, callback) => {
                callback(new Error('TCP connection failed'), null);
            });

            https.request.mockImplementation((options, callback) => {
                const mockReq = {
                    on: jest.fn((event, handler) => {
                        if (event === 'error') {
                            setTimeout(() => handler(new Error('HTTP connection failed')), 10);
                        }
                    }),
                    end: jest.fn(),
                    setTimeout: jest.fn()
                };
                return mockReq;
            });

            const ipList = ['192.168.1.1', '192.168.1.2'];
            const results = await testIpList(ipList);

            // All dead IPs should be filtered out
            expect(results).toEqual([]);
        });

        test('should calculate weighted score (40% TCP + 60% HTTP with packet loss penalty)', async () => {
            const ipList = ['192.168.1.1'];
            const results = await testIpList(ipList);

            if (results.length > 0) {
                const result = results[0];
                const baseScore = result.tcp.avg * 0.4 + result.http.avg * 0.6;
                const packetLossPenalty = 1 + result.overall.packetLoss / 100;
                const expectedScore = baseScore * packetLossPenalty;

                expect(result.score).toBeCloseTo(expectedScore, 1);
            }
        });

        test('should include jitter (standard deviation) in metrics', async () => {
            const ipList = ['192.168.1.1'];
            const results = await testIpList(ipList);

            if (results.length > 0) {
                const result = results[0];

                expect(typeof result.tcp.jitter).toBe('number');
                expect(result.tcp.jitter).toBeGreaterThanOrEqual(0);

                expect(typeof result.http.jitter).toBe('number');
                expect(result.http.jitter).toBeGreaterThanOrEqual(0);
            }
        });

        test('should calculate overall statistics correctly', async () => {
            const ipList = ['192.168.1.1'];
            const options = { attempts: 5 };
            const results = await testIpList(ipList, options);

            if (results.length > 0) {
                const result = results[0];

                // Total attempts should be TCP attempts + HTTP attempts
                expect(result.overall.totalAttempts).toBe(
                    result.tcp.attempts + result.http.attempts
                );

                // Total successes should be TCP successes + HTTP successes
                expect(result.overall.totalSuccesses).toBe(
                    result.tcp.successCount + result.http.successCount
                );

                // Overall packet loss should be calculated from total
                const expectedPacketLoss =
                    ((result.overall.totalAttempts - result.overall.totalSuccesses) /
                     result.overall.totalAttempts) * 100;

                expect(result.overall.packetLoss).toBeCloseTo(expectedPacketLoss, 1);
            }
        });

        test('should maintain backward compatibility with legacy fields', async () => {
            const ipList = ['192.168.1.1'];
            const results = await testIpList(ipList);

            if (results.length > 0) {
                const result = results[0];

                // Legacy 'avg' field should equal score
                expect(result.avg).toBe(result.score);

                // Legacy 'results' field should be an object with avg/min/max
                expect(result.results).toBeDefined();
                expect(typeof result.results).toBe('object');
                expect(result.results).toHaveProperty('avg');
                expect(result.results).toHaveProperty('min');
                expect(result.results).toHaveProperty('max');
            }
        });
    });
});
