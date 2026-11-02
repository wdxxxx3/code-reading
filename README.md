# 代码阅读面试页（GitHub Pages 版）

每道题一个固定链接，贴在飞书题库文档里，面试时发给候选人。
候选人只能看代码：不能选中、复制、右键、打印；切走窗口、退出全屏、按截图组合键时代码自动隐藏，点一下恢复。

题目在仓库里是加密的，密钥只在链接 `#` 后面（不会发给服务器），所以仓库公开也没关系。

## 目录

| 路径 | 说明 | 提交到 GitHub？ |
|---|---|---|
| `docs/index.html` | 候选人看到的页面 | 是 |
| `docs/p/*.json` | 加密后的题目 | 是 |
| `tools/build.mjs` | 加密题目、生成链接 | 是 |
| `site.json` | 网站地址 | 是 |
| `problems/` | 题目原文 | **否** |
| `links.json` / `links.md` | 每题的密钥和链接 | **否** |

`.gitignore` 已经排除了不该提交的文件。

## 第一次部署

1. 在 GitHub 新建一个仓库（公开即可），把这个文件夹推上去。
2. 仓库 Settings → Pages → Source 选 `Deploy from a branch`，Branch 选 `main`，目录选 `/docs`，保存。
3. 把 `site.json` 里的地址改成 Pages 给的地址，例如 `https://你的用户名.github.io/仓库名/`。
4. 重新生成链接并推送：

```bash
node tools/build.mjs
git add docs site.json && git commit -m "更新题目" && git push
```

## 日常使用

- **加题 / 改题**：把代码文件放进 `problems/`（一题一个文件，扩展名决定高亮语言），运行 `node tools/build.mjs`，提交 `docs/p` 并推送。改题后链接不变。
- **拿链接**：看 `links.md` 或命令输出，贴进飞书题库文档。
- **下线一道题**：从 `problems/` 删掉它，重新运行并推送，旧链接立即失效。
- **换链接**（比如怀疑链接外泄）：从 `links.json` 删掉那道题的条目，重新运行并推送。

需要 Node.js 18 以上，不用装任何依赖。

## 注意

- 链接就是钥匙：飞书题库文档要限制在面试官范围内。
- 题目原文只在本地 `problems/` 和飞书里，不要提交到 GitHub。
- 挡不住截图工具、手机拍屏幕，也挡不住懂技术的人用开发者工具读取页面内容。
