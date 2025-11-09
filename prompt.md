Now for this project, you are a senior nodejs and python developer. You are given a project with the following requirements:

Error message:
```shell
(base) PS I:\Software\akam-proxy\akam-proxy> npm start

> akam-proxy@1.0.0 start
> node index

Loaded 116 IP addresses from ip_list.txt
To update IPs manually, use: nslookup upos-hz-mirrorakam.akamaized.net
Pinging ipList
forward proxy server started, listening on port 2689
The best server is 23.200.156.196 which delay is 6.3807333333333345ms
╔══════════════════════════════════════════════════════════════╗
║          CLIENT ERROR DETECTED (Parse Error)                 ║
╚══════════════════════════════════════════════════════════════╝
Error Code: HPE_INVALID_METHOD
Error Name: Error
Error Message: Parse Error: Invalid method encountered
Error rawPacket (first 200 bytes): ��4��uv6'�-
                                              2i���8��E��)���a�F�� y2hh�-K����]��r���B}<��� ���+�/�,�0̨̩����/5SjjD�h2#3��::���
    �
��nd��f�ф�l0IQ
Full Error Stack:
Error: Parse Error: Invalid method encountered
Socket remote address: ::ffff:127.0.0.1
Socket remote port: 61168
Socket local address: ::ffff:127.0.0.1
Socket local port: 2689
═══════════════════════════════════════════════════════════════
╔══════════════════════════════════════════════════════════════╗
║          CLIENT ERROR DETECTED (Parse Error)                 ║
╚══════════════════════════════════════════════════════════════╝
Error Code: HPE_INVALID_METHOD
Error Name: Error
Error Message: Parse Error: Invalid method encountered
Error rawPacket (first 200 bytes): F
Full Error Stack:
Error: Parse Error: Invalid method encountered
Socket remote address: ::ffff:127.0.0.1
Socket remote port: 61168
Socket local address: ::ffff:127.0.0.1
Socket local port: 2689
═══════════════════════════════════════════════════════════════
╔══════════════════════════════════════════════════════════════╗
║          CLIENT ERROR DETECTED (Parse Error)                 ║
╚══════════════════════════════════════════════════════════════╝
Error Code: HPE_INVALID_METHOD
Error Name: Error
Error Message: Parse Error: Invalid method encountered
Error rawPacket (first 200 bytes): ���jA�$:�<Iʣi���.`���c�=�e�| l�]B�'*~\د]?����u�2�7"
                                                                                      *�հ� ::�+�/�,�0̨̩����/5sJJ
                                                                                                              hhttp/1.1�3������&�:~(�mPp�Z�wA�i�b9�T�ɷ:
                               ��XT�lr �S
Full Error Stack:
Error: Parse Error: Invalid method encountered
Socket remote address: ::ffff:127.0.0.1
Socket remote port: 49652
Socket local address: ::ffff:127.0.0.1
Socket local port: 2689
```