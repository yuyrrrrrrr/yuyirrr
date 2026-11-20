# 部署 model.yuyirrr.com

该子站是独立的 Node 服务，页面和 API 共用 SQLite；Nginx 只负责 HTTPS 和反向代理，主站静态发布不受影响。

## 1. 准备运行环境

要求 Node.js 24+、Ollama 和 Nginx。Node 24 才能直接使用内置的 `node:sqlite`。

先确认 Ollama 中已有 MiniMind。模型 tag 可以自定义，但必须和 `OLLAMA_MODEL` 一致：

```bash
ollama list
ollama run minimind "用一句话介绍你自己"
```

如果 MiniMind 以 GGUF 文件提供，先导入 Ollama：

```bash
cat > Modelfile <<'EOF'
FROM ./minimind.gguf
PARAMETER num_ctx 2048
PARAMETER temperature 0.7
EOF
ollama create minimind -f Modelfile
```

如果资料是 PyTorch 权重而不是 GGUF，需要先按 MiniMind 项目的转换说明导出 GGUF。不要把官方仓库或未经核实的 registry tag 当作固定地址，以本机 `ollama list` 的结果为准。

## 2. 创建目录和配置

在服务器仓库目录运行：

```bash
sudo install -d -o deploy -g deploy -m 0755 /var/www/yuyirrr-model /var/www/yuyirrr-model/releases
sudo install -d -o deploy -g deploy -m 0750 /var/lib/yuyirrr-model
sudo install -d -o deploy -g deploy -m 0750 /home/deploy/.config/yuyirrr-model
sudo -u deploy cp deploy/model.env.example /home/deploy/.config/yuyirrr-model/env
sudo -u deploy install -Dm644 deploy/systemd/yuyirrr-model.service /home/deploy/.config/systemd/user/yuyirrr-model.service
sudo loginctl enable-linger deploy
```

检查 `/home/deploy/.config/yuyirrr-model/env`。浏览器只访问 Nginx，所以 `HOST` 保持 `127.0.0.1`，只开放 `3210` 给本机代理。

## 3. 配置 Nginx 与 DNS

先确认 `model.yuyirrr.com` 的 `A`/`AAAA` 记录指向当前服务器，再运行：

```bash
sudo cp deploy/nginx/model.yuyirrr.com.http.conf /etc/nginx/sites-available/model.yuyirrr.com
sudo ln -sfn /etc/nginx/sites-available/model.yuyirrr.com /etc/nginx/sites-enabled/model.yuyirrr.com
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d model.yuyirrr.com
sudo cp deploy/nginx/model.yuyirrr.com.https.conf /etc/nginx/sites-available/model.yuyirrr.com
sudo nginx -t && sudo systemctl reload nginx
```

## 4. 发布和启动

推送到 `main` 后，GitHub Actions 会把 `model/` 发布到 `/var/www/yuyirrr-model/releases/<sha>`，切换 `current` 并重启用户级服务。

首次推送前服务文件需要已经安装；首次发布后检查：

```bash
ssh deploy@SERVER 'export XDG_RUNTIME_DIR=/run/user/$(id -u); systemctl --user status yuyirrr-model --no-pager'
curl https://model.yuyirrr.com/api/health
curl -I https://model.yuyirrr.com/
```

若手动启动：

```bash
sudo -u deploy bash -lc 'export XDG_RUNTIME_DIR=/run/user/$(id -u); systemctl --user daemon-reload; systemctl --user enable --now yuyirrr-model'
```

## 数据与过期

- 数据库：`/var/lib/yuyirrr-model/chat.sqlite`
- 浏览器标识：HttpOnly、SameSite=Lax 的匿名 Cookie，数据库只保存令牌的 SHA-256 哈希
- 过期策略：从首次建立匿名会话起 24 小时；不会因为持续聊天而续期
- 清理方式：请求时检查到期数据，进程每 15 分钟主动清理；服务重启后会再次清理

服务端配置 `DATA_DIR` 和 `OLLAMA_MODEL` 即可切换数据库位置与模型 tag，不需要改业务代码。
