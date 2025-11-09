Now for this project, you are a senior nodejs developer. You are given a project with the following requirements:

Errors occurred when I ran the project:
1.
```shell
(base) PS I:\Software\akam-proxy\akam-proxy> npm start

> akam-proxy@1.0.0 start
> node index

forward proxy server started, listening on port 2689
chinaz servers count: 0
WARNING: chinaz.com HTML structure may have changed
No server list found with selector "#speedlist .listw"
IP discovery disabled. Using existing ip_list.txt
To manually update IPs, use: nslookup upos-hz-mirrorakam.akamaized.net
available servers count: 75
Pinging ipList
save chinaz results successfully
The best server is 67.69.196.154 which delay is 16.654666666666667ms
client error: Error: Parse Error: Invalid method encountered
client error: Error: Parse Error: Invalid method encountered
client error: Error: Parse Error: Invalid method encountered
client error: Error: Parse Error: Invalid method encountered
client error: Error: Parse Error: Invalid method encountered
client error: Error: Parse Error: Invalid method encountered
```

Remove the @chinazPing.js method, as th website is no longer available. I think the ip_list.txt file is not updated. Please update the ip_list.txt file to the latest ip addresses. Use the nslookup command to get the latest ip addresses. Though I can ping the address such as 67.69.196.154, I am not sure if that address is still associated with bilibili.com or under its cdn addresses. Please also update the CLAUDE.md file accordingly. 