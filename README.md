# 屁王争霸

一个使用 Vue 3 + Vite 构建的简单网页项目。

## 技术栈

- **Vue 3** - 渐进式JavaScript框架
- **Vite** - 下一代前端构建工具
- **原生CSS** - 样式解决方案

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

在浏览器中打开 [http://localhost:5173](http://localhost:5173) 查看结果。

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 项目结构

```
.
├── index.html          # 入口HTML文件
├── package.json        # 项目配置
├── vite.config.js      # Vite配置
├── .gitignore          # Git忽略文件
├── src/
│   ├── main.js         # Vue应用入口
│   └── App.vue         # 主Vue组件
└── README.md           # 项目说明
```

## GitHub推送

要将此项目推送到GitHub：

1. 在GitHub上创建新仓库
2. 关联远程仓库：
   ```bash
   git remote add origin https://github.com/你的用户名/piwang-contest.git
   ```
3. 推送代码：
   ```bash
   git branch -M main
   git push -u origin main
   ```

## 开发建议

- 保持组件小型化和可复用性
- 使用Vue 3的Composition API处理复杂逻辑
- 利用Vite的快速热重载提升开发效率
