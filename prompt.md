Now for this project, you are a senior nodejs developer. You are given a project with the following requirements:

Errors occurred when I ran the project:
1.
```shell
client error: Error: Parse Error: Invalid method encountered
```

I think the problem exists when I try to proxy a request to the internet. Now it is bricking every single request to bilibili.com. Help me to fix the problem. Update the CLAUDE.md file accordingly.

Also, please update the chinazPing.js file to use the new api. The old api does not work anymore.
The code
```javascript
      const serverList = $('#speedlist .listw')
```
is not working anymore. Please update the code to use the new api. The server list is empty. However, from the result of https://tool.chinaz.com/speedworld/www.bilibili.com, we can see the server list is not empty. 
```Shell
---------- Tracert Result ----------

Domain: www.bilibili.com

Detection result:

1     38.12.36.1     美国加利福尼亚圣何塞 Cogent     1.74ms

2     192.168.0.58     本地局域网     6.26ms

3     10.255.254.8     本地局域网     1.45ms

4     10.255.254.82     本地局域网     2.03ms

5     223.119.66.61     中国香港移动     3.27ms

6     223.120.6.69     中国香港移动     2.84ms

7     223.120.6.9     中国香港移动     14.51ms

8     223.120.6.18     中国香港移动     10.17ms

9     223.119.66.114     中国香港移动     9.76ms

10     192.254.84.91     美国     15.23ms

11     172.22.64.77     本地局域网     14.78ms

12     192.254.90.179     美国加利福尼亚洛杉矶      14.6ms
```