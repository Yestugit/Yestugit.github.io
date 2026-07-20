---
title: "Git 日常常用命令"
published: 2026-07-20
description: "一份适合日常开发使用的 Git 高频命令速查笔记。"
image: ""
tags:
  - Git
  - GitHub
  - 开发工具
category: ""
section: learning
draft: false
lang: zh_CN
---

# Git 日常常用命令

Git 命令很多，但日常开发真正经常使用的主要是：

* 克隆仓库
* 拉取更新
* 查看修改
* 提交代码
* 推送代码
* 创建和切换分支
* 合并分支
* 临时保存修改

本文只整理这些高频操作。

---

## 一、Git 基本工作流程

```text
工作区
  ↓ git add
暂存区
  ↓ git commit
本地仓库
  ↓ git push
远程仓库
```

最常见的提交流程：

```bash
git status
git add .
git commit -m "提交说明"
git push
```

如果远程仓库可能已经更新：

```bash
git pull
git add .
git commit -m "提交说明"
git push
```

---

## 二、首次配置 Git

### 配置用户名

```bash
git config --global user.name "你的用户名"
```

例如：

```bash
git config --global user.name "Yestugit"
```

### 配置邮箱

```bash
git config --global user.email "你的邮箱"
```

例如：

```bash
git config --global user.email "1735837808@qq.com"
```

### 查看 Git 配置

```bash
git config --global --list
```

---

## 三、克隆和初始化仓库

### 克隆远程仓库

```bash
git clone 仓库地址
```

例如：

```bash
git clone https://github.com/Yestugit/Yestugit.github.io.git
```

进入项目目录：

```bash
cd Yestugit.github.io
```

### 克隆到指定文件夹

```bash
git clone 仓库地址 文件夹名称
```

例如：

```bash
git clone https://github.com/Yestugit/Yestugit.github.io.git MyWebsite
```

### 初始化本地仓库

```bash
git init
```

添加远程仓库：

```bash
git remote add origin 远程仓库地址
```

例如：

```bash
git remote add origin https://github.com/Yestugit/example.git
```

---

## 四、查看仓库状态

### 查看当前状态

```bash
git status
```

可以查看：

* 当前所在分支
* 被修改的文件
* 新增的文件
* 已暂存的文件
* 本地与远程仓库的同步状态

这是日常使用频率最高的 Git 命令之一。

### 简洁查看状态

```bash
git status -s
```

常见标记：

| 标记   | 含义         |
| ---- | ---------- |
| `M`  | 文件被修改      |
| `A`  | 文件已添加      |
| `D`  | 文件被删除      |
| `??` | 尚未被 Git 跟踪 |

### 查看当前分支

```bash
git branch --show-current
```

### 查看远程仓库地址

```bash
git remote -v
```

---

## 五、查看文件修改

### 查看尚未暂存的修改

```bash
git diff
```

### 查看已经暂存的修改

```bash
git diff --cached
```

也可以写成：

```bash
git diff --staged
```

### 查看某个文件的修改

```bash
git diff 文件路径
```

例如：

```bash
git diff src/components/Navbar.astro
```

### 查看修改统计

```bash
git diff --stat
```

---

## 六、拉取远程仓库更新

### 拉取当前分支最新代码

```bash
git pull
```

### 指定远程仓库和分支

```bash
git pull origin main
```

### GitHub 更新后同步到本地

```bash
cd 项目路径
git status
git pull origin main
```

例如：

```bash
cd D:\MyWebsite\Yestugit.github.io
git status
git pull origin main
```

### 只获取远程更新，不立即合并

```bash
git fetch
```

然后可以查看状态：

```bash
git status
```

确认后再合并：

```bash
git merge origin/main
```

日常情况下，直接使用下面的命令即可：

```bash
git pull
```

---

## 七、提交本地修改

### 添加指定文件

```bash
git add 文件名
```

例如：

```bash
git add README.md
```

### 添加所有修改

```bash
git add .
```

这会添加：

* 新增文件
* 修改文件
* 删除文件

### 提交修改

```bash
git commit -m "提交说明"
```

例如：

```bash
git commit -m "完善文章归档页面"
```

常见提交说明：

```bash
git commit -m "修复导航栏显示问题"
git commit -m "新增音乐播放器功能"
git commit -m "更新网站背景图片"
git commit -m "完善后训练模块内容"
```

### 添加并提交已跟踪文件

```bash
git commit -am "提交说明"
```

例如：

```bash
git commit -am "修复页面样式问题"
```

需要注意：

```bash
git commit -am
```

不会提交刚创建的新文件。

存在新文件时，仍然需要：

```bash
git add .
git commit -m "提交说明"
```

---

## 八、推送到远程仓库

### 推送当前分支

```bash
git push
```

### 推送到指定分支

```bash
git push origin main
```

### 第一次推送新分支

```bash
git push -u origin 分支名
```

例如：

```bash
git push -u origin feature
```

设置关联后，以后只需要：

```bash
git push
```

### 日常提交并推送

```bash
git status
git add .
git commit -m "描述本次修改"
git push
```

---

## 九、分支常用操作

### 查看本地分支

```bash
git branch
```

### 查看本地和远程分支

```bash
git branch -a
```

### 创建新分支

```bash
git branch 分支名
```

例如：

```bash
git branch feature
```

### 切换分支

```bash
git switch 分支名
```

例如：

```bash
git switch main
```

旧版写法：

```bash
git checkout main
```

### 创建并切换新分支

```bash
git switch -c 分支名
```

例如：

```bash
git switch -c feature
```

旧版写法：

```bash
git checkout -b feature
```

### 切换回上一个分支

```bash
git switch -
```

### 删除已经合并的本地分支

```bash
git branch -d 分支名
```

例如：

```bash
git branch -d feature
```

---

## 十、合并分支

假设已经在 `feature` 分支完成开发，现在要合并到 `main`。

先切换到 `main`：

```bash
git switch main
```

拉取最新代码：

```bash
git pull origin main
```

合并功能分支：

```bash
git merge feature
```

推送到远程仓库：

```bash
git push origin main
```

完整流程：

```bash
git switch main
git pull origin main
git merge feature
git push origin main
```

需要记住：

```bash
git merge feature
```

表示把 `feature` 合并到当前所在的分支。

因此，合并前应确认当前分支：

```bash
git branch --show-current
```

---

## 十一、让开发分支同步 main 更新

假设：

* `main` 分支已经更新
* 你正在自己的开发分支工作
* 希望保留开发分支的修改
* 同时获得 `main` 的最新代码

执行：

```bash
git switch main
git pull origin main
git switch 开发分支名
git merge main
```

例如：

```bash
git switch main
git pull origin main
git switch feature
git merge main
```

需要推送开发分支时：

```bash
git push origin feature
```

完成后，开发分支会同时包含：

* 自己原本的修改
* `main` 分支的最新内容

---

## 十二、本地有修改时拉取更新

如果本地存在未提交修改，执行：

```bash
git pull
```

可能会提示修改会被覆盖。

此时可以使用 `stash` 临时保存修改。

### 临时保存修改

```bash
git stash
```

拉取远程更新：

```bash
git pull
```

恢复本地修改：

```bash
git stash pop
```

完整流程：

```bash
git status
git stash
git pull origin main
git stash pop
```

### 同时保存未跟踪的新文件

```bash
git stash -u
```

然后执行：

```bash
git pull
git stash pop
```

### 添加临时保存说明

```bash
git stash push -u -m "正在修改导航栏"
```

### 查看临时保存记录

```bash
git stash list
```

---

## 十三、不保留本地修改，同步远程仓库

如果明确不需要本地的任何修改，希望本地完全恢复成远程仓库的状态：

```bash
git fetch origin
git reset --hard origin/main
```

如果还要删除未被 Git 跟踪的文件和文件夹：

```bash
git clean -fd
```

完整命令：

```bash
git fetch origin
git reset --hard origin/main
git clean -fd
```

这会删除：

* 未提交的本地修改
* 已提交但尚未推送的本地提交
* 未跟踪的文件和文件夹

执行前务必先检查：

```bash
git status
```

---

## 十四、日常常见场景

### 场景一：GitHub 仓库更新了，同步本地

```bash
cd 项目路径
git status
git pull origin main
```

### 场景二：修改代码后提交到 GitHub

```bash
git status
git add .
git commit -m "描述本次修改"
git push origin main
```

### 场景三：本地有修改，同时远程也更新了

```bash
git stash -u
git pull origin main
git stash pop
```

检查修改后提交：

```bash
git status
git add .
git commit -m "同步远程更新并保留本地修改"
git push
```

### 场景四：main 更新后，同步到开发分支

```bash
git switch main
git pull origin main
git switch 开发分支名
git merge main
```

### 场景五：开发分支合并到 main

```bash
git switch main
git pull origin main
git merge 开发分支名
git push origin main
```

### 场景六：放弃本地修改，完全同步远程

```bash
git fetch origin
git reset --hard origin/main
git clean -fd
```

---

## 十五、最常用命令速查

| 操作      | 命令                          |
| ------- | --------------------------- |
| 克隆仓库    | `git clone 仓库地址`            |
| 查看状态    | `git status`                |
| 查看修改    | `git diff`                  |
| 拉取更新    | `git pull`                  |
| 添加所有修改  | `git add .`                 |
| 提交修改    | `git commit -m "说明"`        |
| 推送代码    | `git push`                  |
| 查看分支    | `git branch`                |
| 查看当前分支  | `git branch --show-current` |
| 创建并切换分支 | `git switch -c 分支名`         |
| 切换分支    | `git switch 分支名`            |
| 合并分支    | `git merge 分支名`             |
| 临时保存修改  | `git stash -u`              |
| 恢复临时修改  | `git stash pop`             |
| 查看远程地址  | `git remote -v`             |

---

## 十六、直接复制的命令模板

### 拉取最新代码

```bash
git status
git pull origin main
```

### 提交并推送代码

```bash
git status
git add .
git commit -m "填写本次修改说明"
git push origin main
```

### 临时保存修改后更新代码

```bash
git status
git stash -u
git pull origin main
git stash pop
```

### main 更新后同步到开发分支

```bash
git switch main
git pull origin main
git switch 开发分支名
git merge main
```

### 将开发分支合并到 main

```bash
git switch main
git pull origin main
git merge 开发分支名
git push origin main
```

### 放弃本地修改并同步远程

```bash
git fetch origin
git reset --hard origin/main
git clean -fd
```

---

## 总结

日常使用 Git，最需要熟悉的是这一组命令：

```bash
git status
git pull
git add .
git commit -m "提交说明"
git push
```

涉及分支时，再掌握：

```bash
git switch
git merge
git stash
```

基本就能够应对大多数日常开发场景。


