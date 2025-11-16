var net = require('net');
var http = require('http');
var proxyMap = require('./mapper');

module.exports = (mapper, serverPort) => {
  var proxyServer = http.createServer(httpOptions);

  // handle http proxy requests
  function httpOptions(clientReq, clientRes) {
    var options; // Declare outside try block

    try {
      console.log('=== HTTP PROXY REQUEST DEBUG ===');
      console.log('1. Raw URL:', clientReq.url);
      console.log('2. Method:', clientReq.method);
      console.log('3. HTTP Version:', clientReq.httpVersion);
      console.log('4. Headers:', JSON.stringify(clientReq.headers, null, 2));

      var reqUrl = new URL(clientReq.url);
      console.log('5. Parsed URL successfully:', reqUrl.href);
      console.log('   - hostname:', reqUrl.hostname);
      console.log('   - port:', reqUrl.port);
      console.log('   - protocol:', reqUrl.protocol);
      console.log('   - pathname:', reqUrl.pathname);
      console.log('   - search:', reqUrl.search);

      // Create plain object for proxyMap
      var urlInfo = {
        hostname: reqUrl.hostname,
        port: reqUrl.port || (reqUrl.protocol === 'https:' ? 443 : 80)
      };
      console.log('6. urlInfo before proxyMap:', JSON.stringify(urlInfo));

      const { hostname, port } = proxyMap(mapper, urlInfo)
      console.log('7. After proxyMap - hostname:', hostname, 'port:', port);

      options = {
        hostname: hostname,
        port: port,
        path: reqUrl.pathname + reqUrl.search,
        method: clientReq.method,
        headers: clientReq.headers
      };
      console.log('8. Final HTTP request options:', JSON.stringify(options, null, 2));
    } catch (error) {
      console.error('!!! ERROR in httpOptions:');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('clientReq.url:', clientReq.url);
      console.error('clientReq.method:', clientReq.method);
      if (clientRes.writable) {
        clientRes.writeHead(500, {'Content-Type': 'text/plain'});
        clientRes.end('Proxy Error: ' + error.message);
      }
      return;
    }

    console.log('9. Creating HTTP request...');
    // create socket connection on behalf of client, then pipe the response to client response (pass it on)
    var serverConnection = http.request(options, function (res) {
      console.log('10. Received response, status:', res.statusCode);
      clientRes.writeHead(res.statusCode, res.headers)
      res.pipe(clientRes);
    });

    clientReq.pipe(serverConnection);

    clientReq.on('error', (e) => {
      // Silently ignore expected client disconnections (normal behavior)
      if (e.code === 'ECONNABORTED' || e.code === 'ECONNRESET' || e.code === 'EPIPE') {
        return; // Suppress noise - client closed connection early
      }
      // Log only unexpected errors
      console.error('[HTTP] Client request error:', e.code, e.message);
    });

    serverConnection.on('error', (e) => {
      // Silently ignore expected disconnections
      if (e.code === 'ECONNABORTED' || e.code === 'ECONNRESET' || e.code === 'EPIPE') {
        return; // Suppress noise
      }
      // Log genuine server errors
      console.error('[HTTP] Server connection error:', e.code, e.message);
    });
  }

  // handle https proxy requests (CONNECT method)
  proxyServer.on('connect', (clientReq, clientSocket, head) => {
    var hostname, port; // Declare outside try block

    try {
      console.log('=== HTTPS CONNECT REQUEST DEBUG ===');
      console.log('1. Raw URL (CONNECT):', clientReq.url);
      console.log('2. Method:', clientReq.method);
      console.log('3. HTTP Version:', clientReq.httpVersion);
      console.log('4. Head length:', head ? head.length : 0);

      var reqUrl = new URL('https://' + clientReq.url);
      console.log('5. Parsed HTTPS URL:', reqUrl.href);
      console.log('   - hostname:', reqUrl.hostname);
      console.log('   - port:', reqUrl.port);

      // Create plain object for proxyMap
      var urlInfo = {
        hostname: reqUrl.hostname,
        port: reqUrl.port || 443
      };
      console.log('6. urlInfo before proxyMap:', JSON.stringify(urlInfo));

      const result = proxyMap(mapper, urlInfo);
      hostname = result.hostname;
      port = result.port;
      console.log('7. After proxyMap - hostname:', hostname, 'port:', port);
    } catch (error) {
      console.error('!!! ERROR in HTTPS CONNECT handler:');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('clientReq.url:', clientReq.url);
      if (clientSocket.writable) {
        clientSocket.end('HTTP/1.1 500 Internal Server Error\r\n\r\n');
      }
      return;
    }

    console.log('8. Creating HTTPS tunnel...');
    var options = {
      port: port,
      host: hostname
    };

    // create socket connection for client, then pipe (redirect) it to client socket
    var serverSocket = net.connect(options, () => {
      clientSocket.write('HTTP/' + clientReq.httpVersion + ' 200 Connection Established\r\n' +
        'Proxy-agent: Node.js-Proxy\r\n' +
        '\r\n', 'UTF-8', () => {
          // creating pipes in both ends
          serverSocket.write(head);
          serverSocket.pipe(clientSocket);
          clientSocket.pipe(serverSocket);
        });
    });

    clientSocket.on('error', (e) => {
      // Silently ignore expected client disconnections (THIS WAS CAUSING YOUR SPAM!)
      if (e.code === 'ECONNABORTED' || e.code === 'ECONNRESET' || e.code === 'EPIPE') {
        // Clean up silently - this is normal when clients close tabs/connections
        if (serverSocket && !serverSocket.destroyed) {
          serverSocket.destroy();
        }
        return; // Suppress log spam
      }
      // Log only unexpected errors
      console.error('[HTTPS] Client socket error:', e.code, e.message);
      if (serverSocket && !serverSocket.destroyed) {
        serverSocket.destroy();
      }
    });

    serverSocket.on('error', (e) => {
      // Silently ignore expected disconnections
      if (e.code === 'ECONNABORTED' || e.code === 'ECONNRESET' || e.code === 'EPIPE' || e.code === 'ETIMEDOUT') {
        if (clientSocket && !clientSocket.destroyed) {
          clientSocket.destroy();
        }
        return; // Suppress noise
      }
      // Log genuine server errors
      console.error('[HTTPS] Server socket error:', e.code, e.message);
      if (clientSocket && !clientSocket.destroyed) {
        clientSocket.destroy();
      }
    });

    clientSocket.on('close', function() {
      if (serverSocket && !serverSocket.destroyed) {
        serverSocket.destroy();
      }
    });

    serverSocket.on('close', function() {
      if (clientSocket && !clientSocket.destroyed) {
        clientSocket.destroy();
      }
    });
  });

  proxyServer.on('clientError', (err, clientSocket) => {
    console.error('╔══════════════════════════════════════════════════════════════╗');
    console.error('║          CLIENT ERROR DETECTED (Parse Error)                 ║');
    console.error('╚══════════════════════════════════════════════════════════════╝');
    console.error('Error Code:', err.code);
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    // Log as hex for better binary debugging
    console.error('Error rawPacket (first 100 bytes as hex):', err.rawPacket ? err.rawPacket.toString('hex', 0, Math.min(100, err.rawPacket.length)) : 'N/A');
    console.error('Full Error Stack:');
    console.error(err.stack);
    console.error('Socket remote address:', clientSocket.remoteAddress);
    console.error('Socket remote port:', clientSocket.remotePort);
    console.error('Socket local address:', clientSocket.localAddress);
    console.error('Socket local port:', clientSocket.localPort);
    console.error('═══════════════════════════════════════════════════════════════');

    if (clientSocket.writable) {
      clientSocket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    }
  });

  proxyServer.listen(serverPort);

  console.log('forward proxy server started, listening on port ' + serverPort);

  return proxyServer
};
