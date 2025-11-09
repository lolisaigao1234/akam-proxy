Now for this project, you are a senior nodejs developer. You are given a project with the following requirements:

Errors occurred when I ran the project:
1.
```Shell
(base) PS I:\Software\akam-proxy\akam-proxy> npm start

> akam-proxy@1.0.0 start
> node index

forward proxy server started, listening on port 2689
get chinaz results error: Error: Forbidden
    at Request.callback (I:\Software\akam-proxy\akam-proxy\node_modules\superagent\lib\node\index.js:835:17)
    at IncomingMessage.<anonymous> (I:\Software\akam-proxy\akam-proxy\node_modules\superagent\lib\node\index.js:1102:18)
    at IncomingMessage.emit (node:events:520:35)
    at endReadableNT (node:internal/streams/readable:1701:12)
    at process.processTicksAndRejections (node:internal/process/task_queues:90:21) {
  status: 403,
  response: <ref *1> Response {
    _events: [Object: null prototype] {},
    _eventsCount: 0,
    _maxListeners: undefined,
    res: IncomingMessage {
      _events: [Object],
      _readableState: [ReadableState],
      _maxListeners: undefined,
      socket: [TLSSocket],
      httpVersionMajor: 1,
      httpVersionMinor: 1,
      httpVersion: '1.1',
      complete: true,
      rawHeaders: [Array],
      rawTrailers: [],
      joinDuplicateHeaders: undefined,
      aborted: false,
      upgrade: false,
      url: '',
      method: null,
      statusCode: 403,
      statusMessage: 'Forbidden',
      client: [TLSSocket],
      _consuming: false,
      _dumped: false,
      req: [ClientRequest],
      _eventsCount: 4,
      text: '<html>\r\n' +
        '<head><title>403 Forbidden</title></head>\r\n' +
        '<body>\r\n' +
        '<center><h1>403 Forbidden</h1></center>\r\n' +
        '<hr><center>nginx</center>\r\n' +
        '</body>\r\n' +
        '</html>\r\n',
      Symbol(shapeMode): true,
      Symbol(kCapture): false,
      Symbol(kHeaders): [Object],
      Symbol(kHeadersCount): 10,
      Symbol(kTrailers): null,
      Symbol(kTrailersCount): 0
    },
    request: Request {
      _events: [Object: null prototype],
      _eventsCount: 1,
      _maxListeners: undefined,
      _enableHttp2: false,
      _agent: false,
      _formData: null,
      method: 'GET',
      url: 'https://ping.chinaz.com/upos-hz-mirrorakam.akamaized.net',
      _header: {},
      header: {},
      writable: true,
      _redirects: 0,
      _maxRedirects: 5,
      cookies: '',
      qs: {},
      _query: [],
      qsRaw: [],
      _redirectList: [],
      _streamRequest: false,
      _lookup: undefined,
      req: [ClientRequest],
      protocol: 'https:',
      host: 'ping.chinaz.com',
      _endCalled: true,
      _callback: [Function (anonymous)],
      _fullfilledPromise: [Promise],
      res: [IncomingMessage],
      _resBuffered: true,
      response: [Circular *1],
      called: true,
      Symbol(shapeMode): false,
      Symbol(kCapture): false
    },
    req: ClientRequest {
      _events: [Object: null prototype],
      _eventsCount: 3,
      _maxListeners: undefined,
      outputData: [],
      outputSize: 0,
      writable: true,
      destroyed: false,
      _last: true,
      chunkedEncoding: false,
      shouldKeepAlive: false,
      maxRequestsOnConnectionReached: false,
      _defaultKeepAlive: true,
      useChunkedEncodingByDefault: false,
      sendDate: false,
      _removedConnection: false,
      _removedContLen: false,
      _removedTE: false,
      strictContentLength: false,
      _contentLength: 0,
      _hasBody: true,
      _trailer: '',
      finished: true,
      _headerSent: true,
      _closed: false,
      _header: 'GET /upos-hz-mirrorakam.akamaized.net HTTP/1.1\r\n' +
        'Host: ping.chinaz.com\r\n' +
        'Accept-Encoding: gzip, deflate\r\n' +
        'Connection: close\r\n' +
        '\r\n',
      _keepAliveTimeout: 0,
      _onPendingData: [Function: nop],
      agent: [Agent],
      socketPath: undefined,
      method: 'GET',
      maxHeaderSize: undefined,
      insecureHTTPParser: undefined,
      joinDuplicateHeaders: undefined,
      path: '/upos-hz-mirrorakam.akamaized.net',
      _ended: true,
      res: [IncomingMessage],
      aborted: false,
      timeoutCb: null,
      upgradeOrConnect: false,
      parser: null,
      maxHeadersCount: null,
      reusedSocket: false,
      host: 'ping.chinaz.com',
      protocol: 'https:',
      Symbol(shapeMode): false,
      Symbol(kCapture): false,
      Symbol(kBytesWritten): 0,
      Symbol(kNeedDrain): false,
      Symbol(corked): 0,
      Symbol(kChunkedBuffer): [],
      Symbol(kChunkedLength): 0,
      Symbol(kSocket): [TLSSocket],
      Symbol(kOutHeaders): [Object: null prototype],
      Symbol(errored): null,
      Symbol(kHighWaterMark): 16384,
      Symbol(kRejectNonStandardBodyWrites): false,
      Symbol(kUniqueHeaders): null
    },
    text: '<html>\r\n' +
      '<head><title>403 Forbidden</title></head>\r\n' +
      '<body>\r\n' +
      '<center><h1>403 Forbidden</h1></center>\r\n' +
      '<hr><center>nginx</center>\r\n' +
      '</body>\r\n' +
      '</html>\r\n',
    files: undefined,
    buffered: true,
    headers: {
      server: 'nginx',
      date: 'Sun, 09 Nov 2025 15:27:09 GMT',
      'content-type': 'text/html',
      'content-length': '146',
      connection: 'close'
    },
    header: {
      server: 'nginx',
      date: 'Sun, 09 Nov 2025 15:27:09 GMT',
      'content-type': 'text/html',
      'content-length': '146',
      connection: 'close'
    },
    statusCode: 403,
    status: 403,
    statusType: 4,
    info: false,
    ok: false,
    redirect: false,
    clientError: true,
    serverError: false,
    error: Error: cannot GET /upos-hz-mirrorakam.akamaized.net (403)
        at Response.toError (I:\Software\akam-proxy\akam-proxy\node_modules\superagent\lib\node\response.js:116:17)
        at ResponseBase._setStatusProperties (I:\Software\akam-proxy\akam-proxy\node_modules\superagent\lib\response-base.js:107:48)
        at new Response (I:\Software\akam-proxy\akam-proxy\node_modules\superagent\lib\node\response.js:47:8)
        at Request._emitResponse (I:\Software\akam-proxy\akam-proxy\node_modules\superagent\lib\node\index.js:881:20)
        at IncomingMessage.<anonymous> (I:\Software\akam-proxy\akam-proxy\node_modules\superagent\lib\node\index.js:1102:38)
        at IncomingMessage.emit (node:events:520:35)
        at endReadableNT (node:internal/streams/readable:1701:12)
        at process.processTicksAndRejections (node:internal/process/task_queues:90:21) {
      status: 403,
      text: '<html>\r\n' +
        '<head><title>403 Forbidden</title></head>\r\n' +
        '<body>\r\n' +
        '<center><h1>403 Forbidden</h1></center>\r\n' +
        '<hr><center>nginx</center>\r\n' +
        '</body>\r\n' +
        '</html>\r\n',
      method: 'GET',
      path: '/upos-hz-mirrorakam.akamaized.net'
    },
    created: false,
    accepted: false,
    noContent: false,
    badRequest: false,
    unauthorized: false,
    notAcceptable: false,
    forbidden: true,
    notFound: false,
    unprocessableEntity: false,
    type: 'text/html',
    links: {},
    setEncoding: [Function: bound ],
    redirects: [],
    pipe: [Function (anonymous)],
    Symbol(shapeMode): false,
    Symbol(kCapture): false
  }
}
Pinging ipList
The best server is 67.69.196.154 which delay is 16.6034ms
proxy for https request: https://upos-sz-mirrorcosov.bilivideo.com:443/(path encrypted by ssl)
(node:18760) [DEP0169] DeprecationWarning: `url.parse()` behavior is not standardized and prone to errors that have security implications. Use the WHATWG URL API instead. CVEs are not issued for `url.parse()` vulnerabilities.
(Use `node --trace-deprecation ...` to show where the warning was created)
proxy for https request: https://upos-hz-mirrorakam.akamaized.net:443/(path encrypted by ssl)
proxy request: upos-hz-mirrorakam.akamaized.net:443 => 67.69.196.154:443
proxy for https request: https://upos-hz-mirrorakam.akamaized.net:443/(path encrypted by ssl)
proxy request: upos-hz-mirrorakam.akamaized.net:443 => 67.69.196.154:443
client socket error: Error: write ECONNABORTED
client socket error: Error: write ECONNABORTED
proxy for https request: https://data.bilibili.com:443/(path encrypted by ssl)
proxy for https request: https://api.bilibili.com:443/(path encrypted by ssl)
proxy for https request: https://www.bilibili.com:443/(path encrypted by ssl)
proxy for https request: https://api.bilibili.com:443/(path encrypted by ssl)
proxy for https request: https://api.live.bilibili.com:443/(path encrypted by ssl)
proxy for https request: https://le3-api.game.bilibili.com:443/(path encrypted by ssl)
proxy for https request: https://passport.bilibili.com:443/(path encrypted by ssl)
proxy for https request: https://api.vc.bilibili.com:443/(path encrypted by ssl)
proxy for https request: https://interface.bilibili.com:443/(path encrypted by ssl)
proxy for https request: https://broadcast.chat.bilibili.com:7826/(path encrypted by ssl)
proxy for https request: https://message.bilibili.com:443/(path encrypted by ssl)
proxy for https request: https://broadcast.chat.bilibili.com:7826/(path encrypted by ssl)
proxy for https request: https://data.bilibili.com:443/(path encrypted by ssl)
client socket error: Error: write ECONNABORTED
proxy for https request: https://upos-hz-mirrorakam.akamaized.net:443/(path encrypted by ssl)
proxy request: upos-hz-mirrorakam.akamaized.net:443 => 67.69.196.154:443
proxy for https request: https://bvc.bilivideo.com:443/(path encrypted by ssl)
proxy for https request: https://broadcast.chat.bilibili.com:7826/(path encrypted by ssl)
proxy for https request: https://broadcast.chat.bilibili.com:7826/(path encrypted by ssl)
client socket error: Error: write ECONNABORTED
proxy for https request: https://upos-hz-mirrorakam.akamaized.net:443/(path encrypted by ssl)
proxy request: upos-hz-mirrorakam.akamaized.net:443 => 67.69.196.154:443
```
2. Error:
```markdown
**The bugs**:
1. `index.js` passes `times` but `chinazPing` expects `retryTime`
2. `index.js` passes `interval` but `chinazPing` expects `waittingInterval` (note typo with double 't')
3. `index.js` reads `config.refreshIpList.retry.time` (singular) but `config.json5` defines `retry.times` (plural)

**Impact**: The retry logic in chinazPing receives `undefined` for both parameters, so it falls back to `async.retry` defaults instead of using the configured values from `config.json5`.

**To fix this bug**:
- Either update `index.js:28` to pass `{retryTime: config.refreshIpList.retry.times, waittingInterval: config.refreshIpList.retry.interval}`
- Or update `chinazPing.js:23` to use `{times: options.times, interval: options.interval}`
- Also fix `config.refreshIpList.retry.time` to `config.refreshIpList.retry.times` in index.js:28
```

Help me to fix these errors and make the project running.

Update teh CLAUDE.md file accordingly.