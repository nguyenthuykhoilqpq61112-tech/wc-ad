# 部署指南 (Deployment Guide)

本项目为独立前端管理后台（React + TypeScript + Vite + Tailwind CSS + Lucide Icons）。
由于业务数据计算与自动流水引擎完全运行在前端（或对接指定服务端），部署非常轻量灵活。

---

## 方案一：Docker 容器部署（推荐，全环境通用）

服务器需安装 Docker。项目内置了轻量级多阶段构建 `Dockerfile` 及 Nginx 配置。

### 1. 构建镜像
在解压后的项目根目录下执行：
```bash
docker build -t wc-admin:latest .
```

### 2. 启动容器
```bash
docker run -d \
  --name wc-admin \
  --restart always \
  -p 8080:8080 \
  wc-admin:latest
```
*启动后访问 `http://<服务器IP>:8080` 即可。如需改成 80 端口，可设为 `-p 80:8080`。*

---

## 方案二：Nginx / 宝塔面板 / 静态服务器部署（零运行时依赖）

如果服务器已有 Nginx、Apache、Caddy 或宝塔面板，可以直接使用已编译的 `dist` 目录。

### Nginx 配置示例：
```nginx
server {
    listen 80;
    server_name your-admin-domain.com; # 替换为您自己的域名或IP
    root /www/wwwroot/wc-admin/dist;   # 替换为您存放dist静态文件的实际绝对路径
    index index.html;

    location / {
        # 支持前端路由刷新不 404
        try_files $uri $uri/ /index.html;
    }

    # 开启 gzip 加速（可选）
    gzip on;
    gzip_min_length 1k;
    gzip_types text/plain application/javascript application/x-javascript text/css application/xml text/javascript;
}
```
配置完成后重载 Nginx：
```bash
nginx -t && nginx -s reload
```

---

## 方案三：Node.js 环境直接运行

如果服务器已安装 Node.js (推荐 v18+ 或 v20+)：

### 1. 安装依赖并编译构建
```bash
npm install
npm run build
```

### 2. 预览运行或使用 PM2 守护进程
```bash
# 方式 A：临时预览运行
npm run preview -- --host 0.0.0.0 --port 8080

# 方式 B：全局安装 serve 并使用 pm2 后台守护
npm install -g serve pm2
pm2 start "serve -s dist -l 8080" --name "wc-admin"
pm2 save
pm2 startup
```

---

## 环境变量说明（可选）

如需接入生产后端主站或配置提现密码，可在部署环境中配置以下环境变量（或在根目录创建 `.env.production`）：
```env
VITE_API_BASE_URL=https://2026wc.zeabur.app
VITE_EXCHANGE_WITHDRAW_PASSWORD=your-private-password
```
*(未配置时系统将自动以独立模式平稳运行，各项数据与自动流水引擎保持完整运作)*
