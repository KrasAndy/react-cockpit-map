# 发布到 npm 指引

本仓库已经构建完毕,需要发布到 npm 时按以下步骤操作:

## 方式 A:npm login 后直接发布(推荐)

```bash
cd F:/react-cockpit-map

# 1. 登录 npm(需要账号 + 2FA)
npm login
# 输入用户名、密码、邮箱
# 若账号开启了 2FA,根据提示输入 OTP

# 2. 确认 scope 归属(@krasandy 需要 ownership)
# 如果账号 KrasAndy 没有 ownership,先到 https://www.npmjs.com/orgs/create 创建 org
# 或在本机 npm adduser 时填 org:KrasAndy

# 3. 构建 + 发布(prepublishOnly 会自动 build + verify)
npm publish
# 第一次发包会要求确认 --access public(scope 包必须)
# > npm publish --access public
```

## 方式 B:用 GitHub Action 自动发布

在仓库根目录 `.github/workflows/publish.yml` 创建:

```yaml
name: publish
on:
  push:
    tags: ['v*']
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write  # for provenance
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm run verify
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

然后到 https://github.com/KrasAndy/react-cockpit-map/settings/secrets/actions 添加 `NPM_TOKEN` (在 npm → Access Tokens 创建)。

## 方式 C:本地预构建 .tgz → 上传到 npm 网页

```bash
cd F:/react-cockpit-map
npm pack
# 输出: krasandy-react-cockpit-map-0.1.0.tgz

# 到 https://www.npmjs.com/package/@krasandy/react-cockpit-map 网页手动上传
# (需要先在网页创建空包占名,再上传 tarball)
```

---

## 当前状态

✅ GitHub repo:`https://github.com/KrasAndy/react-cockpit-map`
✅ Tag v0.1.0 已推送
✅ GitHub Release:`https://github.com/KrasAndy/react-cockpit-map/releases/tag/v0.1.0`
✅ 本地 tarball:`F:/react-cockpit-map/krasandy-react-cockpit-map-0.1.0.tgz` (21 files, 包含 dist/)
✅ README / LICENSE / CHANGELOG 完整

⏳ 待办:选择上述任一方式发布到 npm registry。

发布后,可以使用:

```bash
npm install @krasandy/react-cockpit-map
```