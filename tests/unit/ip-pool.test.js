const fs = require('fs');
const IpPool = require('../../src/ip-management/ip-pool');

// Mock fs module
jest.mock('fs');

// Mock tester module
jest.mock('../../src/ip-management/tester', () => {
    return jest.fn((ipList) => {
        // Simulate testing: return all IPs as alive with fake latency
        return Promise.resolve(
            ipList.map((ip, index) => ({
                host: ip,
                alive: true,
                avg: 100 + index * 10, // Incrementing latency
                score: 100 + index * 10,
                tcp: { avg: 95 + index * 10, min: 90, max: 100, jitter: 2, packetLoss: 0, successCount: 5, attempts: 5 },
                http: { avg: 103 + index * 10, min: 98, max: 110, jitter: 3, packetLoss: 0, successCount: 5, attempts: 5 },
                overall: { packetLoss: 0, totalAttempts: 10, totalSuccesses: 10 },
                results: []
            }))
        );
    });
});

describe('IpPool', () => {
    let ipPool;
    const testIpListPath = '/fake/path/ip_list.txt';

    beforeEach(() => {
        jest.clearAllMocks();
        ipPool = new IpPool(testIpListPath, 5);
    });

    describe('constructor', () => {
        test('should initialize with default values', () => {
            expect(ipPool.ipListPath).toBe(testIpListPath);
            expect(ipPool.maxFailures).toBe(5);
            expect(ipPool.ipList).toEqual([]);
            expect(ipPool.ipFailureCount).toBeInstanceOf(Map);
            expect(ipPool.best).toEqual({
                host: null,
                avg: Number.MAX_SAFE_INTEGER,
                originalHost: null
            });
        });

        test('should accept custom maxFailures', () => {
            const customPool = new IpPool(testIpListPath, 10);
            expect(customPool.maxFailures).toBe(10);
        });
    });

    describe('loadFromFile', () => {
        test('should load IPs from file', () => {
            const mockIpList = '192.168.1.1\n192.168.1.2\n192.168.1.3\n';
            fs.readFileSync.mockReturnValue(mockIpList);

            const result = ipPool.loadFromFile();

            expect(fs.readFileSync).toHaveBeenCalledWith(testIpListPath, 'utf-8');
            expect(result).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
            expect(ipPool.ipList).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
        });

        test('should filter out empty lines', () => {
            const mockIpList = '192.168.1.1\n\n192.168.1.2\n\n\n192.168.1.3\n';
            fs.readFileSync.mockReturnValue(mockIpList);

            const result = ipPool.loadFromFile();

            expect(result).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
        });

        test('should filter out IPv6 addresses (containing :)', () => {
            const mockIpList = '192.168.1.1\n2001:0db8:85a3::8a2e:0370:7334\n192.168.1.2\n';
            fs.readFileSync.mockReturnValue(mockIpList);

            const result = ipPool.loadFromFile();

            expect(result).toEqual(['192.168.1.1', '192.168.1.2']);
        });

        test('should handle Windows line endings (\\r\\n)', () => {
            const mockIpList = '192.168.1.1\r\n192.168.1.2\r\n192.168.1.3\r\n';
            fs.readFileSync.mockReturnValue(mockIpList);

            const result = ipPool.loadFromFile();

            expect(result).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
        });

        test('should handle Mac line endings (\\r)', () => {
            const mockIpList = '192.168.1.1\r192.168.1.2\r192.168.1.3\r';
            fs.readFileSync.mockReturnValue(mockIpList);

            const result = ipPool.loadFromFile();

            expect(result).toEqual(['192.168.1.1', '192.168.1.2', '192.168.1.3']);
        });
    });

    describe('saveToFile', () => {
        test('should save IP list to file', () => {
            ipPool.ipList = ['192.168.1.1', '192.168.1.2', '192.168.1.3'];

            ipPool.saveToFile();

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                testIpListPath,
                '192.168.1.1\n192.168.1.2\n192.168.1.3',
                'utf-8'
            );
        });

        test('should save empty list', () => {
            ipPool.ipList = [];

            ipPool.saveToFile();

            expect(fs.writeFileSync).toHaveBeenCalledWith(testIpListPath, '', 'utf-8');
        });
    });

    describe('getIpList', () => {
        test('should return current IP list', () => {
            ipPool.ipList = ['192.168.1.1', '192.168.1.2'];

            const result = ipPool.getIpList();

            expect(result).toEqual(['192.168.1.1', '192.168.1.2']);
        });
    });

    describe('setIpList', () => {
        test('should update IP list', () => {
            const newList = ['10.0.0.1', '10.0.0.2'];

            ipPool.setIpList(newList);

            expect(ipPool.ipList).toEqual(newList);
        });
    });

    describe('getBest', () => {
        test('should return best server info', () => {
            const result = ipPool.getBest();

            expect(result).toEqual({
                host: null,
                avg: Number.MAX_SAFE_INTEGER,
                originalHost: null
            });
        });
    });

    describe('refreshBest', () => {
        test('should test IPs and update best server', async () => {
            ipPool.ipList = ['192.168.1.1', '192.168.1.2', '192.168.1.3'];

            await ipPool.refreshBest();

            expect(ipPool.best.host).toBe('192.168.1.1'); // First IP has lowest latency
            expect(ipPool.best.avg).toBe(100);
        });

        test('should reset failure counts for alive IPs', async () => {
            ipPool.ipList = ['192.168.1.1', '192.168.1.2'];
            ipPool.ipFailureCount.set('192.168.1.1', 3);
            ipPool.ipFailureCount.set('192.168.1.2', 2);

            await ipPool.refreshBest();

            expect(ipPool.ipFailureCount.get('192.168.1.1')).toBe(0);
            expect(ipPool.ipFailureCount.get('192.168.1.2')).toBe(0);
        });

        test('should increment failure count for dead IPs', async () => {
            const tester = require('../../src/ip-management/tester');

            // Mock tester to return only some IPs as alive
            tester.mockImplementationOnce((ipList) => {
                return Promise.resolve([
                    {
                        host: '192.168.1.1',
                        alive: true,
                        avg: 100,
                        score: 100,
                        tcp: { avg: 95, min: 90, max: 100, jitter: 2, packetLoss: 0, successCount: 5, attempts: 5 },
                        http: { avg: 103, min: 98, max: 110, jitter: 3, packetLoss: 0, successCount: 5, attempts: 5 },
                        overall: { packetLoss: 0, totalAttempts: 10, totalSuccesses: 10 },
                        results: []
                    }
                    // 192.168.1.2 is dead
                ]);
            });

            ipPool.ipList = ['192.168.1.1', '192.168.1.2'];
            ipPool.ipFailureCount.set('192.168.1.2', 3);

            await ipPool.refreshBest();

            expect(ipPool.ipFailureCount.get('192.168.1.2')).toBe(4);
        });

        test('should remove IPs after maxFailures', async () => {
            const tester = require('../../src/ip-management/tester');

            // Mock tester to return only first IP as alive
            tester.mockImplementationOnce(() => {
                return Promise.resolve([
                    {
                        host: '192.168.1.1',
                        alive: true,
                        avg: 100,
                        score: 100,
                        tcp: { avg: 95, min: 90, max: 100, jitter: 2, packetLoss: 0, successCount: 5, attempts: 5 },
                        http: { avg: 103, min: 98, max: 110, jitter: 3, packetLoss: 0, successCount: 5, attempts: 5 },
                        overall: { packetLoss: 0, totalAttempts: 10, totalSuccesses: 10 },
                        results: []
                    }
                ]);
            });

            ipPool.ipList = ['192.168.1.1', '192.168.1.2', '192.168.1.3'];
            ipPool.ipFailureCount.set('192.168.1.2', 4); // Will reach 5 (maxFailures)
            ipPool.ipFailureCount.set('192.168.1.3', 4);

            await ipPool.refreshBest();

            expect(ipPool.ipList).toEqual(['192.168.1.1']);
            expect(ipPool.ipFailureCount.has('192.168.1.2')).toBe(false);
            expect(ipPool.ipFailureCount.has('192.168.1.3')).toBe(false);
        });

        test('should handle empty test results', async () => {
            const tester = require('../../src/ip-management/tester');
            tester.mockImplementationOnce(() => Promise.resolve([]));

            ipPool.ipList = ['192.168.1.1'];

            await ipPool.refreshBest();

            expect(ipPool.best.host).toBeNull();
        });
    });

    describe('removeDeadIps', () => {
        test('should remove dead IPs from the list', () => {
            ipPool.ipList = ['192.168.1.1', '192.168.1.2', '192.168.1.3', '192.168.1.4'];
            ipPool.ipFailureCount.set('192.168.1.2', 5);
            ipPool.ipFailureCount.set('192.168.1.4', 5);

            ipPool.removeDeadIps(['192.168.1.2', '192.168.1.4']);

            expect(ipPool.ipList).toEqual(['192.168.1.1', '192.168.1.3']);
            expect(ipPool.ipFailureCount.has('192.168.1.2')).toBe(false);
            expect(ipPool.ipFailureCount.has('192.168.1.4')).toBe(false);
        });

        test('should handle removing IPs not in the list', () => {
            ipPool.ipList = ['192.168.1.1', '192.168.1.2'];

            ipPool.removeDeadIps(['192.168.1.3', '192.168.1.4']);

            expect(ipPool.ipList).toEqual(['192.168.1.1', '192.168.1.2']);
        });
    });

    describe('mergeNewIps', () => {
        test('should merge new IPs with existing list', () => {
            ipPool.ipList = ['192.168.1.1', '192.168.1.2'];

            const newCount = ipPool.mergeNewIps(['192.168.1.3', '192.168.1.4']);

            expect(newCount).toBe(2);
            expect(ipPool.ipList).toContain('192.168.1.1');
            expect(ipPool.ipList).toContain('192.168.1.2');
            expect(ipPool.ipList).toContain('192.168.1.3');
            expect(ipPool.ipList).toContain('192.168.1.4');
            expect(ipPool.ipList.length).toBe(4);
        });

        test('should deduplicate IPs', () => {
            ipPool.ipList = ['192.168.1.1', '192.168.1.2'];

            const newCount = ipPool.mergeNewIps(['192.168.1.2', '192.168.1.3']);

            expect(newCount).toBe(1); // Only 192.168.1.3 is new
            expect(ipPool.ipList.length).toBe(3);
        });

        test('should handle merging with empty existing list', () => {
            ipPool.ipList = [];

            const newCount = ipPool.mergeNewIps(['192.168.1.1', '192.168.1.2']);

            expect(newCount).toBe(2);
            expect(ipPool.ipList).toEqual(['192.168.1.1', '192.168.1.2']);
        });

        test('should handle merging empty new list', () => {
            ipPool.ipList = ['192.168.1.1', '192.168.1.2'];

            const newCount = ipPool.mergeNewIps([]);

            expect(newCount).toBe(0);
            expect(ipPool.ipList).toEqual(['192.168.1.1', '192.168.1.2']);
        });

        test('should respect maxIps parameter', () => {
            ipPool.ipList = ['192.168.1.1', '192.168.1.2'];
            const manyIps = Array.from({ length: 250 }, (_, i) => `10.0.0.${i}`);

            ipPool.mergeNewIps(manyIps, 200);

            // Should still merge all (maxIps is a warning, not a hard limit)
            expect(ipPool.ipList.length).toBeGreaterThan(200);
        });

        test('should return count of really new IPs', () => {
            ipPool.ipList = ['192.168.1.1', '192.168.1.2', '192.168.1.3'];

            const newCount = ipPool.mergeNewIps([
                '192.168.1.1', // duplicate
                '192.168.1.2', // duplicate
                '192.168.1.4', // new
                '192.168.1.5'  // new
            ]);

            expect(newCount).toBe(2);
        });
    });
});
