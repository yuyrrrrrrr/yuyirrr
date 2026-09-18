# 部署到 yuyirrr.com

目标服务器：Ubuntu / Debian，Nginx 直接托管 `/var/www/yuyirrr/current` 的静态文件。

## 1. 首次初始化

在服务器仓库目录运行：

```bash
sudo DEPLOY_USER=deploy bash deploy/bootstrap-server.sh
sudo certbot --nginx -d yuyirrr.com -d www.yuyirrr.com
sudo cp deploy/nginx/yuyirrr.com.https.conf /etc/nginx/sites-available/yuyirrr.com
sudo nginx -t && sudo systemctl reload nginx
```

确认 DNS 的 `A`/`AAAA` 记录已经指向服务器，安全组仅开放需要的 `22`、`80` 和 `443` 端口。

## 2. 配置部署账户

把 GitHub Actions 使用的公钥加入部署账户：

```bash
sudo -u deploy mkdir -p /home/deploy/.ssh
sudo -u deploy chmod 700 /home/deploy/.ssh
sudo -u deploy sh -c 'cat >> /home/deploy/.ssh/authorized_keys'
sudo -u deploy chmod 600 /home/deploy/.ssh/authorized_keys
```

部署账户需要对 `/var/www/yuyirrr` 有写权限，但不需要 `sudo` 权限。

## 3. 配置 GitHub Secrets

进入 GitHub 仓库 `Settings -> Environments -> production`，添加：

- `DEPLOY_HOST`：服务器 IP 或主机名
- `DEPLOY_USER`：`deploy`
- `DEPLOY_PORT`：SSH 端口，默认 `22`
- `DEPLOY_SSH_KEY`：用于部署的私钥全文

不要把私钥提交到仓库。工作流会发布到 `/var/www/yuyirrr/releases/<commit-sha>`，随后原子切换 `current` 软链接，并保留最近五个版本。

## 4. 验证

```bash
curl -I https://yuyirrr.com/
curl -I https://yuyirrr.com/resume.pdf
curl -I https://yuyirrr.com/rss.xml
```

同时检查证书自动续期：

```bash
sudo certbot renew --dry-run
```
