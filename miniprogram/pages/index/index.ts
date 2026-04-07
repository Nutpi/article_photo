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

// 渐变模板无图片时的默认导出尺寸
const DEFAULT_EXPORT_SIZES: Record<string, { w: number; h: number }> = {
  '1:1':  { w: 1080, h: 1080 },
  '3:4':  { w: 1080, h: 1440 },
  '16:9': { w: 1920, h: 1080 },
  '9:16': { w: 1080, h: 1920 },
};

// --- 工具函数：CSS 渐变角度 → Canvas 坐标 ---
function gradientAngleToCoords(angleDeg: number, w: number, h: number): { x0: number; y0: number; x1: number; y1: number } {
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

    // --- 画布 ---
    canvasWidth: 300,
    canvasHeight: 400,

    // --- 图片拖动裁切 ---
    imgDisplayW: 0,
    imgDisplayH: 0,
    imgOffsetX: 0,
    imgOffsetY: 0,
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

    // --- 拖拽状态 ---
    touchStartPos: null as TouchPoint | null,
    textStartPos: null as { x: number; y: number } | null,

    // --- 渐变背景 ---
    useGradientBg: false,
    gradientBackground: null as TemplateBackground | null,
    gradientBgStr: '',

    // --- 分享 ---
    showShareSheet: false,
    lastSavedFilePath: '',
  },

  // 分享配置（Component 级别）
  onShareAppMessage() {
    return {
      title: '文章配图助手 - 一键生成精美配图',
      path: '/pages/index/index',
      imageUrl: this.data.lastSavedFilePath || '',
    };
  },

  methods: {
    // ===== 模式切换 =====
    onModeSwitch(e: any) {
      const mode = e.currentTarget.dataset.mode;
      this.setData({ appMode: mode });
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
        // 重置图片
        imageUrl: '',
        imageInfo: null,
        cropInfo: null,
        checkedImageFileID: '',
        // 应用模板设置
        selectedRatio: tpl.ratio,
        selectedTextPreset: tpl.textPreset,
        selectedTheme: tpl.theme,
        textContent: tpl.defaultText,
        hasText: true,
        // 渐变背景
        useGradientBg: true,
        gradientBackground: bg,
        gradientBgStr,
      });

      this.recalculate();
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

    // ===== 图片内容安全检测（同步） =====
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
                  this.setData({
                    imageUrl: localPath,
                    checkedImageFileID: fileID,
                    useGradientBg: false,
                    gradientBackground: null,
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
      const ratioName = e.currentTarget.dataset.name;
      this.setData({ selectedRatio: ratioName });
      this.recalculate();
    },

    // ===== 核心计算：画布尺寸 + 裁切区域 =====
    recalculate() {
      const { imageInfo, selectedRatio } = this.data;
      const ratio = RATIO_LIST.find(r => r.name === selectedRatio)!;
      const targetRatio = ratio.widthRatio / ratio.heightRatio;

      // 计算画布显示尺寸
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

      // 有图片时计算裁切区域
      if (imageInfo) {
        const imgRatio = imageInfo.width / imageInfo.height;
        let cropInfo: CropInfo;

        if (imgRatio > targetRatio) {
          const cropH = imageInfo.height;
          const cropW = imageInfo.height * targetRatio;
          cropInfo = {
            x: Math.floor((imageInfo.width - cropW) / 2),
            y: 0,
            w: Math.floor(cropW),
            h: cropH
          };
        } else {
          const cropW = imageInfo.width;
          const cropH = imageInfo.width / targetRatio;
          cropInfo = {
            x: 0,
            y: Math.floor((imageInfo.height - cropH) / 2),
            w: cropW,
            h: Math.floor(cropH)
          };
        }

        this.setData({ canvasWidth, canvasHeight, cropInfo });
        this.updateImageDisplay();
      } else {
        this.setData({ canvasWidth, canvasHeight, cropInfo: null });
      }

      this.applyPresetAndTheme();
    },

    // ===== 应用预设 + 主题到画布 =====
    applyPresetAndTheme() {
      const { canvasWidth, canvasHeight, selectedTextPreset, selectedTheme } = this.data;

      const preset = TEXT_PRESET_LIST.find(p => p.name === selectedTextPreset)!;
      const theme = THEME_LIST.find(t => t.name === selectedTheme)!;

      const actualFontSize = Math.round(canvasWidth * preset.fontSizePercent);
      const actualLineHeight = preset.lineHeight;
      const actualFontWeight = preset.fontWeight;
      const actualTextAlign = preset.textAlign;
      const actualFontFamily = theme.fontFamily;
      const actualColor = theme.color;
      const actualGlowEffect = theme.glowEffect;
      const actualTextShadow = theme.textShadow;

      const textX = preset.textAlign === 'center' ? canvasWidth / 2 : canvasWidth * 0.1;
      const textY = canvasHeight * preset.positionY;

      this.setData({
        textX,
        textY,
        actualFontSize,
        actualLineHeight,
        actualFontWeight,
        actualTextAlign,
        actualFontFamily,
        actualColor,
        actualGlowEffect,
        actualTextShadow
      });
    },

    // ===== 根据裁切区域计算图片显示尺寸和偏移 =====
    updateImageDisplay() {
      const { cropInfo, canvasWidth, canvasHeight } = this.data;
      if (!cropInfo) return;

      const scaleX = canvasWidth / cropInfo.w;
      const scaleY = canvasHeight / cropInfo.h;
      const scale = Math.max(scaleX, scaleY);

      const { imageInfo } = this.data;
      if (!imageInfo) return;

      const imgDisplayW = imageInfo.width * scale;
      const imgDisplayH = imageInfo.height * scale;
      const imgOffsetX = -cropInfo.x * scale;
      const imgOffsetY = -cropInfo.y * scale;

      this.setData({ imgDisplayW, imgDisplayH, imgOffsetX, imgOffsetY });
    },

    // ===== 图片拖动裁切 =====
    onImageTouchStart(e: any) {
      if (this.data.touchStartPos) return;
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        this.setData({
          imageTouchStart: { x: touch.clientX, y: touch.clientY },
          imageCropStart: this.data.cropInfo ? { x: this.data.cropInfo.x, y: this.data.cropInfo.y } : null
        });
      }
    },

    onImageTouchMove(e: any) {
      if (!this.data.imageTouchStart || !this.data.imageCropStart || !this.data.cropInfo || !this.data.imageInfo) return;
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - this.data.imageTouchStart.x;
      const deltaY = touch.clientY - this.data.imageTouchStart.y;

      const { canvasWidth, canvasHeight, imageInfo } = this.data;
      const cropInfo = this.data.cropInfo;

      const scale = Math.max(canvasWidth / cropInfo.w, canvasHeight / cropInfo.h);

      const cropDeltaX = -deltaX / scale;
      const cropDeltaY = -deltaY / scale;

      let newX = this.data.imageCropStart.x + cropDeltaX;
      let newY = this.data.imageCropStart.y + cropDeltaY;

      newX = Math.max(0, Math.min(imageInfo!.width - cropInfo.w, newX));
      newY = Math.max(0, Math.min(imageInfo!.height - cropInfo.h, newY));

      this.setData({ 'cropInfo.x': Math.round(newX), 'cropInfo.y': Math.round(newY) });
      this.updateImageDisplay();
    },

    onImageTouchEnd() {
      this.setData({ imageTouchStart: null, imageCropStart: null });
    },

    // ===== 文字预设选择 =====
    onTextPresetSelect(e: any) {
      const presetName = e.currentTarget.dataset.name;
      this.setData({ selectedTextPreset: presetName });
      this.applyPresetAndTheme();
    },

    // ===== 风格主题选择 =====
    onThemeSelect(e: any) {
      const themeName = e.currentTarget.dataset.name;
      this.setData({ selectedTheme: themeName });
      this.applyPresetAndTheme();
    },

    // ===== 加字按钮 =====
    onAddText() {
      if (!this.data.imageUrl && !this.data.useGradientBg) {
        wx.showToast({ title: '请先选择模板或上传图片', icon: 'none' });
        return;
      }

      const hasText = this.data.hasText;
      if (!hasText) {
        this.setData({
          textContent: '点击编辑文字',
          hasText: true
        });
        this.applyPresetAndTheme();
      }
      this.setData({ showEditPanel: true });
    },

    // ===== 文字点击 =====
    onTextTap() {
      if (this.data.hasText) {
        this.setData({ showEditPanel: true });
      }
    },

    // ===== 拖拽 =====
    onTextTouchStart(e: any) {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        this.setData({
          touchStartPos: { x: touch.clientX, y: touch.clientY },
          textStartPos: { x: this.data.textX, y: this.data.textY }
        });
      }
    },

    onTextTouchMove(e: any) {
      if (e.touches.length === 1 && this.data.touchStartPos && this.data.textStartPos) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.data.touchStartPos.x;
        const deltaY = touch.clientY - this.data.touchStartPos.y;

        let newX = this.data.textStartPos.x + deltaX;
        let newY = this.data.textStartPos.y + deltaY;

        newX = Math.max(0, Math.min(this.data.canvasWidth, newX));
        newY = Math.max(0, Math.min(this.data.canvasHeight, newY));

        const centerX = this.data.canvasWidth / 2;
        const centerY = this.data.canvasHeight / 2;
        const snapThreshold = 15;

        if (Math.abs(newX - centerX) < snapThreshold) {
          newX = centerX;
          wx.vibrateShort({ type: 'light' });
        }
        if (Math.abs(newY - centerY) < snapThreshold) {
          newY = centerY;
          wx.vibrateShort({ type: 'light' });
        }

        this.setData({ textX: newX, textY: newY });
      }
    },

    onTextTouchEnd() {
      this.setData({
        touchStartPos: null,
        textStartPos: null
      });
    },

    // ===== 文字输入 =====
    onTextInput(e: any) {
      this.setData({ textContent: e.detail.value });
    },

    // ===== 面板操作 =====
    onClosePanel() {
      this.setData({ showEditPanel: false });
    },

    onDeleteText() {
      this.setData({
        textContent: '',
        hasText: false,
        showEditPanel: false
      });
    },

    preventMove() {},

    // ===== 重置 =====
    onReset() {
      wx.showModal({
        title: '确认重置',
        content: '确定要清空所有内容吗？',
        success: (res) => {
          if (res.confirm) {
            this.setData({
              imageUrl: '',
              imageInfo: null,
              cropInfo: null,
              canvasWidth: 300,
              canvasHeight: 400,
              imgDisplayW: 0,
              imgDisplayH: 0,
              imgOffsetX: 0,
              imgOffsetY: 0,
              selectedRatio: '3:4',
              selectedTextPreset: '大字标题',
              selectedTheme: '极简',
              textContent: '',
              hasText: false,
              textX: 150,
              textY: 200,
              showEditPanel: false,
              useGradientBg: false,
              gradientBackground: null,
              gradientBgStr: '',
            });
          }
        }
      });
    },

    // ===== 在 Canvas 上绘制渐变背景 =====
    drawGradientBg(ctx: any, bg: TemplateBackground, w: number, h: number) {
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

      // 暗色叠加
      if (bg.overlayOpacity && bg.overlayOpacity > 0) {
        ctx.fillStyle = `rgba(0,0,0,${bg.overlayOpacity})`;
        ctx.fillRect(0, 0, w, h);
      }
    },

    // ===== 在 Canvas 上绘制文字 =====
    drawTextOnCanvas(ctx: any, data: any, exportWidth: number, exportHeight: number, canvasW: number, canvasH: number) {
      if (!data.hasText || !data.textContent) return;

      const theme = THEME_LIST.find(t => t.name === data.selectedTheme)!;
      const scaleX = exportWidth / canvasW;
      const scaleY = exportHeight / canvasH;

      const scaledFontSize = Math.round(data.actualFontSize * scaleX);
      const weightStr = data.actualFontWeight === 'bold' ? 'bold' : 'normal';
      ctx.font = `${weightStr} ${scaledFontSize}px "${data.actualFontFamily}", sans-serif`;
      ctx.textAlign = data.actualTextAlign === 'center' ? 'center' : 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = data.actualColor;

      if (data.actualGlowEffect) {
        ctx.shadowColor = theme.glowColor;
        ctx.shadowBlur = theme.glowBlur * scaleX;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      const lines = data.textContent.split('\n');
      const lineHeightPx = scaledFontSize * data.actualLineHeight;
      const totalTextHeight = lines.length * lineHeightPx;
      const scaledCenterX = data.textX * scaleX;
      const scaledCenterY = data.textY * scaleY;
      const startY = scaledCenterY - totalTextHeight / 2 + lineHeightPx / 2;

      lines.forEach((line: string, i: number) => {
        const lineY = startY + i * lineHeightPx;
        ctx.fillText(line, scaledCenterX, lineY);

        if (data.actualGlowEffect) {
          ctx.shadowBlur = theme.glowBlur * scaleX * 2;
          ctx.fillText(line, scaledCenterX, lineY);
          ctx.shadowBlur = theme.glowBlur * scaleX;
        }
      });

      // 清除阴影
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
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
            const ctx = canvas.getContext('2d');

            const { imageInfo, cropInfo, canvasWidth, canvasHeight, useGradientBg, gradientBackground } = this.data;

            // 确定导出尺寸
            let exportWidth: number;
            let exportHeight: number;

            if (imageInfo && cropInfo) {
              exportWidth = cropInfo.w;
              exportHeight = cropInfo.h;
            } else {
              // 渐变模板，使用默认导出尺寸
              const defaultSize = DEFAULT_EXPORT_SIZES[this.data.selectedRatio] || { w: 1080, h: 1440 };
              exportWidth = defaultSize.w;
              exportHeight = defaultSize.h;
            }

            canvas.width = exportWidth;
            canvas.height = exportHeight;

            // 绘制背景
            if (imageInfo && imageInfo.path) {
              // 有用户图片：绘制裁切后的图片
              const img = canvas.createImage();
              img.src = imageInfo.path;

              img.onload = () => {
                ctx.drawImage(img, (cropInfo && cropInfo.x) || 0, (cropInfo && cropInfo.y) || 0,
                  (cropInfo && cropInfo.w) || exportWidth, (cropInfo && cropInfo.h) || exportHeight,
                  0, 0, exportWidth, exportHeight);

                this.drawTextOnCanvas(ctx, this.data, exportWidth, exportHeight, this.data.canvasWidth, this.data.canvasHeight);
                this.doCanvasExport(canvas);
              };

              img.onerror = () => {
                wx.hideLoading();
                wx.showToast({ title: '图片加载失败', icon: 'error' });
              };
            } else if (useGradientBg && gradientBackground) {
              // 渐变背景
              this.drawGradientBg(ctx, gradientBackground, exportWidth, exportHeight);
              this.drawTextOnCanvas(ctx, this.data, exportWidth, exportHeight, this.data.canvasWidth, this.data.canvasHeight);
              this.doCanvasExport(canvas);
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

    // ===== Canvas 导出到相册 =====
    doCanvasExport(canvas: any, callback?: (filePath: string) => void) {
      wx.canvasToTempFilePath({
        canvas: canvas,
        success: (saveRes) => {
          if (callback) {
            callback(saveRes.tempFilePath);
            return;
          }
          wx.saveImageToPhotosAlbum({
            filePath: saveRes.tempFilePath,
            success: () => {
              wx.hideLoading();
              this.setData({
                showShareSheet: true,
                lastSavedFilePath: saveRes.tempFilePath,
              });
            },
            fail: (err) => {
              wx.hideLoading();
              if (err.errMsg.includes('auth deny')) {
                wx.showModal({
                  title: '提示',
                  content: '需要您授权保存图片到相册',
                  success: (modalRes) => {
                    if (modalRes.confirm) {
                      wx.openSetting();
                    }
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
            const ctx = canvas.getContext('2d');

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

            canvas.width = exportWidth;
            canvas.height = exportHeight;

            const finalize = () => {
              this.drawTextOnCanvas(ctx, this.data, exportWidth, exportHeight, this.data.canvasWidth, this.data.canvasHeight);
              this.drawWatermark(ctx, exportWidth, exportHeight);
              this.doCanvasExport(canvas);
            };

            if (imageInfo && imageInfo.path) {
              const img = canvas.createImage();
              img.src = imageInfo.path;
              img.onload = () => {
                ctx.drawImage(img, (cropInfo && cropInfo.x) || 0, (cropInfo && cropInfo.y) || 0,
                  (cropInfo && cropInfo.w) || exportWidth, (cropInfo && cropInfo.h) || exportHeight,
                  0, 0, exportWidth, exportHeight);
                finalize();
              };
              img.onerror = () => {
                wx.hideLoading();
                wx.showToast({ title: '图片加载失败', icon: 'error' });
              };
            } else if (useGradientBg && gradientBackground) {
              this.drawGradientBg(ctx, gradientBackground, exportWidth, exportHeight);
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

    // ===== 绘制水印 =====
    drawWatermark(ctx: any, exportWidth: number, exportHeight: number) {
      const padding = Math.round(exportWidth * 0.03);
      const fontSize = Math.round(exportWidth * 0.022);
      const qrSize = Math.round(exportWidth * 0.06);

      // 品牌名文字
      ctx.font = `normal ${fontSize}px sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText('文章配图助手', exportWidth - padding, exportHeight - padding - qrSize - 6);

      // 尝试绘制二维码图片（如果存在）
      const qrImg = ctx.createImage ? ctx.createImage() : null;
      if (qrImg) {
        qrImg.src = '/images/watermark-qr.png';
        // 如果图片加载成功就绘制，否则只显示文字
        try {
          ctx.drawImage(qrImg, exportWidth - padding - qrSize, exportHeight - padding - qrSize, qrSize, qrSize);
        } catch (e) {
          // QR图片加载失败，只保留文字水印
        }
      }
    },

    // ===== 分享面板事件 =====
    onCloseShareSheet() {
      this.setData({ showShareSheet: false });
      wx.showToast({ title: '保存成功', icon: 'success' });
    },
  }
});
