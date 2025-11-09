var net = require('net');
var http = require('http');
var proxyMap = require('./proxy-map');

module.exports = (mapper, serverPort) => {
  var proxyServer = http.createServer(httpOptions);

  // handle http proxy requests
  function httpOptions(clientReq, clientRes) {
    var reqUrl = new URL(clientReq.url);
    console.log('proxy for http request: ' + reqUrl.href);

    // Create plain object for proxyMap
    var urlInfo = {
      hostname: reqUrl.hostname,
      port: reqUrl.port || (reqUrl.protocol === 'https:' ? 443 : 80)
    };
    const { hostname, port } = proxyMap(mapper, urlInfo)

    var options = {
      hostname: hostname,
      port: port,
      path: reqUrl.pathname + reqUrl.search,
      method: clientReq.method,
      headers: clientReq.headers
    };

    // create socket connection on behalf of client, then pipe the response to client response (pass it on)
    var serverConnection = http.request(options, function (res) {
      clientRes.writeHead(res.statusCode, res.headers)
      res.pipe(clientRes);
    });

    clientReq.pipe(serverConnection);

    clientReq.on('error', (e) => {
      if (e.code === 'ECONNABORTED' || e.code === 'ECONNRESET') {
        console.log('client disconnected: ' + e.message);
      } else {
        console.log('client socket error: ' + e);
      }
    });

    serverConnection.on('error', (e) => {
      if (e.code === 'ECONNABORTED' || e.code === 'ECONNRESET') {
        console.log('server disconnected: ' + e.message);
      } else {
        console.log('server connection error: ' + e);
      }
    });
  }

  // handle https proxy requests (CONNECT method)
  proxyServer.on('connect', (clientReq, clientSocket, head) => {
    var reqUrl = new URL('https://' + clientReq.url);
    console.log('proxy for https request: ' + reqUrl.href + '(path encrypted by ssl)');

    // Create plain object for proxyMap
    var urlInfo = {
      hostname: reqUrl.hostname,
      port: reqUrl.port || 443
    };
    const { hostname, port } = proxyMap(mapper, urlInfo)

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
      if (e.code === 'ECONNABORTED' || e.code === 'ECONNRESET') {
        console.log("client disconnected: " + e.message);
      } else {
        console.log("client socket error: " + e);
      }
      if (serverSocket && !serverSocket.destroyed) {
        serverSocket.destroy();
      }
    });

    serverSocket.on('error', (e) => {
      if (e.code === 'ECONNABORTED' || e.code === 'ECONNRESET') {
        console.log("server disconnected: " + e.message);
      } else {
        console.log("forward proxy server connection error: " + e);
      }
      if (clientSocket && !clientSocket.destroyed) {
        clientSocket.destroy();
      }
    });
  });

  proxyServer.on('clientError', (err, clientSocket) => {
    console.log('client error: ' + err);
    clientSocket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });

  proxyServer.listen(serverPort);

  console.log('forward proxy server started, listening on port ' + serverPort);

  return proxyServer
};
