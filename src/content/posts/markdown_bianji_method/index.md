---
title: "markdowen 格式编辑办法"
published: 2026-07-20
description: "在编辑我的学习笔记时发现不能直接复制AI的输出，公式会出错"
image: ""
tags: []
category: ""
section: learning
draft: false
lang: zh_CN
---
在 VS Code 里按：

```text
Ctrl + H
```

推荐开启正则表达式，只替换单独占一行的方括号。

点击查找框右侧的 `.*`，然后：

查找：

```regex
^\s*\[\s*$
```

替换：

```text
$$$$
```

再查找：

```regex
^\s*\]\s*$
```

替换：

```text
$$$$
```

这样只会把这种：

```markdown
[
x_1, x_2
]
```

替换为：

```markdown
$$
x_1, x_2
$$
```

不会误伤正文里的 `[链接]`、数组 `[1, 2, 3]` 等内容。

第二种情况是解析成了（），比如：(\nabla_\theta L)，无法识别。

按 `Ctrl + H`，开启正则 `.*`。

查找：

```regex
\((\\[^()\r\n]+)\)
```

替换：

```text
$$$1$$
```

它会把：

```markdown
(\nabla_\theta L)
(\eta)
```

替换成：

```markdown
$\nabla_\theta L$
$\eta$
```

注意：替换框里的 `$$` 表示一个普通 `$`，所以：

```text
$$$1$$
```

实际含义是：

```text
$ + 原公式内容 + $
```

建议先点击“逐个替换”检查几处，不要直接全部替换，因为正文中的普通括号也可能被匹配。



