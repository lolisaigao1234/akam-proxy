const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * AkamTesterRunner - Executes Python akamTester script to discover new CDN IPs
 *
 * This class handles:
 * - Validating Python installation
 * - Executing akamTester.py with proper arguments
 * - Parsing output files to extract discovered IPs
 * - Error handling and timeout management
 * - Preventing concurrent executions (mutex)
 *
 * Usage:
 *   const runner = new AkamTesterRunner(config.akamTester);
 *   const newIps = await runner.run();
 */
class AkamTesterRunner {
    /**
     * @param {Object} config - akamTester configuration from config.json5
     * @param {string} config.pythonPath - Path to Python executable
     * @param {string} config.scriptPath - Path to akamTester.py
     * @param {string[]} config.targetHosts - Array of hosts to test
     * @param {number} config.timeout - Maximum execution time in ms
     */
    constructor(config) {
        this.config = config;
        this.isRunning = false;  // Mutex to prevent concurrent runs
        this.lastRunTime = null;
        this.lastError = null;
    }

    /**
     * Main entry point - Run akamTester and return discovered IPs
     * @returns {Promise<Map<string, string[]>>} Map of targetHost -> array of IP addresses
     */
    async run() {
        // Check if already running (mutex)
        if (this.isRunning) {
            console.log('akamTester is already running, skipping this interval');
            return new Map();
        }

        // Validate Python executable exists
        if (!await this.validatePython()) {
            return new Map();
        }

        // Execute Python script
        this.isRunning = true;
        this.lastRunTime = Date.now();

        try {
            console.log('Executing akamTester.py...');
            await this.executePythonScript();

            // Parse output files (returns Map<targetHost, ips[]>)
            const domainIpMap = await this.parseOutputFiles();

            // Log summary
            let totalIps = 0;
            domainIpMap.forEach((ips, host) => {
                console.log(`akamTester discovered ${ips.length} IPs for ${host}`);
                totalIps += ips.length;
            });
            console.log(`Total: ${totalIps} IPs across ${domainIpMap.size} domains`);

            return domainIpMap;

        } catch (error) {
            this.lastError = error;
            console.error('akamTester execution failed:', error.message);
            return new Map();

        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Validate that Python executable exists and is accessible
     * @returns {Promise<boolean>}
     */
    async validatePython() {
        try {
            const result = await new Promise((resolve, reject) => {
                // If conda environment is specified, validate conda instead
                let command, args;
                if (this.config.condaEnv) {
                    command = 'conda';
                    args = ['run', '-n', this.config.condaEnv, 'python', '--version'];
                } else {
                    command = this.config.pythonPath;
                    args = ['--version'];
                }

                const pythonProcess = spawn(command, args, {
                    windowsHide: true
                    // shell: true removed - not needed and causes DEP0190 warning
                    // Using shell with args array can lead to command injection
                });

                let versionOutput = '';

                pythonProcess.stdout.on('data', (data) => {
                    versionOutput += data.toString();
                });

                pythonProcess.stderr.on('data', (data) => {
                    versionOutput += data.toString();
                });

                pythonProcess.on('close', (code) => {
                    if (code === 0) {
                        console.log(`Python found: ${versionOutput.trim()}`);
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                });

                pythonProcess.on('error', (err) => {
                    resolve(false);
                });

                // Timeout after 5 seconds
                setTimeout(() => {
                    pythonProcess.kill();
                    resolve(false);
                }, 5000);
            });

            if (!result) {
                console.error('╔══════════════════════════════════════════════════════════════╗');
                if (this.config.condaEnv) {
                    console.error('║  Conda environment not found or not accessible               ║');
                    console.error('╚══════════════════════════════════════════════════════════════╝');
                    console.error(`Conda environment: ${this.config.condaEnv}`);
                    console.error('');
                    console.error('Please verify:');
                    console.error(`  1. Conda is installed and in PATH`);
                    console.error(`  2. Environment '${this.config.condaEnv}' exists: conda env list`);
                    console.error(`  3. Environment has Python installed`);
                    console.error('');
                    console.error('Or set condaEnv: null in config.json5 to use system Python');
                } else {
                    console.error('║  Python executable not found                                 ║');
                    console.error('╚══════════════════════════════════════════════════════════════╝');
                    console.error(`Path: ${this.config.pythonPath}`);
                    console.error('');
                    console.error('Please install Python 3 or update akamTester.pythonPath in config.json5');
                    console.error('Examples:');
                    console.error('  - Windows: pythonPath: "python" or "C:\\\\Python312\\\\python.exe"');
                    console.error('  - Linux/Mac: pythonPath: "python3" or "/usr/bin/python3"');
                }
                console.error('');
                console.error('Continuing with existing IP list...');
                console.error('═══════════════════════════════════════════════════════════════');
            }

            return result;

        } catch (error) {
            console.error('Error validating Python:', error.message);
            return false;
        }
    }

    /**
     * Execute akamTester.py script with timeout
     * @returns {Promise<{stdout: string, stderr: string}>}
     */
    async executePythonScript() {
        return new Promise((resolve, reject) => {
            // Set working directory to akamTester directory
            const cwd = path.join(__dirname, "../../tools/akamTester");
            console.log(`Working directory: ${cwd}`);

            // Build command and arguments based on conda or direct Python
            let command, args;
            if (this.config.condaEnv) {
                // Use conda run to execute in the specified environment
                command = 'conda';
                args = [
                    'run',
                    '-n', this.config.condaEnv,
                    'python',
                    'akamTester.py',
                    '-u',
                    ...this.config.targetHosts
                ];
                console.log(`Running: conda run -n ${this.config.condaEnv} python akamTester.py -u ${this.config.targetHosts.join(' ')}`);
            } else {
                // Use direct Python path
                command = this.config.pythonPath;
                args = [
                    'akamTester.py',
                    '-u',
                    ...this.config.targetHosts
                ];
                console.log(`Running: ${this.config.pythonPath} ${args.join(' ')}`);
            }

            console.log(`Working directory: ${cwd}`);

            // Spawn the process with UTF-8 encoding to handle Chinese characters
            const pythonProcess = spawn(command, args, {
                cwd: cwd,
                // shell: true removed - not needed and causes DEP0190 warning
                // Using shell with args array can lead to command injection vulnerabilities
                windowsHide: true,
                env: {
                    ...process.env,
                    PYTHONIOENCODING: 'utf-8',  // Force UTF-8 to handle Chinese output
                    CONDA_NO_PLUGINS: 'true'    // Disable conda plugins to avoid interactive prompts
                }
            });

            let stdout = '';
            let stderr = '';

            // Capture stdout
            pythonProcess.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                // Log each line from akamTester
                output.split('\n').forEach(line => {
                    if (line.trim()) {
                        console.log(`[akamTester] ${line.trim()}`);
                    }
                });
            });

            // Capture stderr
            pythonProcess.stderr.on('data', (data) => {
                const output = data.toString();
                stderr += output;
                // Log errors from akamTester
                output.split('\n').forEach(line => {
                    if (line.trim()) {
                        console.error(`[akamTester ERROR] ${line.trim()}`);
                    }
                });
            });

            // Setup timeout
            const timeout = setTimeout(() => {
                console.error(`akamTester timeout (${this.config.timeout}ms), killing process`);
                pythonProcess.kill('SIGTERM');

                // Force kill after 5 seconds if still running
                setTimeout(() => {
                    if (!pythonProcess.killed) {
                        pythonProcess.kill('SIGKILL');
                    }
                }, 5000);

                reject(new Error('akamTester execution timeout'));
            }, this.config.timeout);

            // Handle process completion
            pythonProcess.on('close', (code) => {
                clearTimeout(timeout);

                if (code === 0) {
                    console.log('akamTester completed successfully');
                    resolve({ stdout, stderr });
                } else {
                    const errorMsg = `akamTester exited with code ${code}`;
                    if (stderr) {
                        console.error('akamTester stderr output:', stderr);
                    }
                    reject(new Error(errorMsg));
                }
            });

            // Handle spawn errors
            pythonProcess.on('error', (err) => {
                clearTimeout(timeout);
                reject(new Error(`Failed to start akamTester: ${err.message}`));
            });
        });
    }

    /**
     * Parse output files generated by akamTester
     * Reads {host}_iplist.txt files and extracts IP addresses
     * IMPORTANT: IPs are kept SEPARATE by domain (no merging!)
     * @returns {Promise<Map<string, string[]>>} Map of targetHost -> array of IPs
     */
    async parseOutputFiles() {
        const domainIpMap = new Map();

        for (const host of this.config.targetHosts) {
            const filename = `${host}_iplist.txt`;
            const filepath = path.join(
                __dirname,
                '../../tools/akamTester',
                filename
            );

            console.log(`Parsing output file: ${filename}`);

            if (!fs.existsSync(filepath)) {
                console.warn(`Output file not found: ${filepath}`);
                console.warn('akamTester may have failed to generate results');
                domainIpMap.set(host, []); // Empty array for this domain
                continue;
            }

            try {
                const content = fs.readFileSync(filepath, 'utf-8');

                // Parse IPs from file (one per line)
                // Filter out IPv6 addresses (contain ':')
                const ips = content
                    .split(/\r\n|\r|\n/)
                    .map(line => line.trim())
                    .filter(line => {
                        // Skip empty lines
                        if (!line) return false;

                        // Skip IPv6 addresses (contain ':')
                        if (line.includes(':')) return false;

                        // Basic IPv4 validation
                        const ipMatch = line.match(/^(\d{1,3}\.){3}\d{1,3}$/);
                        return ipMatch !== null;
                    });

                console.log(`Found ${ips.length} valid IPv4 addresses in ${filename}`);

                // Store IPs for this specific domain (NO merging with other domains!)
                // Deduplicate within the same domain
                const uniqueIps = Array.from(new Set(ips));
                domainIpMap.set(host, uniqueIps);

            } catch (error) {
                console.error(`Error reading ${filename}:`, error.message);
                domainIpMap.set(host, []); // Empty array on error
            }
        }

        return domainIpMap;
    }
}

module.exports = AkamTesterRunner;