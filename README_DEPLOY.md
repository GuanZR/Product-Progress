# ArtFlow Tracker 部署指南

## 项目概述

ArtFlow Tracker 是一个基于 React 19 + TypeScript + Vite 构建的项目管理工具，用于跟踪和管理设计项目及其子任务。

## 技术栈

- 前端：React 19 + TypeScript + Vite
- 后端：PHP 8.2 + MariaDB 10
- 部署：Docker + Docker Compose

## 部署准备

### 服务器配置

- 访问端口：8080
- 数据库：MariaDB 10
- phpMyAdmin：8081
- 文件存储路径：/web_project

### 数据库配置

- 数据库名：artflow_tracker
- 用户名：root
- 密码：admin

> **重要说明**：本项目中所有需用到密码的地方默认均使用 `admin` 作为密码，请根据实际需求自行修改。

## 部署步骤

### 0. 预处理：删除套件中心安装的服务（重要）

如果您之前在群晖套件中心安装过 MariaDB 或 phpMyAdmin，需要先删除它们，以避免端口冲突：

1. 登录群晖 DSM（地址：http://[服务器IP]:5000）
2. 打开 **套件中心**
3. 进入 **已安装** 标签页
4. 找到并卸载以下套件：
   - MariaDB 10
   - phpMyAdmin

5. 确认卸载完成后，检查端口占用情况：
   ```bash
   # 通过 SSH 连接到群晖服务器
   ssh admin@[服务器IP]
   
   # 检查 3306 端口是否被占用
   sudo lsof -i :3306
   
   # 检查 8080 端口是否被占用
   sudo lsof -i :8080
   
   # 检查 8081 端口是否被占用
   sudo lsof -i :8081
   ```

### 1. 准备文件

将以下文件上传到群晖服务器的 `/web_project` 目录：

1. **编译后的前端文件**：
   - 从本地项目的 `dist` 目录中上传所有文件到 `/web_project`

2. **API 文件**：
   - `api.php`：位于 `public/api.php`

3. **Docker 配置文件**：
   - `docker-compose.yml`：项目根目录
   - `nginx.conf`：项目根目录

### 2. 上传文件到群晖服务器

#### 方法一：通过群晖 DSM 界面上传

1. 登录群晖 DSM（地址：http://[服务器IP]:5000）
2. 打开 File Station
3. 导航到 `/web_project` 目录
4. 上传所有必要文件

#### 方法二：通过 SSH 上传（使用 SCP 或 SFTP）

```bash
# 上传 dist 目录内容
scp -r dist/* admin@[服务器IP]:/web_project/

# 上传 API 文件
scp public/api.php admin@[服务器IP]:/web_project/

# 上传 Docker 配置文件
scp docker-compose.yml nginx.conf admin@[服务器IP]:/web_project/
```

### 3. 启动 Docker 服务

1. 通过 SSH 连接到群晖服务器：
   ```bash
   ssh admin@[服务器IP]
   ```

2. 进入项目目录：
   ```bash
   cd /web_project
   ```

3. 启动 Docker 服务：
   ```bash
   sudo docker-compose up -d
   ```

4. 检查服务状态：
   ```bash
   sudo docker-compose ps
   ```
   - 确保所有服务状态为 "Up"

### 4. 初始化数据库

1. 访问 phpMyAdmin：http://[服务器IP]:8081
2. 使用以下信息登录：
   - 用户名：root
   - 密码：admin

3. 验证数据库是否自动创建：
   - 左侧导航栏应显示 `artflow_tracker` 数据库
   - 数据库中应包含 `projects`、`subtasks`、`images`、`users` 和 `activity_logs` 表

### 5. 验证部署

1. 访问应用：http://[服务器IP]:8080
2. 检查是否能正常加载页面
3. 测试功能：
   - 创建新项目
   - 保存项目
   - 上传图片
   - 查看项目列表
   - 管理员登录并测试任务指派功能

## 目录结构

```
/web_project/
├── index.html              # 前端入口文件
├── assets/                 # 静态资源文件
│   ├── index-*.js          # 编译后的 JavaScript
│   └── index-*.css         # 编译后的 CSS
├── api.php                 # API 后端文件
├── uploads/                # 图片上传目录（自动创建）
├── docker-compose.yml      # Docker 配置文件
├── nginx.conf              # Nginx 配置文件
└── README_DEPLOY.md        # 部署说明文档
```

## 服务说明

### Docker 服务

| 服务名 | 容器名 | 镜像 | 端口映射 | 用途 |
|--------|--------|------|----------|------|
| web | artflow-web | nginx:latest | 8080:80 | 前端静态文件服务 |
| php | artflow-php | php:8.2-fpm | 无 | PHP 处理 API 请求 |
| db | artflow-db | mariadb:10 | 3306:3306 | 数据库服务 |
| phpmyadmin | artflow-phpmyadmin | phpmyadmin/phpmyadmin:latest | 8081:80 | 数据库管理界面 |

### 端口说明

- 8080：应用访问端口
- 8081：phpMyAdmin 访问端口
- 3306：MySQL 数据库端口（仅内部使用）

## 功能说明

### 管理员功能

1. **项目管理**：创建、编辑、删除项目
2. **任务管理**：添加、编辑、删除子任务
3. **用户管理**：创建、管理用户账号
4. **任务指派**：直接指派任务给任何用户，无需基于设备身份验证
5. **活动日志**：查看系统操作记录

### 普通用户功能

1. **任务认领**：认领分配给自己的任务
2. **任务状态更新**：更新任务进度
3. **文件路径管理**：添加、修改任务文件路径
4. **通知接收**：接收任务指派通知

## 常见问题解决

### 1. 容器无法启动

- 检查端口是否被占用：
  ```bash
  # 通过 SSH 连接到群晖服务器
  ssh admin@[服务器IP]
  
  # 检查 8080 端口是否被占用
  sudo lsof -i :8080
  
  # 检查 8081 端口是否被占用
  sudo lsof -i :8081
  
  # 检查 3306 端口是否被占用
  sudo lsof -i :3306
  ```

- 查看容器日志：
  ```bash
  sudo docker-compose logs [服务名]
  ```

### 2. 数据库连接失败

- 检查数据库服务是否正常运行：
  ```bash
  sudo docker-compose ps db
  ```

- 检查数据库配置是否正确：
  - 确保 `api.php` 中的数据库配置与 `docker-compose.yml` 一致

### 3. 图片上传失败

- 检查 `uploads` 目录权限：
  ```bash
  sudo chmod -R 755 /web_project/uploads
  ```

### 4. 无法访问应用

- 检查防火墙设置，确保 8080 和 8081 端口已开放
- 检查 Nginx 配置是否正确
- 查看 Nginx 日志：
  ```bash
  sudo docker-compose logs web
  ```

### 5. 任务指派失败

- 确保您以管理员身份登录
- 管理员可以直接指派任务给任何用户，无需验证设备身份
- 普通用户只能认领分配给自己的任务

## 维护与更新

### 更新项目

1. 在本地开发环境更新代码：
   ```bash
   # 拉取最新代码（如果使用 Git）
   git pull
   
   # 安装依赖
   npm install
   
   # 重新构建前端项目
   npm run build
   ```

2. 上传新的 `dist` 目录内容到 `/web_project`

3. 重启 Docker 服务：
   ```bash
   sudo docker-compose restart
   ```

### 备份数据

1. 备份数据库：
   ```bash
   sudo docker exec artflow-db mysqldump -u root -padmin artflow_tracker > /web_project/backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. 备份文件：
   ```bash
   sudo cp -r /web_project/uploads /web_project/uploads_backup_$(date +%Y%m%d_%H%M%S)
   ```

### 恢复数据

1. 停止服务：
   ```bash
   sudo docker-compose down
   ```

2. 恢复数据库：
   ```bash
   sudo docker exec -i artflow-db mysql -u root -padmin artflow_tracker < /web_project/backup.sql
   ```

3. 恢复文件：
   ```bash
   sudo cp -r /web_project/uploads_backup/* /web_project/uploads/
   ```

4. 启动服务：
   ```bash
   sudo docker-compose up -d
   ```

## 注意事项

1. **Docker 自启设置**：确保群晖 Docker 服务已设置为开机自启
2. **容器自启策略**：所有容器已配置 `restart: unless-stopped`，服务器重启后会自动恢复
3. **定期备份**：建议定期备份数据库和上传文件
4. **API 配置**：前端已使用相对路径，无需修改 API_BASE_URL
5. **管理员功能**：管理员可以直接指派任务给任何用户，不受设备身份限制
6. **任务指派逻辑**：已移除基于 MAC/IP 地址的身份绑定验证

## 自定义默认子任务

### 修改默认子任务名称

默认的十个子任务名称定义在 `types.ts` 文件中，您可以根据实际需求修改这些名称：

1. 打开 `types.ts` 文件
2. 找到 `SubTaskType` 枚举定义
3. 修改枚举值对应的字符串为您需要的子任务名称
4. 重新构建前端项目：`npm run build`
5. 上传新的 `dist` 目录内容到服务器
6. 重启 Docker 服务：`docker-compose restart`

**示例修改位置**：
```typescript
export enum SubTaskType {
  PRODUCT_PHOTO = '产品拍照',       // 可修改为您需要的名称
  PRODUCT_RETOUCH = '产品修图',     // 可修改为您需要的名称
  // 其他子任务...
}
```

## 联系方式
https://github.com/GuanZR/-.git
如有问题，请提交Issue或Pull Request。

---

部署完成后，您可以通过以下地址访问应用：
- 应用地址：http://[服务器IP]:8080
- phpMyAdmin：http://[服务器IP]:8081

祝您使用愉快！