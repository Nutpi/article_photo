import { CATEGORY_LIST, TemplateCategory } from '../../data/categories';
import { TEMPLATE_LIST, Template, TemplateBackground } from '../../data/templates';

// --- 接口定义 ---

interface RatioPreset {
  name: string;
  label: string;
  icon: string;
  widthRatio: number;
  heightRatio: number;
}

interface TextPreset {
  name: string;
  fontSizePercent: number;
  positionY: number;
  textAlign: 'center' | 'left';
  lineHeight: number;
  fontWeight: 'bold' | 'normal';
}

interface StyleTheme {
  name: string;
  icon: string;
  fontFamily: string;
  color: string;
  glowEffect: boolean;
  glowColor: string;
  glowBlur: number;
  textShadow: string;
}

interface ImageInfo {
  width: number;
  height: number;
  path: string;
}

interface CropInfo {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface TouchPoint {
  x: number;
  y: number;
}

interface TextBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

// --- 预设数据 ---

const RATIO_LIST: RatioPreset[] = [
  { name: '1:1',  label: '正方形', icon: '⬜', widthRatio: 1,  heightRatio: 1 },
  { name: '3:4',  label: '竖版',   icon: '📱', widthRatio: 3,  heightRatio: 4 },
  { name: '16:9', label: '横版',   icon: '🖥',  widthRatio: 16, heightRatio: 9 },
  { name: '9:16', label: '竖屏',   icon: '📲', widthRatio: 9,  heightRatio: 16 }
];

const TEXT_PRESET_LIST: TextPreset[] = [
  { name: '大字标题', fontSizePercent: 0.12, positionY: 0.50, textAlign: 'center', lineHeight: 1.4, fontWeight: 'bold' },
  { name: '居中正文', fontSizePercent: 0.06, positionY: 0.50, textAlign: 'center', lineHeight: 1.8, fontWeight: 'normal' },
  { name: '底部署名', fontSizePercent: 0.045, positionY: 0.92, textAlign: 'center', lineHeight: 1.4, fontWeight: 'normal' },
  { name: '顶部标题', fontSizePercent: 0.10, positionY: 0.18, textAlign: 'center', lineHeight: 1.4, fontWeight: 'bold' },
  { name: '双行标题', fontSizePercent: 0.09, positionY: 0.42, textAlign: 'center', lineHeight: 1.4, fontWeight: 'bold' }
];

const THEME_LIST: StyleTheme[] = [
  {
    name: '极简', icon: '○',
    fontFamily: 'sans-serif', color: '#FFFFFF',
    glowEffect: false, glowColor: '', glowBlur: 0,
    textShadow: '0 2px 8px rgba(0,0,0,0.6)'
  },
  {
    name: '赛博', icon: '◉',
    fontFamily: 'MasaFont', color: '#FFFFFF',
    glowEffect: true, glowColor: '#00D4FF', glowBlur: 15,
    textShadow: '0 0 15px #00D4FF, 0 0 30px #00D4FF, 0 0 45px #00D4FF'
  },
  {
    name: '杂志', icon: '◆',
    fontFamily: 'SourceHanSerifCN', color: '#F5F5DC',
    glowEffect: false, glowColor: '', glowBlur: 0,
    textShadow: '0 2px 8px rgba(0,0,0,0.6)'
  },
  {
    name: '手写', icon: '◇',
    fontFamily: 'SetoFont', color: '#FAEBD7',
    glowEffect: false, glowColor: '', glowBlur: 0,
    textShadow: '0 2px 8px rgba(0,0,0,0.6)'
  }
];

const DEFAULT_EXPORT_SIZES: Record<string, { w: number; h: number }> = {
  '1:1':  { w: 1080, h: 1080 },
  '3:4':  { w: 1080, h: 1440 },
  '16:9': { w: 1920, h: 1080 },
  '9:16': { w: 1080, h: 1920 },
};

// --- 工具函数 ---

function gradientAngleToCoords(angleDeg: number, w: number, h: number) {
  const angle = (angleDeg - 90) * Math.PI / 180;
  const cx = w / 2;
  const cy = h / 2;
  const len = Math.max(w, h);
  return {
    x0: cx - Math.cos(angle) * len,
    y0: cy - Math.sin(angle) * len,
    x1: cx + Math.cos(angle) * len,
    y1: cy + Math.sin(angle) * len,
  };
}

// Canvas 文字自动换行：按 maxWidth 逐字符切分，返回行数组
function wrapTextLines(ctx: any, text: string, maxWidth: number): string[] {
  const paragraphs = text.split('\n');
  const allLines: string[] = [];
  for (const para of paragraphs) {
    if (para === '') {
      allLines.push('');
      continue;
    }
    let line = '';
    for (let i = 0; i < para.length; i++) {
      const testLine = line + para[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line.length > 0) {
        allLines.push(line);
        line = para[i];
      } else {
        line = testLine;
      }
    }
    if (line) allLines.push(line);
  }
  return allLines;
}

// --- 组件 ---

Component({
  data: {
    // --- 模式 ---
    appMode: 'template' as 'template' | 'editor',

    // --- 模板浏览器 ---
    categoryList: CATEGORY_LIST,
    selectedCategoryId: 'all',
    filteredTemplates: TEMPLATE_LIST,

    // --- 比例 ---
    ratioList: RATIO_LIST,
    selectedRatio: '3:4',

    // --- 图片 ---
    imageUrl: '',
    imageInfo: null as ImageInfo | null,
    cropInfo: null as CropInfo | null,
    checkedImageFileID: '',
    loadedImage: null as any, // Canvas createImage 缓存

    // --- 画布 ---
    canvasWidth: 300,
    canvasHeight: 400,

    // --- 图片拖动裁切 ---
    imageTouchStart: null as TouchPoint | null,
    imageCropStart: null as { x: number; y: number } | null,

    // --- 文字预设 ---
    textPresetList: TEXT_PRESET_LIST,
    selectedTextPreset: '大字标题',

    // --- 风格主题 ---
    themeList: THEME_LIST,
    selectedTheme: '极简',

    // --- 文字内容 ---
    textContent: '',
    textX: 150,
    textY: 200,
    actualFontSize: 36,
    actualLineHeight: 1.4,
    actualFontWeight: 'bold' as string,
    actualTextAlign: 'center' as string,
    actualFontFamily: 'sans-serif',
    actualColor: '#FFFFFF',
    actualGlowEffect: false,
    actualTextShadow: '0 2px 8px rgba(0,0,0,0.6)',

    // --- UI ---
    showEditPanel: false,
    hasText: false,
    hasContent: false, // 是否有图片或渐变背景

    // --- 拖拽状态 ---
    touchStartPos: null as TouchPoint | null,
    textStartPos: null as { x: number; y: number } | null,
    isDraggingText: false,
    isDraggingImage: false,

    // --- 渐变背景 ---
    useGradientBg: false,
    gradientBackground: null as TemplateBackground | null,
    gradientBgStr: '',

    // --- 文字边界框（用于触摸检测） ---
    textBounds: null as TextBounds | null,

    // --- 分享 ---
    showShareSheet: false,
    lastSavedFilePath: '',
  },

  onShareAppMessage() {
    return {
      title: '文章配图助手 - 一键生成精美配图',
      path: '/pages/index/index',
      imageUrl: this.data.lastSavedFilePath || '',
    };
  },

  pageLifetimes: {
    show() {
      wx.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage', 'shareTimeline'] });
    }
  },

  lifetimes: {
    attached() {
      // 获取预览 Canvas
      this.getPreviewCanvas();
    }
  },

  methods: {
    // ===== 获取预览 Canvas =====
    getPreviewCanvas() {
      const query = wx.createSelectorQuery().in(this);
      query.select('#previewCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res[0] && res[0].node) {
            this._previewCanvas = res[0].node;
            this._previewCtx = this._previewCanvas.getContext('2d');
          }
        });
    },

    // ===== 模式切换 =====
    onModeSwitch(e: any) {
      const mode = e.currentTarget.dataset.mode;
      this.setData({ appMode: mode });
      if (mode === 'editor') {
        // 切到编辑模式时，等 DOM 更新后重绘
        setTimeout(() => {
          this.getPreviewCanvas();
          setTimeout(() => this.drawPreview(), 100);
        }, 100);
      }
    },

    // ===== 分类选择 =====
    onCategorySelect(e: any) {
      const id = e.currentTarget.dataset.id;
      const filtered = id === 'all'
        ? TEMPLATE_LIST
        : TEMPLATE_LIST.filter(t => t.categoryId === id);
      this.setData({ selectedCategoryId: id, filteredTemplates: filtered });
    },

    // ===== 模板应用 =====
    onTemplateApply(e: any) {
      const tplId = e.detail.id;
      const tpl = TEMPLATE_LIST.find(t => t.id === tplId);
      if (!tpl) return;

      const bg = tpl.background;
      let gradientBgStr = '';
      if (bg.type === 'gradient' && bg.colors) {
        gradientBgStr = `linear-gradient(${bg.direction || 180}deg, ${bg.colors.join(', ')})`;
      } else if (bg.type === 'solid') {
        gradientBgStr = bg.solidColor || '#000';
      }

      this.setData({
        appMode: 'editor',
        imageUrl: '',
        imageInfo: null,
        cropInfo: null,
        checkedImageFileID: '',
        loadedImage: null,
        selectedRatio: tpl.ratio,
        selectedTextPreset: tpl.textPreset,
        selectedTheme: tpl.theme,
        textContent: tpl.defaultText,
        hasText: true,
        hasContent: true,
        useGradientBg: true,
        gradientBackground: bg,
        gradientBgStr,
      });

      setTimeout(() => {
        this.getPreviewCanvas();
        setTimeout(() => {
          this.recalculate();
        }, 100);
      }, 100);
    },

    // ===== 图片上传 =====
    onChooseImage() {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePath = res.tempFiles[0].tempFilePath;
          wx.showLoading({ title: '正在上传...', mask: true });
          this.checkMediaSecurity(tempFilePath);
        }
      });
    },

    checkMediaSecurity(filePath: string) {
      const uploadAndCheck = (localPath: string) => {
        const ext = localPath.split('.').pop() || 'jpg';
        const cloudPath = 'sec-check/' + Date.now() + '-' + Math.random().toString(36).substring(2, 10) + '.' + ext;

        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: localPath,
          success: (uploadRes) => {
            const fileID = uploadRes.fileID;
            wx.showLoading({ title: '正在检测...', mask: true });

            wx.cloud.callFunction({
              name: 'mediaCheck',
              data: { fileID: fileID },
              success: (funcRes: any) => {
                const result = funcRes.result;
                wx.hideLoading();

                if (result.pass) {
                  this._loadedImage = null;
                  this.setData({
                    imageUrl: localPath,
                    checkedImageFileID: fileID,
                    useGradientBg: false,
                    gradientBackground: null,
                    hasContent: true,
                  });

                  wx.getImageInfo({
                    src: localPath,
                    success: (info) => {
                      this.setData({
                        imageInfo: {
                          width: info.width,
                          height: info.height,
                          path: localPath
                        }
                      });
                      this.recalculate();
                    }
                  });

                  wx.showToast({ title: '上传成功', icon: 'success', duration: 1500 });
                } else {
                  wx.cloud.deleteFile({ fileList: [fileID] });
                  wx.showModal({
                    title: '提示',
                    content: '图片不合适，请重新上传',
                    showCancel: false
                  });
                }
              },
              fail: () => {
                wx.hideLoading();
                wx.showToast({ title: '安全检测失败，请重试', icon: 'none' });
                wx.cloud.deleteFile({ fileList: [fileID] });
              }
            });
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: '图片上传失败', icon: 'none' });
          }
        });
      };

      wx.compressImage({
        src: filePath,
        quality: 50,
        success: (compressRes) => {
          uploadAndCheck(compressRes.tempFilePath);
        },
        fail: () => {
          uploadAndCheck(filePath);
        }
      });
    },

    // ===== 比例选择 =====
    onRatioSelect(e: any) {
      this.setData({ selectedRatio: e.currentTarget.dataset.name });
      this.recalculate();
    },

    // ===== 核心计算 =====
    recalculate() {
      const { imageInfo, selectedRatio } = this.data;
      const ratio = RATIO_LIST.find(r => r.name === selectedRatio)!;
      const targetRatio = ratio.widthRatio / ratio.heightRatio;

      const systemInfo = wx.getSystemInfoSync();
      const maxWidth = systemInfo.windowWidth - 48;
      const maxHeight = systemInfo.windowHeight - 380;

      let canvasWidth: number;
      let canvasHeight: number;

      if (targetRatio >= 1) {
        canvasWidth = maxWidth;
        canvasHeight = canvasWidth / targetRatio;
        if (canvasHeight > maxHeight) {
          canvasHeight = maxHeight;
          canvasWidth = canvasHeight * targetRatio;
        }
      } else {
        canvasHeight = maxHeight;
        canvasWidth = canvasHeight * targetRatio;
        if (canvasWidth > maxWidth) {
          canvasWidth = maxWidth;
          canvasHeight = canvasWidth / targetRatio;
        }
      }

      canvasWidth = Math.floor(canvasWidth);
      canvasHeight = Math.floor(canvasHeight);

      if (imageInfo) {
        const imgRatio = imageInfo.width / imageInfo.height;
        let cropInfo: CropInfo;
        if (imgRatio > targetRatio) {
          const cropH = imageInfo.height;
          const cropW = imageInfo.height * targetRatio;
          cropInfo = { x: Math.floor((imageInfo.width - cropW) / 2), y: 0, w: Math.floor(cropW), h: cropH };
        } else {
          const cropW = imageInfo.width;
          const cropH = imageInfo.width / targetRatio;
          cropInfo = { x: 0, y: Math.floor((imageInfo.height - cropH) / 2), w: cropW, h: Math.floor(cropH) };
        }
        this.setData({ canvasWidth, canvasHeight, cropInfo });
      } else {
        this.setData({ canvasWidth, canvasHeight, cropInfo: null });
      }

      this.applyPresetAndTheme();
      this.drawPreview();
    },

    applyPresetAndTheme() {
      const { canvasWidth, canvasHeight, selectedTextPreset, selectedTheme } = this.data;
      const preset = TEXT_PRESET_LIST.find(p => p.name === selectedTextPreset)!;
      const theme = THEME_LIST.find(t => t.name === selectedTheme)!;

      this.setData({
        textX: preset.textAlign === 'center' ? canvasWidth / 2 : canvasWidth * 0.1,
        textY: canvasHeight * preset.positionY,
        actualFontSize: Math.round(canvasWidth * preset.fontSizePercent),
        actualLineHeight: preset.lineHeight,
        actualFontWeight: preset.fontWeight,
        actualTextAlign: preset.textAlign,
        actualFontFamily: theme.fontFamily,
        actualColor: theme.color,
        actualGlowEffect: theme.glowEffect,
        actualTextShadow: theme.textShadow,
      });
    },

    // ===== 统一绘制函数 =====
    renderCanvas(
      canvas: any,
      width: number,
      height: number,
      data: any,
      image: any,
      callback?: () => void
    ) {
      const ctx = canvas.getContext('2d');
      const dpr = 1; // 预览用 1x，导出用原始像素

      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);

      const scale = 1; // 统一用 width/height 控制大小

      const drawContent = () => {
        // 绘制文字
        if (data.hasText && data.textContent) {
          this.renderText(ctx, width, height, data, scale);
        }
        if (callback) callback();
      };

      // 绘制背景
      if (image && data.imageInfo && data.cropInfo) {
        const ci = data.cropInfo;
        ctx.drawImage(image, ci.x, ci.y, ci.w, ci.h, 0, 0, width, height);
        drawContent();
      } else if (data.useGradientBg && data.gradientBackground) {
        this.renderGradient(ctx, data.gradientBackground, width, height);
        drawContent();
      } else {
        drawContent();
      }
    },

    // 渲染渐变背景
    renderGradient(ctx: any, bg: TemplateBackground, w: number, h: number) {
      if (bg.type === 'gradient' && bg.colors && bg.colors.length >= 2) {
        const coords = gradientAngleToCoords(bg.direction || 180, w, h);
        const gradient = ctx.createLinearGradient(coords.x0, coords.y0, coords.x1, coords.y1);
        bg.colors.forEach((color, i) => {
          gradient.addColorStop(i / (bg.colors.length - 1), color);
        });
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      } else if (bg.type === 'solid') {
        ctx.fillStyle = bg.solidColor || '#000000';
        ctx.fillRect(0, 0, w, h);
      }
      if (bg.overlayOpacity && bg.overlayOpacity > 0) {
        ctx.fillStyle = `rgba(0,0,0,${bg.overlayOpacity})`;
        ctx.fillRect(0, 0, w, h);
      }
    },

    // 渲染文字（统一用于预览和导出）
    renderText(ctx: any, canvasW: number, canvasH: number, data: any, scale: number) {
      const theme = THEME_LIST.find(t => t.name === data.selectedTheme)!;
      const fontSize = data.actualFontSize * scale;
      const weightStr = data.actualFontWeight === 'bold' ? 'bold' : 'normal';

      ctx.font = `${weightStr} ${fontSize}px "${data.actualFontFamily}", sans-serif`;
      ctx.fillStyle = data.actualColor;
      ctx.textBaseline = 'middle';

      const textAlign = data.actualTextAlign || 'center';
      ctx.textAlign = textAlign;

      // 文字最大宽度 = 画布宽度的 96%
      const maxTextWidth = canvasW * 0.96;

      // 自动换行
      const lines = wrapTextLines(ctx, data.textContent, maxTextWidth);
      const lineHeightPx = fontSize * data.actualLineHeight;
      const totalTextHeight = lines.length * lineHeightPx;

      // 文字锚点位置
      const anchorX = data.textX * scale;
      const anchorY = data.textY * scale;

      // 起始 Y（让整段文字以 anchorY 为中心）
      const startY = anchorY - totalTextHeight / 2 + lineHeightPx / 2;

      // 发光效果
      if (data.actualGlowEffect) {
        ctx.shadowColor = theme.glowColor;
        ctx.shadowBlur = theme.glowBlur * scale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      lines.forEach((line: string, i: number) => {
        const lineY = startY + i * lineHeightPx;
        ctx.fillText(line, anchorX, lineY);
        if (data.actualGlowEffect) {
          ctx.shadowBlur = theme.glowBlur * scale * 2;
          ctx.fillText(line, anchorX, lineY);
          ctx.shadowBlur = theme.glowBlur * scale;
        }
      });

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // 保存文字边界框（用于触摸检测，仅在预览时）
      if (scale === 1) {
        let maxLineWidth = 0;
        lines.forEach((line: string) => {
          const w = ctx.measureText(line).width;
          if (w > maxLineWidth) maxLineWidth = w;
        });

        const boundsX = textAlign === 'center'
          ? anchorX - maxLineWidth / 2
          : anchorX;
        const boundsY = anchorY - totalTextHeight / 2;

        this.setData({
          textBounds: {
            x: boundsX,
            y: boundsY,
            w: maxLineWidth,
            h: totalTextHeight,
          }
        });
      }
    },

    // ===== 绘制预览 =====
    drawPreview() {
      if (!this._previewCanvas) return;

      const { canvasWidth, canvasHeight, imageInfo, hasContent } = this.data;
      if (!hasContent) return;

      const canvas = this._previewCanvas;
      const dpr = wx.getWindowInfo().pixelRatio || 2;

      // 预览 Canvas 用物理像素绘制，保证清晰
      canvas.width = canvasWidth * dpr;
      canvas.height = canvasHeight * dpr;

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      // 清空
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      const drawContent = () => {
        if (this.data.hasText && this.data.textContent) {
          this.renderText(ctx, canvasWidth, canvasHeight, this.data, 1);
        }
      };

      if (imageInfo && this._loadedImage) {
        const ci = this.data.cropInfo;
        if (ci) {
          ctx.drawImage(this._loadedImage, ci.x, ci.y, ci.w, ci.h, 0, 0, canvasWidth, canvasHeight);
        }
        drawContent();
      } else if (this.data.useGradientBg && this.data.gradientBackground) {
        this.renderGradient(ctx, this.data.gradientBackground, canvasWidth, canvasHeight);
        drawContent();
      } else if (imageInfo) {
        // 图片还没加载完，先加载
        this.loadImageForPreview();
      } else {
        drawContent();
      }
    },

    // 加载图片用于预览
    loadImageForPreview() {
      if (!this._previewCanvas || !this.data.imageInfo) return;

      const img = this._previewCanvas.createImage();
      img.src = this.data.imageInfo.path;

      img.onload = () => {
        this._loadedImage = img;
        this.drawPreview();
      };
    },

    // ===== 触摸事件（统一处理） =====
    onCanvasTouchStart(e: any) {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];

      // 判断是否点在文字上
      if (this.data.hasText && this.data.textBounds) {
        const b = this.data.textBounds;
        const rect = e.currentTarget ? null : null;
        // touch 的 clientX/Y 是相对屏幕的，需要转换为相对 canvas 的坐标
        const query = wx.createSelectorQuery().in(this);
        query.select('.canvas-wrapper').boundingClientRect((rect: any) => {
          if (!rect) return;
          const localX = touch.clientX - rect.left;
          const localY = touch.clientY - rect.top;

          // 检查是否在文字边界框内（加一些容差）
          const padding = 20;
          if (localX >= b.x - padding && localX <= b.x + b.w + padding &&
              localY >= b.y - padding && localY <= b.y + b.h + padding) {
            this.setData({
              isDraggingText: true,
              touchStartPos: { x: touch.clientX, y: touch.clientY },
              textStartPos: { x: this.data.textX, y: this.data.textY },
            });
          } else {
            this.startImageDrag(touch);
          }
        }).exec();
      } else {
        this.startImageDrag(touch);
      }
    },

    startImageDrag(touch: any) {
      if (!this.data.cropInfo || !this.data.imageInfo) return;
      this.setData({
        isDraggingImage: true,
        imageTouchStart: { x: touch.clientX, y: touch.clientY },
        imageCropStart: this.data.cropInfo ? { x: this.data.cropInfo.x, y: this.data.cropInfo.y } : null,
      });
    },

    onCanvasTouchMove(e: any) {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];

      if (this.data.isDraggingText && this.data.touchStartPos && this.data.textStartPos) {
        const deltaX = touch.clientX - this.data.touchStartPos.x;
        const deltaY = touch.clientY - this.data.touchStartPos.y;

        let newX = this.data.textStartPos.x + deltaX;
        let newY = this.data.textStartPos.y + deltaY;

        newX = Math.max(0, Math.min(this.data.canvasWidth, newX));
        newY = Math.max(0, Math.min(this.data.canvasHeight, newY));

        // 吸附中心
        const centerX = this.data.canvasWidth / 2;
        const centerY = this.data.canvasHeight / 2;
        if (Math.abs(newX - centerX) < 15) { newX = centerX; wx.vibrateShort({ type: 'light' }); }
        if (Math.abs(newY - centerY) < 15) { newY = centerY; wx.vibrateShort({ type: 'light' }); }

        this.setData({ textX: newX, textY: newY });
        this.drawPreview();

      } else if (this.data.isDraggingImage && this.data.imageTouchStart && this.data.imageCropStart && this.data.cropInfo && this.data.imageInfo) {
        const deltaX = touch.clientX - this.data.imageTouchStart.x;
        const deltaY = touch.clientY - this.data.imageTouchStart.y;

        const { canvasWidth, canvasHeight, imageInfo } = this.data;
        const cropInfo = this.data.cropInfo;
        const scale = Math.max(canvasWidth / cropInfo.w, canvasHeight / cropInfo.h);

        let newX = this.data.imageCropStart.x + (-deltaX / scale);
        let newY = this.data.imageCropStart.y + (-deltaY / scale);

        newX = Math.max(0, Math.min(imageInfo!.width - cropInfo.w, newX));
        newY = Math.max(0, Math.min(imageInfo!.height - cropInfo.h, newY));

        this.setData({ 'cropInfo.x': Math.round(newX), 'cropInfo.y': Math.round(newY) });
        this.drawPreview();
      }
    },

    onCanvasTouchEnd() {
      this.setData({
        isDraggingText: false,
        isDraggingImage: false,
        touchStartPos: null,
        textStartPos: null,
        imageTouchStart: null,
        imageCropStart: null,
      });
    },

    // ===== 文字预设 / 主题选择 =====
    onTextPresetSelect(e: any) {
      this.setData({ selectedTextPreset: e.currentTarget.dataset.name });
      this.applyPresetAndTheme();
      this.drawPreview();
    },

    onThemeSelect(e: any) {
      this.setData({ selectedTheme: e.currentTarget.dataset.name });
      this.applyPresetAndTheme();
      this.drawPreview();
    },

    // ===== 加字 =====
    onAddText() {
      if (!this.data.imageUrl && !this.data.useGradientBg) {
        wx.showToast({ title: '请先选择模板或上传图片', icon: 'none' });
        return;
      }
      if (!this.data.hasText) {
        this.setData({ textContent: '点击编辑文字', hasText: true });
        this.applyPresetAndTheme();
      }
      this.setData({ showEditPanel: true });
      this.drawPreview();
    },

    onTextTap() {
      if (this.data.hasText) {
        this.setData({ showEditPanel: true });
      }
    },

    // ===== 文字输入 =====
    onTextInput(e: any) {
      this.setData({ textContent: e.detail.value });
      this.drawPreview();
    },

    onClosePanel() {
      this.setData({ showEditPanel: false });
    },

    onDeleteText() {
      this.setData({ textContent: '', hasText: false, showEditPanel: false });
      this.drawPreview();
    },

    preventMove() {},

    onReset() {
      wx.showModal({
        title: '确认重置',
        content: '确定要清空所有内容吗？',
        success: (res) => {
          if (res.confirm) {
            this.setData({
              imageUrl: '', imageInfo: null, cropInfo: null,
              canvasWidth: 300, canvasHeight: 400,
              selectedRatio: '3:4', selectedTextPreset: '大字标题', selectedTheme: '极简',
              textContent: '', hasText: false, hasContent: false,
              showEditPanel: false,
              useGradientBg: false, gradientBackground: null,
              loadedImage: null,
            });
          }
        }
      });
    },

    // ===== 保存导出 =====
    async onSave() {
      if (!this.data.imageUrl && !this.data.useGradientBg) {
        wx.showToast({ title: '请先上传图片或选择模板', icon: 'none' });
        return;
      }

      wx.showLoading({ title: '正在保存...' });

      try {
        const query = wx.createSelectorQuery().in(this);
        query.select('#exportCanvas')
          .fields({ node: true, size: true })
          .exec(async (res) => {
            if (!res[0] || !res[0].node) {
              wx.hideLoading();
              wx.showToast({ title: '导出失败', icon: 'error' });
              return;
            }

            const canvas = res[0].node as any;
            const { imageInfo, cropInfo, canvasWidth, canvasHeight, useGradientBg, gradientBackground } = this.data;

            let exportWidth: number;
            let exportHeight: number;

            if (imageInfo && cropInfo) {
              exportWidth = cropInfo.w;
              exportHeight = cropInfo.h;
            } else {
              const defaultSize = DEFAULT_EXPORT_SIZES[this.data.selectedRatio] || { w: 1080, h: 1440 };
              exportWidth = defaultSize.w;
              exportHeight = defaultSize.h;
            }

            // 计算缩放比：预览坐标 → 导出坐标
            const exportScale = exportWidth / canvasWidth;

            canvas.width = exportWidth;
            canvas.height = exportHeight;

            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, exportWidth, exportHeight);

            const drawContent = () => {
              if (this.data.hasText && this.data.textContent) {
                this.renderText(ctx, exportWidth, exportHeight, this.data, exportScale);
              }
              this.doCanvasExport(canvas);
            };

            if (imageInfo && imageInfo.path) {
              const img = canvas.createImage();
              img.src = imageInfo.path;
              img.onload = () => {
                if (cropInfo) {
                  ctx.drawImage(img, cropInfo.x, cropInfo.y, cropInfo.w, cropInfo.h, 0, 0, exportWidth, exportHeight);
                }
                drawContent();
              };
              img.onerror = () => {
                wx.hideLoading();
                wx.showToast({ title: '图片加载失败', icon: 'error' });
              };
            } else if (useGradientBg && gradientBackground) {
              this.renderGradient(ctx, gradientBackground, exportWidth, exportHeight);
              drawContent();
            } else {
              wx.hideLoading();
              wx.showToast({ title: '请先上传图片或选择模板', icon: 'none' });
            }
          });
      } catch (error) {
        wx.hideLoading();
        wx.showToast({ title: '保存失败', icon: 'error' });
      }
    },

    doCanvasExport(canvas: any) {
      wx.canvasToTempFilePath({
        canvas: canvas,
        success: (saveRes) => {
          wx.saveImageToPhotosAlbum({
            filePath: saveRes.tempFilePath,
            success: () => {
              wx.hideLoading();
              this.setData({ showShareSheet: true, lastSavedFilePath: saveRes.tempFilePath });
            },
            fail: (err) => {
              wx.hideLoading();
              if (err.errMsg.includes('auth deny')) {
                wx.showModal({
                  title: '提示',
                  content: '需要您授权保存图片到相册',
                  success: (modalRes) => {
                    if (modalRes.confirm) wx.openSetting();
                  }
                });
              } else {
                wx.showToast({ title: '保存失败', icon: 'error' });
              }
            }
          });
        },
        fail: () => {
          wx.hideLoading();
          wx.showToast({ title: '导出失败', icon: 'error' });
        }
      });
    },

    // ===== 保存带水印版本 =====
    async onSaveWatermark() {
      this.setData({ showShareSheet: false });
      wx.showLoading({ title: '正在生成...' });

      try {
        const query = wx.createSelectorQuery().in(this);
        query.select('#exportCanvas')
          .fields({ node: true, size: true })
          .exec(async (res) => {
            if (!res[0] || !res[0].node) {
              wx.hideLoading();
              wx.showToast({ title: '导出失败', icon: 'error' });
              return;
            }

            const canvas = res[0].node as any;
            const { imageInfo, cropInfo, canvasWidth, canvasHeight, useGradientBg, gradientBackground } = this.data;

            let exportWidth: number;
            let exportHeight: number;

            if (imageInfo && cropInfo) {
              exportWidth = cropInfo.w;
              exportHeight = cropInfo.h;
            } else {
              const defaultSize = DEFAULT_EXPORT_SIZES[this.data.selectedRatio] || { w: 1080, h: 1440 };
              exportWidth = defaultSize.w;
              exportHeight = defaultSize.h;
            }

            const exportScale = exportWidth / canvasWidth;
            canvas.width = exportWidth;
            canvas.height = exportHeight;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, exportWidth, exportHeight);

            const finalize = () => {
              if (this.data.hasText && this.data.textContent) {
                this.renderText(ctx, exportWidth, exportHeight, this.data, exportScale);
              }
              this.drawWatermark(ctx, exportWidth, exportHeight);
              this.doCanvasExport(canvas);
            };

            if (imageInfo && imageInfo.path) {
              const img = canvas.createImage();
              img.src = imageInfo.path;
              img.onload = () => {
                if (cropInfo) {
                  ctx.drawImage(img, cropInfo.x, cropInfo.y, cropInfo.w, cropInfo.h, 0, 0, exportWidth, exportHeight);
                }
                finalize();
              };
              img.onerror = () => {
                wx.hideLoading();
                wx.showToast({ title: '图片加载失败', icon: 'error' });
              };
            } else if (useGradientBg && gradientBackground) {
              this.renderGradient(ctx, gradientBackground, exportWidth, exportHeight);
              finalize();
            } else {
              wx.hideLoading();
              wx.showToast({ title: '请先上传图片或选择模板', icon: 'none' });
            }
          });
      } catch (error) {
        wx.hideLoading();
        wx.showToast({ title: '保存失败', icon: 'error' });
      }
    },

    drawWatermark(ctx: any, exportWidth: number, exportHeight: number) {
      const padding = Math.round(exportWidth * 0.03);
      const fontSize = Math.round(exportWidth * 0.022);
      const qrSize = Math.round(exportWidth * 0.06);

      ctx.font = `normal ${fontSize}px sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText('文章配图助手', exportWidth - padding, exportHeight - padding - qrSize - 6);

      try {
        const qrImg = ctx.createImage ? ctx.createImage() : null;
        if (qrImg) {
          qrImg.src = '/images/watermark-qr.png';
          ctx.drawImage(qrImg, exportWidth - padding - qrSize, exportHeight - padding - qrSize, qrSize, qrSize);
        }
      } catch (e) {
        // QR图片加载失败，只保留文字水印
      }
    },

    onCloseShareSheet() {
      this.setData({ showShareSheet: false });
      wx.showToast({ title: '保存成功', icon: 'success' });
    },
  }
});
