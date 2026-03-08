# 知识管理系统 (Knowledge Management System)

一个类似 Notion 的全栈个人知识管理系统。

## 🚀 技术栈

### 前端
- React 18
- Vite
- Tailwind CSS
- React Router
- Zustand (状态管理)
- Axios
- Lucide React (图标)

### 后端
- Node.js
- Express
- Prisma (ORM)
- PostgreSQL
- JWT (认证)
- Bcrypt (密码加密)
- Zod (验证)

## 📁 项目结构

```
kms/
├── server/                 # 后端
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── routes/        # 路由
│   │   ├── middleware/    # 中间件
│   │   ├── db.js          # 数据库连接
│   │   └── index.js       # 入口文件
│   ├── prisma/
│   │   └── schema.prisma  # 数据库模型
│   └── package.json
└── client/                # 前端
    ├── src/
    │   ├── pages/         # 页面组件
    │   ├── api/           # API 服务
    │   ├── store/         # 状态管理
    │   └── App.jsx        # 主应用
    └── package.json
```

## 🗄️ 数据库设计

### 主要表

- **User** - 用户表
- **Note** - 笔记表
- **Folder** - 文件夹表（支持多级）
- **Tag** - 标签表
- **NoteTag** - 笔记 - 标签关联表
- **DeletedNote** - 回收站表

## 🔧 安装与运行

### 1. 数据库设置

```bash
# 安装 PostgreSQL
# 创建数据库
createdb kms_db

# 配置 .env 文件
cd server
cp .env.example .env
# 修改 DATABASE_URL
```

### 2. 后端运行

```bash
cd server
npm install
npx prisma migrate dev
npm run dev
# 运行在 http://localhost:4000
```

### 3. 前端运行

```bash
cd client
npm install
npm run dev
# 运行在 http://localhost:5000
```

## 📡 API 接口

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/profile` - 获取用户信息

### 笔记
- `GET /api/notes` - 获取笔记列表
- `GET /api/notes/:id` - 获取单个笔记
- `POST /api/notes` - 创建笔记
- `PUT /api/notes/:id` - 更新笔记
- `DELETE /api/notes/:id` - 删除笔记（到回收站）
- `POST /api/notes/:id/restore` - 恢复笔记
- `DELETE /api/notes/:id/permanent` - 永久删除
- `GET /api/notes/deleted` - 获取回收站

### 文件夹
- `GET /api/folders` - 获取所有文件夹
- `GET /api/folders/tree` - 获取文件夹树
- `GET /api/folders/:id` - 获取单个文件夹
- `POST /api/folders` - 创建文件夹
- `PUT /api/folders/:id` - 更新文件夹
- `DELETE /api/folders/:id` - 删除文件夹

### 标签
- `GET /api/tags` - 获取所有标签
- `GET /api/tags/:id` - 获取单个标签
- `POST /api/tags` - 创建标签
- `PUT /api/tags/:id` - 更新标签
- `DELETE /api/tags/:id` - 删除标签

## ✨ 功能特性

- ✅ 用户注册/登录（JWT 认证）
- ✅ 笔记 CRUD 操作
- ✅ 多级文件夹支持
- ✅ 标签系统
- ✅ 全文搜索（标题、内容、标签）
- ✅ 回收站（恢复/永久删除）
- ✅ 本地状态持久化
- ✅ 响应式设计
- ✅ 现代化 UI

## 🔐 安全

- 密码使用 bcrypt 加密（12 轮）
- JWT token 认证（7 天有效期）
- 所有 API 需要认证（除登录/注册）
- 输入验证（Zod）
- CORS 配置

## 📝 注意事项

1. 首次运行需要配置 PostgreSQL 数据库
2. 修改 `server/.env` 中的数据库连接字符串
3. 运行 `npx prisma migrate dev` 初始化数据库
4. 前后端需要同时运行

## 🌐 访问

- 前端：http://localhost:5000
- 后端 API: http://localhost:4000
- API 健康检查：http://localhost:4000/health
