# 文章配图助手

一款微信小程序，为文章配图提供快速排版、文字叠加和模板套用功能。

## 功能

- **图片上传** — 从相册或相机选择图片
- **比例裁切** — 支持 1:1、3:4、16:9、9:16 多种比例
- **文字叠加** — 添加多行文字，支持拖拽定位和中心吸附
- **文字预设** — 大字标题、居中正文、底部署名、顶部标题、双行标题
- **风格主题** — 极简、赛博（霓虹发光）、杂志（宋体）、手写（濑体）
- **模板市场** — 6 大分类（早安打卡、节日祝福、金句卡片、情绪语录、读书笔记、健身打卡），一键套用
- **所见即所得** — 基于 Canvas 实时预览，导出效果与预览一致
- **一键分享** — 转发给好友或保存带水印图片到相册
- **高清导出** — 基于原始图片分辨率导出，保存到相册
- **内容安全** — 图片异步检测（mediaCheckAsync 2.0）+ 文本实时检测（msgSecCheck 2.0）

## 技术栈

- 微信小程序 + TypeScript + Sass
- Skyline 渲染引擎 + glass-easel 组件框架
- Canvas 2D API 所见即所得预览与高清导出
- 微信云开发（云函数 + 云存储）

## 云函数

| 函数 | 说明 | 接口 |
|------|------|------|
| `mediaCheck` | 图片内容安全检测（异步） | `security.mediaCheckAsync` 2.0 |
| `msgCheck` | 文本内容安全检测（同步） | `security.msgSecCheck` 2.0 |

## 开发

1. 克隆仓库

```bash
git clone https://github.com/Nutpi/article_photo.git
```

2. 安装依赖

```bash
npm install
```

3. 使用[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)打开项目

4. 在开发者工具中编译预览

5. 部署云函数：右键 `cloudfunctions/mediaCheck` 和 `cloudfunctions/msgCheck` → 上传并部署

## 项目结构

```
miniprogram/
├── app.ts                      # 小程序入口，加载自定义字体
├── pages/
│   └── index/
│       ├── index.ts            # 主页面逻辑
│       ├── index.wxml          # 主页面模板
│       ├── index.scss          # 主页面样式
│       └── index.json          # 主页面配置
├── components/
│   ├── navigation-bar/         # 自定义导航栏
│   ├── template-card/          # 模板卡片
│   └── share-sheet/            # 分享面板
├── data/
│   ├── templates.ts            # 模板数据
│   └── categories.ts           # 分类数据
├── fonts/                      # 自定义字体（ JianHaoTi、濑体、MasaBold、宋体）
└── images/                     # 静态资源
cloudfunctions/
├── mediaCheck/                 # 图片安全检测云函数
└── msgCheck/                   # 文本安全检测云函数
```

## 许可

MIT
