# 小余App 安卓安装包构建项目

这个文件夹可以把「小余App」网页打包成一个真正的安卓 APK 安装包，
装到手机后就是一个独立的 App，不依赖浏览器、不依赖网站，可以离线使用。
网页里已经包含 `manifest.json` 和 `service-worker.js`，但 APK 是本地打包，
数据会保存在手机本机（IndexedDB）。

---

## 方式一（推荐）：用 GitHub 免费云端打包

不需要在电脑上安装 Android Studio 或安卓开发环境。

### 第 1 步：注册 GitHub
1. 打开 https://github.com
2. 点右上角 Sign up 注册账号（用邮箱即可）。

### 第 2 步：新建仓库
1. 登录后点右上角 `+` → `New repository`。
2. Repository name 填 `xiaoyu-app`（随便）。
3. 选择 `Public` 或 `Private` 都可以（自己用建议 Private）。
4. 点 `Create repository`。

### 第 3 步：上传本文件夹的内容
把**这个文件夹里**的内容上传到刚建的仓库（不要上传 `node_modules` 或 `android` 这两个文件夹，它们本来就没有）：
- `package.json`
- `capacitor.config.json`
- `.gitignore`
- `.github/`
- `www/`
- `README.md`

上传方法二选一：
- 网页拖拽：在仓库页点 `Add file` → `Upload files`，把上述文件和 `www` 文件夹一起拖进去，点 `Commit changes`。
- 或使用 GitHub Desktop。

### 第 4 步：让打包自动开始
- 代码上传后，打开仓库的 `Actions` 标签页。
- 如果提示需要启用，点 `I understand my workflows, go ahead and enable them`。
- 你应该能看到一个叫 `Build Android APK` 的工作流在运行。
- 如果没有自动运行：在 `Actions` 页左侧点 `Build Android APK` → 右侧 `Run workflow` → `Run workflow`。

### 第 5 步：下载安装包
1. 等工作流变成绿色勾（一般 3~8 分钟）。
2. 点进这次运行，最下方 `Artifacts` 里有一个 `xiaoyu-app-debug-apk`。
3. 点它下载到电脑，再传到手机。

---

## 方式二：在电脑本地用 Android Studio 打包

1. 安装 Android Studio（官网：https://developer.android.com/studio）。
2. 安装 Node.js（本文件夹上级目录里已经带了一个 Node，路径见 `小余的app/tools/node`）。
3. 在本文件夹里打开命令行，依次执行：
   ```bash
   npm install
   npx cap add android
   npx cap sync android
   ```
4. 用 Android Studio 打开生成的 `android` 文件夹。
5. 菜单 `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`。
6. 完成后按提示找到 `app-debug.apk`。

---

## 手机安装（vivo S20 Pro）

1. 把 `app-debug.apk` 传到手机（微信文件传输、数据线、网盘都可以）。
2. 在手机上点开这个 apk 文件。
3. 如果提示「禁止安装未知来源应用」，按提示进入设置，允许当前来源安装。
4. 安装完成后，桌面会出现「小余App」图标，点开即可使用。

> 说明：这是个人自用的 Debug 版安装包，不上架应用商店，所以不需要签名证书，
> 直接用调试签名就能装。如果要上架，需要另外配置正式签名。

---

## 常见问题

- **Actions 没有运行**：到仓库 `Settings` → `Actions` → `General`，选择
  `Allow all actions and reusable workflows`，保存后再去 `Actions` 手动 Run workflow。
- **安装提示未知来源**：手机系统设置里允许「安装未知应用」即可。
- **App 数据存在哪**：存在手机本地 IndexedDB 里，卸载 App 会清空；
  建议定期在 App 里点「备份」导出 JSON 文件保存。
- **以后改了网页内容想更新 App**：改 `www` 里的文件后重新按方式一/二打包一次，
  手机卸载旧版再装新版即可（后续也可以加自动更新，这里先不展开）。
- **App 里的「安装App」按钮**：那是给浏览器里“添加到主屏幕”用的；
  在已经安装好的 APK 里用不到，以后可以帮你隐藏掉。