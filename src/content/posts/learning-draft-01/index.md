---
title: "Codex反复尝试重新连接"
published: 2026-07-19
description: "记录解决办法"
image: ""
tags: []
category: 学习札记
section: learning
draft: false
lang: zh_CN
---

最优解决（桌面端+插件通用，不怕更新）
1. 进入 ~/.codex/
2. 新建.env文件
3. 填入全大小写代理配置，替换端口为本地代理端口
env
wss_proxy=http://127.0.0.1:端口
https_proxy=http://127.0.0.1:端口
http_proxy=http://127.0.0.1:端口
all_proxy=http://127.0.0.1:端口
WSS_PROXY=http://127.0.0.1:端口
HTTPS_PROXY=http://127.0.0.1:端口
HTTP_PROXY=http://127.0.0.1:端口
ALL_PROXY=http://127.0.0.1:端口

可以直接复制这一段话给codex，让它来执行解决办法。

