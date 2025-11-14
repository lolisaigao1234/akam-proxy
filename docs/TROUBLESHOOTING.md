# Troubleshooting Guide

Common issues and solutions for akam-proxy.

## Table of Contents

- [Server Startup Issues](#server-startup-issues)
- [Proxy Not Working](#proxy-not-working)
- [Configuration Errors](#configuration-errors)
- [IP Discovery Issues](#ip-discovery-issues)
- [Performance Issues](#performance-issues)
- [Debug Logging](#debug-logging)

## Server Startup Issues

### Error: EADDRINUSE (Port Already in Use)

**Problem**: `Error: listen EADDRINUSE: address already in use :::2689`

**Cause**: Another process is using port 2689, or a previous instance is still running.

**Solutions**:

1. **Find and kill the process**:

   **Windows**:
   ```cmd
   netstat -ano | findstr :2689
   taskkill /PID <PID> /F
   ```

   **Linux/Mac**:
   ```bash
   lsof -i :2689
   kill -9 <PID>
   ```

2. **Change the port** in `config.json5`:
   ```json5
   {
       port: 3000,  // Use a different port
   }
   ```
   Don't forget to update your browser proxy settings!

3. **Check for zombie processes**:
   - Open Task Manager (Windows) or Activity Monitor (Mac)
   - Look for lingering `node` processes
   - Kill them

### Error: Cannot find module './config.json5'

**Problem**: Server can't find configuration file

**Cause**: Missing `config.json5` in project root

**Solution**:
```bash
cp config/example.json5 config.json5
```

Then edit `config.json5` with your settings.

### Error: Configuration validation failed

**Problem**: Invalid configuration values

**Cause**: Config file has incorrect values

**Solution**: Check error messages and fix values:
```
Configuration validation failed:
  - config.port must be between 1 and 65535
  - config.akamTester.interval must be at least 300 seconds
```

See `config/example.json5` for valid values.

### Error: Cannot find module 'tcp-ping'

**Problem**: Dependencies not installed

**Cause**: Forgot to run `npm install`

**Solution**:
```bash
npm install
```

## Proxy Not Working

### No Proxy Logs Appearing

**Problem**: Server starts, but no "proxy request" logs when browsing

**Possible Causes**:

1. **Browser extension not configured**
   - Verify proxy profile points to `127.0.0.1:2689`
   - Check auto-switch rule for `*.akamaized.net`
   - Ensure extension is activated

2. **Not accessing Bilibili content**
   - This proxy ONLY works with Bilibili CDN domains
   - Try playing a Bilibili video: https://www.bilibili.com/video/*
   - Regular websites won't trigger proxy logs (expected)

3. **Browser using QUIC/HTTP3**
   - QUIC bypasses HTTP proxy
   - Disable QUIC in browser settings:
     - Chrome: `chrome://flags/#enable-quic` → Disabled
     - Firefox: `about:config` → `network.http.http3.enabled` → false

4. **DNS caching**
   - Clear browser cache
   - Flush DNS: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)

### Browser Shows "Proxy Connection Failed"

**Problem**: Can't access any websites

**Cause**: Proxy server not running or wrong port

**Solution**:

1. **Verify server is running**:
   ```bash
   npm start
   ```
   Look for: `forward proxy server started, listening on port 2689`

2. **Check port matches** browser settings:
   - Config: `port: 2689`
   - Browser: `127.0.0.1:2689`
   - Must match!

3. **Test proxy manually**:
   ```bash
   curl -x http://127.0.0.1:2689 http://example.com
   ```
   Should return HTML (pass-through works).

### Proxy Works But Video Still Slow

**Problem**: Proxy running, logs show requests, but still slow

**Possible Causes**:

1. **Best server is still slow**
   - Check log: `The best server is X.X.X.X which delay is XXXms`
   - If delay > 500ms, IP list may be outdated

**Solution**: Update IP list:
   ```bash
   cd tools/akamTester
   python akamTester.py -u upos-hz-mirrorakam.akamaized.net
   ```
   Copy IPs to `data/ip_list.txt` and restart.

2. **Network congestion**
   - Run `refreshBest()` manually by restarting server
   - Current conditions might favor different IP

3. **ISP throttling**
   - Some ISPs throttle video streaming
   - Proxy can't bypass ISP-level throttling

## Configuration Errors

### Python executable not found

**Problem**: akamTester fails with "Python executable not found"

**Cause**: Python not installed or wrong path

**Solutions**:

1. **Install Python 3**:
   - Download: https://www.python.org/downloads/
   - Make sure "Add to PATH" is checked during installation

2. **Update pythonPath** in `config.json5`:

   **Windows**:
   ```json5
   pythonPath: 'python',  // or 'C:\\Python312\\python.exe'
   ```

   **Linux/Mac**:
   ```json5
   pythonPath: 'python3',  // or '/usr/bin/python3'
   ```

3. **Verify Python works**:
   ```bash
   python --version
   # or
   python3 --version
   ```

### Conda environment not found

**Problem**: Using conda but environment not accessible

**Cause**: Conda environment doesn't exist or wrong name

**Solutions**:

1. **List conda environments**:
   ```bash
   conda env list
   ```

2. **Update config** with correct name:
   ```json5
   condaEnv: 'AKAMTester',  // Use actual environment name
   ```

3. **Or disable conda**, use system Python:
   ```json5
   condaEnv: null,
   pythonPath: 'python3',
   ```

### akamTester execution failed

**Problem**: akamTester runs but fails

**Cause**: Missing Python dependencies

**Solution**: Install requirements:
```bash
cd tools/akamTester
pip install -r requirements.txt
```

Test manually:
```bash
python akamTester.py -u upos-hz-mirrorakam.akamaized.net
```

## IP Discovery Issues

### akamTester timeout

**Problem**: "akamTester execution timed out after 600000ms"

**Cause**: akamTester taking longer than timeout (slow DNS sources)

**Solutions**:

1. **Increase timeout** in `config.json5`:
   ```json5
   timeout: 900000,  // 15 minutes
   ```

2. **Accept slower runs**:
   - This is normal behavior
   - Server continues with existing IPs
   - Next run may succeed

3. **Run manually** when needed:
   ```bash
   cd tools/akamTester
   python akamTester.py -u upos-hz-mirrorakam.akamaized.net
   ```

### akamTester is already running, skipping

**Problem**: Multiple akamTester runs trying to execute simultaneously

**Cause**: Previous run still executing when next interval triggers

**Solutions**:

1. **Increase interval** in `config.json5`:
   ```json5
   interval: 1800,  // 30 minutes instead of 15
   ```

2. **This is normal behavior** (mutex protection):
   - Prevents concurrent runs
   - Previous run will complete
   - Next interval will run normally

### Too many/too few IPs in list

**Problem**: IP list growing too large or shrinking too much

**Solutions**:

1. **Adjust maxIps**:
   ```json5
   maxIps: 300,  // Increase limit
   ```

2. **Dead IPs removed automatically**:
   - IPs that fail 5+ times are removed
   - This is expected behavior
   - Keeps list healthy

3. **Manual IP management**:
   - Edit `data/ip_list.txt` directly
   - One IP per line
   - Restart server to apply

## Performance Issues

### High CPU usage

**Problem**: Node process using excessive CPU

**Possible Causes**:

1. **During IP testing** (expected):
   - Brief spike every hour during `refreshBest()`
   - CPU returns to normal after testing

2. **Continuous high usage**:
   - Check for infinite loops in logs
   - Restart server
   - Report as bug if persists

### High memory usage

**Problem**: Memory usage growing over time

**Cause**: Large IP list or memory leak

**Solutions**:

1. **Reduce maxIps**:
   ```json5
   maxIps: 100,  // Smaller limit
   ```

2. **Restart periodically**:
   - Set up cron job or task scheduler
   - Restart once per day

3. **Monitor with**:
   ```bash
   node --expose-gc --max-old-space-size=512 index.js
   ```

## Debug Logging

### Enable verbose logging

The proxy includes comprehensive debug logging by default.

**HTTP Request Logging** (10 steps):
```
=== HTTP PROXY REQUEST DEBUG ===
1. Raw URL: http://...
2. Method: GET
3. HTTP Version: 1.1
4. Headers: {...}
5. Parsed URL successfully
6. Mapped hostname: X.X.X.X
7. Final options: {...}
8. Request created successfully
9. Response received: 200
10. Proxy request completed
```

**HTTPS CONNECT Logging** (8 steps):
```
=== HTTPS CONNECT REQUEST DEBUG ===
1. CONNECT request received
2. Target host: example.com:443
3. Parsed successfully
4. Mapped to: X.X.X.X:443
...
```

### Disable debug logging

If logs are too verbose, edit source files:

**`src/proxy/server.js`**:
- Comment out `console.log()` statements
- Keep `console.error()` for errors

### Enable clientError debugging

For connection errors, rawPacket hex dumps are logged:

```
clientError: Parse Error
Raw packet (first 200 bytes):
16 03 01 00 a5 01 00 00 a1 03 03...
```

This helps diagnose SSL/TLS issues.

## Still Having Issues?

1. **Check all logs carefully** - Error messages are descriptive
2. **Verify configuration** against `config/example.json5`
3. **Test components individually**:
   - Can you ping IPs manually?
   - Does akamTester run standalone?
   - Does proxy work without browser?
4. **Search existing issues** on GitHub
5. **Create detailed bug report** with:
   - Error messages
   - Configuration (redact sensitive info)
   - Steps to reproduce
   - System info (OS, Node version, Python version)

## Quick Checklist

Before asking for help, verify:

- [ ] `npm install` completed successfully
- [ ] `config.json5` exists and is valid
- [ ] Port is not in use by another process
- [ ] Proxy server shows "started, listening on port XXXX"
- [ ] Browser proxy extension configured correctly
- [ ] Testing with actual Bilibili video URL
- [ ] Logs show "proxy request" when accessing Bilibili

## See Also

- [Setup Guide](SETUP.md) - Detailed installation steps
- [Architecture](ARCHITECTURE.md) - How components work
- [API Reference](API.md) - Code documentation
