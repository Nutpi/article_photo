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

Component({
  data: {
    // --- 比例 ---
    ratioList: RATIO_LIST,
    selectedRatio: '3:4',

    // --- 图片 ---
    imageUrl: '',
    imageInfo: null as ImageInfo | null,
    cropInfo: null as CropInfo | null,

    // --- 画布 ---
    canvasWidth: 300,
    canvasHeight: 400,

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
    textStartPos: null as { x: number; y: number } | null
  },

  methods: {
    // ===== 图片上传 =====
    onChooseImage() {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePath = res.tempFiles[0].tempFilePath;

          // 先显示图片
          this.setData({ imageUrl: tempFilePath });
          wx.getImageInfo({
            src: tempFilePath,
            success: (info) => {
              this.setData({
                imageInfo: {
                  width: info.width,
                  height: info.height,
                  path: tempFilePath
                }
              });
              this.recalculate();
            }
          });

          // 后台异步进行图片内容安全检测
          this.checkMediaSecurity(tempFilePath);
        }
      });
    },

    // ===== 图片内容安全检测（2.0 异步接口） =====
    checkMediaSecurity(filePath: string) {
      console.log('[安全检测] 开始检测图片:', filePath);

      const uploadAndCheck = (localPath: string) => {
        const ext = localPath.split('.').pop() || 'jpg';
        const cloudPath = 'sec-check/' + Date.now() + '-' + Math.random().toString(36).substring(2, 10) + '.' + ext;

        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: localPath,
          success: (uploadRes) => {
            console.log('[安全检测] 上传成功:', uploadRes.fileID);
            wx.cloud.callFunction({
              name: 'mediaCheck',
              data: { fileID: uploadRes.fileID },
              success: (funcRes: any) => {
                const result = funcRes.result;
                console.log('[安全检测] 检测提交结果:', result);
                if (!result.submitted) {
                  wx.showToast({ title: '安全检测提交失败，请重试', icon: 'none', duration: 3000 });
                  this.setData({ imageUrl: '', imageInfo: null, cropInfo: null });
                  wx.cloud.deleteFile({ fileList: [uploadRes.fileID] });
                }
                // mediaCheckAsync 是异步检测，不立即删除文件，等微信服务器下载后再清理
              },
              fail: (funcErr) => {
                console.warn('[安全检测] 云函数调用失败:', funcErr);
                this.setData({ imageUrl: '', imageInfo: null, cropInfo: null });
                wx.showToast({ title: '安全检测失败，请重试', icon: 'none' });
                wx.cloud.deleteFile({ fileList: [uploadRes.fileID] });
              }
            });
          },
          fail: (uploadErr) => {
            console.warn('[安全检测] 上传失败:', uploadErr);
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
      if (!imageInfo) return;

      const ratio = RATIO_LIST.find(r => r.name === selectedRatio)!;
      const targetRatio = ratio.widthRatio / ratio.heightRatio;

      // 计算画布显示尺寸
      const systemInfo = wx.getSystemInfoSync();
      const maxWidth = systemInfo.windowWidth - 48;
      const maxHeight = systemInfo.windowHeight - 380;

      let canvasWidth: number;
      let canvasHeight: number;

      if (targetRatio >= 1) {
        // 横向或方形
        canvasWidth = maxWidth;
        canvasHeight = canvasWidth / targetRatio;
        if (canvasHeight > maxHeight) {
          canvasHeight = maxHeight;
          canvasWidth = canvasHeight * targetRatio;
        }
      } else {
        // 竖向
        canvasHeight = maxHeight;
        canvasWidth = canvasHeight * targetRatio;
        if (canvasWidth > maxWidth) {
          canvasWidth = maxWidth;
          canvasHeight = canvasWidth / targetRatio;
        }
      }

      canvasWidth = Math.floor(canvasWidth);
      canvasHeight = Math.floor(canvasHeight);

      // 计算裁切区域（原图坐标系）
      const imgRatio = imageInfo.width / imageInfo.height;
      let cropInfo: CropInfo;

      if (imgRatio > targetRatio) {
        // 原图更宽，高度适配，宽度居中裁
        const cropH = imageInfo.height;
        const cropW = imageInfo.height * targetRatio;
        cropInfo = {
          x: Math.floor((imageInfo.width - cropW) / 2),
          y: 0,
          w: Math.floor(cropW),
          h: cropH
        };
      } else {
        // 原图更高，宽度适配，高度居中裁
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
      if (!this.data.imageUrl) {
        wx.showToast({ title: '请先上传图片', icon: 'none' });
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

        // 吸附中心
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
              selectedRatio: '3:4',
              selectedTextPreset: '大字标题',
              selectedTheme: '极简',
              textContent: '',
              hasText: false,
              textX: 150,
              textY: 200,
              showEditPanel: false
            });
          }
        }
      });
    },

    // ===== 保存导出 =====
    async onSave() {
      if (!this.data.imageUrl) {
        wx.showToast({ title: '请先上传图片', icon: 'none' });
        return;
      }

      // 如果有文字内容，先进行文字安全检测
      if (this.data.hasText && this.data.textContent) {
        try {
          const checkRes: any = await new Promise((resolve, reject) => {
            wx.cloud.callFunction({
              name: 'msgCheck',
              data: { content: this.data.textContent },
              success: resolve,
              fail: reject
            });
          });
          if (!checkRes.result.pass) {
            wx.showToast({ title: '文字内容不合规，请修改', icon: 'none', duration: 3000 });
            return;
          }
        } catch (err) {
          console.warn('[安全检测] 文字检测失败:', err);
          wx.showToast({ title: '安全检测失败，请重试', icon: 'none' });
          return;
        }
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

            const { imageInfo, cropInfo, canvasWidth, canvasHeight } = this.data;
            if (!imageInfo || !cropInfo) {
              wx.hideLoading();
              return;
            }

            // 导出尺寸 = 裁切区域的实际像素尺寸
            const exportWidth = cropInfo.w;
            const exportHeight = cropInfo.h;
            canvas.width = exportWidth;
            canvas.height = exportHeight;

            const img = canvas.createImage();
            img.src = imageInfo.path;

            img.onload = () => {
              // 绘制裁切后的图片
              ctx.drawImage(img, cropInfo.x, cropInfo.y, cropInfo.w, cropInfo.h, 0, 0, exportWidth, exportHeight);

              // 绘制文字
              if (this.data.hasText && this.data.textContent) {
                const {
                  textContent, textX, textY, canvasWidth: cw, canvasHeight: ch,
                  actualFontSize, actualLineHeight, actualFontWeight,
                  actualFontFamily, actualColor, actualGlowEffect
                } = this.data;

                const theme = THEME_LIST.find(t => t.name === this.data.selectedTheme)!;

                // 缩放比：画布坐标 → 导出坐标
                const scaleX = exportWidth / cw;
                const scaleY = exportHeight / ch;

                const scaledFontSize = Math.round(actualFontSize * scaleX);
                const weightStr = actualFontWeight === 'bold' ? 'bold' : 'normal';
                ctx.font = `${weightStr} ${scaledFontSize}px "${actualFontFamily}", sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = actualColor;

                // 发光效果
                if (actualGlowEffect) {
                  ctx.shadowColor = theme.glowColor;
                  ctx.shadowBlur = theme.glowBlur * scaleX;
                  ctx.shadowOffsetX = 0;
                  ctx.shadowOffsetY = 0;
                }

                // 多行文字
                const lines = textContent.split('\n');
                const lineHeightPx = scaledFontSize * actualLineHeight;
                const totalTextHeight = lines.length * lineHeightPx;
                const scaledCenterX = textX * scaleX;
                const scaledCenterY = textY * scaleY;
                const startY = scaledCenterY - totalTextHeight / 2 + lineHeightPx / 2;

                lines.forEach((line, i) => {
                  const lineY = startY + i * lineHeightPx;
                  ctx.fillText(line, scaledCenterX, lineY);

                  // 双重发光
                  if (actualGlowEffect) {
                    ctx.shadowBlur = theme.glowBlur * scaleX * 2;
                    ctx.fillText(line, scaledCenterX, lineY);
                    ctx.shadowBlur = theme.glowBlur * scaleX;
                  }
                });
              }

              wx.canvasToTempFilePath({
                canvas: canvas,
                success: (saveRes) => {
                  wx.saveImageToPhotosAlbum({
                    filePath: saveRes.tempFilePath,
                    success: () => {
                      wx.hideLoading();
                      wx.showToast({ title: '保存成功', icon: 'success' });
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
            };

            img.onerror = () => {
              wx.hideLoading();
              wx.showToast({ title: '图片加载失败', icon: 'error' });
            };
          });
      } catch (error) {
        wx.hideLoading();
        wx.showToast({ title: '保存失败', icon: 'error' });
      }
    }
  }
});
