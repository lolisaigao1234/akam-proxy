Now for this project, you are a senior nodejs and python developer. You are given a project with the following requirements:

I have created a new python directory. 

Read the python\akamTester-master directory, and the readme file @python\akamTester-master\README.md, and the file @python\akamTester-master\akamTester.py file.

Update the ip_list.txt file using the result of the akamTester.py file.
```bash
python akamTester.py -u upos-sz-mirroraliov.bilivideo.com upos-hz-mirrorakam.akamaized.net
```

The result should be like this:
```
(AKAMTester) PS I:\Software\akam-proxy\akam-proxy\python\akamTester-master> python akamTester.py -u upos-sz-mirroraliov.bilivideo.com upos-hz-mirrorakam.akamaized.net
当前 akamTester 版本: 6.0

当前测试域名：upos-sz-mirroraliov.bilivideo.com
第一次解析:
正在同时透过多个来源抓取 upos-sz-mirroraliov.bilivideo.com 的全球解析结果…
抓取 viewdns.info 失败: HTTPSConnectionPool(host='viewdns.info', port=443): Read timed out. (read timeout=10)
upos-sz-mirroraliov.bilivideo.com 的全球解析已完成，共获得 21 个 IP
第 2 次解析:
正在同时透过多个来源抓取 upos-sz-mirroraliov.bilivideo.com 的全球解析结果…
抓取 viewdns.info 失败: HTTPSConnectionPool(host='viewdns.info', port=443): Read timed out. (read timeout=10)
upos-sz-mirroraliov.bilivideo.com 的全球解析已完成，共获得 21 个 IP
第 3 次解析:
正在同时透过多个来源抓取 upos-sz-mirroraliov.bilivideo.com 的全球解析结果…
抓取 viewdns.info 失败: HTTPSConnectionPool(host='viewdns.info', port=443): Read timed out. (read timeout=10)
upos-sz-mirroraliov.bilivideo.com 的全球解析已完成，共获得 69 个 IP

共取得 48 个 IP, 开始测试 HTTPS 连接延迟
155.102.130.200 HTTPS连接延迟: 431.0 ms
155.102.130.201 HTTPS连接延迟: 436.7 ms
155.102.130.199 HTTPS连接延迟: 443.8 ms
47.246.20.201   HTTPS连接延迟: 513.8 ms
155.102.130.204 HTTPS连接延迟: 513.5 ms
163.181.246.206 HTTPS连接延迟: 515.3 ms
155.102.130.197 HTTPS连接延迟: 581.2 ms
47.246.20.199   HTTPS连接延迟: 584.1 ms
47.246.23.182   HTTPS连接延迟: 647.1 ms
47.246.23.184   HTTPS连接延迟: 651.8 ms
47.246.23.180   HTTPS连接延迟: 654.8 ms
47.246.2.230    HTTPS连接延迟: 796.3 ms
47.246.38.175   HTTPS连接延迟: 843.2 ms
47.246.38.176   HTTPS连接延迟: 844.2 ms
47.246.38.219   HTTPS连接延迟: 859.3 ms
47.246.38.181   HTTPS连接延迟: 880.3 ms
47.246.38.174   HTTPS连接延迟: 880.2 ms
47.246.2.227    HTTPS连接延迟: 883.2 ms
155.102.130.203 HTTPS连接延迟: 440.3 ms
47.246.20.197   HTTPS连接延迟: 450.3 ms
47.246.38.177   HTTPS连接延迟: 908.2 ms
155.102.130.202 HTTPS连接延迟: 432.8 ms
47.246.2.225    HTTPS连接延迟: 949.8 ms
155.102.130.198 HTTPS连接延迟: 469.4 ms
47.246.23.178   HTTPS连接延迟: 487.9 ms
163.181.246.201 HTTPS连接延迟: 431.6 ms
47.246.20.203   HTTPS连接延迟: 459.4 ms
47.246.23.179   HTTPS连接延迟: 468.2 ms
47.246.38.178   HTTPS连接延迟: 771.9 ms
163.181.246.208 HTTPS连接延迟: 457.6 ms
47.246.2.231    HTTPS连接延迟: 722.3 ms
47.246.38.220   HTTPS连接延迟: 784.4 ms
163.181.246.204 HTTPS连接延迟: 540.9 ms
47.246.20.202   HTTPS连接延迟: 536.5 ms
47.246.23.177   HTTPS连接延迟: 583.1 ms
163.181.246.207 HTTPS连接延迟: 555.9 ms
47.246.20.198   HTTPS连接延迟: 583.5 ms
163.181.246.202 HTTPS连接延迟: 586.0 ms
163.181.246.205 HTTPS连接延迟: 505.8 ms
47.246.20.200   HTTPS连接延迟: 497.3 ms
47.246.23.181   HTTPS连接延迟: 545.7 ms
47.246.20.196   HTTPS连接延迟: 468.5 ms
163.181.246.203 HTTPS连接延迟: 469.7 ms
47.246.23.183   HTTPS连接延迟: 613.2 ms
47.246.2.228    HTTPS连接延迟: 805.9 ms
47.246.2.229    HTTPS连接延迟: 732.1 ms
47.246.2.232    HTTPS连接延迟: 1391.0 ms
47.246.2.226    HTTPS连接延迟: 1725.7 ms

本次测试未能找到 HTTPS 连接延迟低于200ms的IP! 以下为延迟最低的 3 个节点
155.102.130.200 HTTPS连接延迟: 431.0 ms
163.181.246.201 HTTPS连接延迟: 431.6 ms
155.102.130.202 HTTPS连接延迟: 432.8 ms
------------------------------------------------------------

当前测试域名：upos-hz-mirrorakam.akamaized.net
第一次解析:
正在同时透过多个来源抓取 upos-hz-mirrorakam.akamaized.net 的全球解析结果…
upos-hz-mirrorakam.akamaized.net 的全球解析已完成，共获得 55 个 IP
第 2 次解析:
正在同时透过多个来源抓取 upos-hz-mirrorakam.akamaized.net 的全球解析结果…
upos-hz-mirrorakam.akamaized.net 的全球解析已完成，共获得 64 个 IP
第 3 次解析:
正在同时透过多个来源抓取 upos-hz-mirrorakam.akamaized.net 的全球解析结果…
upos-hz-mirrorakam.akamaized.net 的全球解析已完成，共获得 71 个 IP

共取得 58 个 IP, 开始测试 HTTPS 连接延迟
23.200.156.196  HTTPS连接延迟: 373.1 ms
23.220.206.132  HTTPS连接延迟: 388.7 ms
104.84.231.99   HTTPS连接延迟: 404.2 ms
104.84.231.104  HTTPS连接延迟: 417.0 ms
23.207.202.147  HTTPS连接延迟: 456.0 ms
23.205.104.35   HTTPS连接延迟: 487.4 ms
23.205.104.23   HTTPS连接延迟: 505.2 ms
23.46.216.75    HTTPS连接延迟: 535.8 ms
2.16.103.48     HTTPS连接延迟: 719.4 ms
2.16.154.138    HTTPS连接延迟: 721.9 ms
23.47.72.157    HTTPS连接延迟: 414.2 ms
23.202.35.138   HTTPS连接延迟: 826.8 ms
23.202.35.200   HTTPS连接延迟: 831.8 ms
23.200.156.200  HTTPS连接延迟: 373.1 ms
23.202.35.194   HTTPS连接延迟: 879.1 ms
23.202.35.169   HTTPS连接延迟: 880.8 ms
23.202.35.113   HTTPS连接延迟: 881.7 ms
23.202.35.131   HTTPS连接延迟: 908.0 ms
23.202.35.155   HTTPS连接延迟: 911.6 ms
23.196.236.24   HTTPS连接延迟: 977.0 ms
23.196.236.17   HTTPS连接延迟: 1023.9 ms
23.196.236.9    HTTPS连接延迟: 1026.9 ms
2.16.154.171    HTTPS连接延迟: 611.8 ms
23.202.35.152   HTTPS连接延迟: 702.2 ms
23.202.35.171   HTTPS连接延迟: 724.1 ms
23.202.35.217   HTTPS连接延迟: 740.0 ms
23.202.35.209   HTTPS连接延迟: 738.7 ms
23.202.35.99    HTTPS连接延迟: 707.6 ms
23.205.104.41   HTTPS连接延迟: 456.9 ms
23.46.216.83    HTTPS连接延迟: 478.8 ms
23.220.206.138  HTTPS连接延迟: 424.9 ms
23.47.72.192    HTTPS连接延迟: 463.8 ms
23.47.72.222    HTTPS连接延迟: 436.2 ms
104.84.231.84   HTTPS连接延迟: 464.6 ms
23.213.185.171  HTTPS连接延迟: 563.7 ms
23.202.35.185   HTTPS连接延迟: 808.0 ms
23.202.35.145   HTTPS连接延迟: 825.9 ms
23.202.35.114   HTTPS连接延迟: 833.6 ms
23.207.202.146  HTTPS连接延迟: 509.0 ms
23.202.35.122   HTTPS连接延迟: 797.4 ms
2.16.154.161    HTTPS连接延迟: 702.6 ms
2.16.103.27     HTTPS连接延迟: 663.1 ms
23.202.35.219   HTTPS连接延迟: 810.3 ms
104.84.231.83   HTTPS连接延迟: 452.6 ms
23.207.202.140  HTTPS连接延迟: 465.6 ms
23.202.35.115   HTTPS连接延迟: 783.9 ms
23.47.72.160    HTTPS连接延迟: 363.4 ms
2.16.154.169    HTTPS连接延迟: 630.7 ms
23.202.35.139   HTTPS连接延迟: 753.6 ms
23.202.35.106   HTTPS连接延迟: 737.1 ms
23.207.202.152  HTTPS连接延迟: 423.2 ms
23.213.185.178  HTTPS连接延迟: 395.2 ms
23.202.35.195   HTTPS连接延迟: 730.1 ms
23.202.35.146   HTTPS连接延迟: 738.1 ms
23.196.236.25   HTTPS连接延迟: 872.2 ms
23.196.236.19   HTTPS连接延迟: 848.0 ms
23.202.35.136   HTTPS连接延迟: 688.7 ms
23.202.35.225   HTTPS连接延迟: 656.2 ms

本次测试未能找到 HTTPS 连接延迟低于200ms的IP! 以下为延迟最低的 3 个节点
23.47.72.160    HTTPS连接延迟: 363.4 ms
23.200.156.196  HTTPS连接延迟: 373.1 ms
23.200.156.200  HTTPS连接延迟: 373.1 ms
------------------------------------------------------------
按回车退出
```

But note that in the result, there are error messages:
```Shell
正在同时透过多个来源抓取 upos-sz-mirroraliov.bilivideo.com 的全球解析结果…
抓取 viewdns.info 失败: HTTPSConnectionPool(host='viewdns.info', port=443): Read timed out. (read timeout=10)
```
Help me to fix the error and update the @I:\Software\akam-proxy\akam-proxy\ip_list.txt file accordingly.

Another problem is still the same as before:
```bash
client error: Error: Parse Error: Invalid method encountered
```
Create console.log statements to debug the problem. Make sure create step by step log statements to debug the problem. As this problem is still the same as before, we would have to find the root cause of the problem. Also, the error message is really vague. Is there a way to get the root cause of the problem?

Update the CLAUDE.md file accordingly.