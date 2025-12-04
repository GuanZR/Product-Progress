# ArtFlow Tracker

一个基于 React 19 + TypeScript + Vite 构建的项目管理工具，用于跟踪和管理设计项目及其子任务。

## 🌟 功能特性

### 项目管理
- 创建、编辑、删除项目
- 项目状态跟踪
- 项目详情查看

### 任务管理
- 添加、编辑、删除子任务
- 任务状态更新
- 任务指派功能

### 用户管理
- 管理员用户管理
- 任务认领机制
- 用户身份验证

### 媒体管理
- 图片上传与管理
- 任务关联媒体文件

### 活动日志
- 系统操作记录
- 任务更新追踪

### 通知系统
- 任务指派通知
- 状态更新通知

## 🛠️ 技术栈

### 前端
- React 19
- TypeScript
- Vite
- CSS Modules

### 后端
- PHP 8.2
- 轻量级 JSON 文件存储

### 部署
- Docker + Docker Compose
- Nginx
- MariaDB 10
- phpMyAdmin

## 🚀 快速开始

### 环境要求
- Docker
- Docker Compose

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/GuanZR/Product-Progress.git
   cd Product-Progress
   ```

2. **构建前端项目**
   ```bash
   npm install
   npm run build
   ```

3. **部署服务**
   ```bash
   # 复制编译后的前端文件到指定目录
   mkdir -p /web_project
   cp -r dist/* /web_project/
   cp public/api.php /web_project/
   cp docker-compose.yml nginx.conf /web_project/
   
   # 启动 Docker 服务
   cd /web_project
   docker-compose up -d
   ```

4. **访问应用**
   - 应用地址：http://[服务器IP]:8080
   - phpMyAdmin：http://[服务器IP]:8081

## 📁 目录结构

```
artflow-tracker/
├── public/                # 静态资源
│   └── api.php           # API 后端文件
├── src/                  # 前端源代码
│   ├── components/       # React 组件
│   ├── hooks/            # 自定义 Hooks
│   ├── types/            # TypeScript 类型定义
│   ├── utils/            # 工具函数
│   ├── App.tsx           # 应用入口组件
│   └── main.tsx          # 应用渲染入口
├── docker-compose.yml    # Docker 配置文件
├── nginx.conf            # Nginx 配置文件
├── package.json          # 项目依赖配置
├── README.md             # 项目说明文档
├── README_DEPLOY.md      # 部署指南
└── tsconfig.json         # TypeScript 配置
```

## 🔧 配置说明

### 数据库配置
- 数据库名：artflow_tracker
- 用户名：root
- 密码：admin

> **重要说明**：本项目中所有需用到密码的地方默认均使用 `admin` 作为密码，请根据实际需求自行修改。

### Docker 服务

| 服务名 | 容器名 | 镜像 | 端口映射 | 用途 |
|--------|--------|------|----------|------|
| web | artflow-web | nginx:latest | 8080:80 | 前端静态文件服务 |
| php | artflow-php | php:8.2-fpm | 无 | PHP 处理 API 请求 |
| db | artflow-db | mariadb:10 | 3306:3306 | 数据库服务 |
| phpmyadmin | artflow-phpmyadmin | phpmyadmin/phpmyadmin:latest | 8081:80 | 数据库管理界面 |

## 📖 使用指南

### 管理员功能
1. 登录应用（默认密码：admin）
2. 创建项目和子任务
3. 指派任务给用户
4. 管理用户账号
5. 查看活动日志

### 普通用户功能
1. 认领分配给自己的任务
2. 更新任务状态
3. 上传关联文件
4. 查看通知

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支：`git checkout -b feature/AmazingFeature`
3. 提交更改：`git commit -m 'Add some AmazingFeature'`
4. 推送到分支：`git push origin feature/AmazingFeature`
5. 提交 Pull Request

## 📄 许可证

MIT License

## 📞 联系方式

https://github.com/GuanZR/Product-Progress
如有问题，请提交 Issue 或 Pull Request。
