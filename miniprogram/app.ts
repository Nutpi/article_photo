App<IAppOption>({
  globalData: {},
  onLaunch() {
    wx.cloud.init({ traceUser: true });
    this.loadFonts();
  },

  loadFonts() {
    const fonts = [
      { 
        family: 'AaJianHaoTi', 
        networkPath: 'https://636c-cloud1-7g8g6kzj90e7c7e2-1325348850.tcb.qcloud.la/fonts/AaJianHaoTi-2.ttf'
      },
      { 
        family: 'MasaFont', 
        networkPath: 'https://636c-cloud1-7g8g6kzj90e7c7e2-1325348850.tcb.qcloud.la/fonts/MasaFont-Bold-2.ttf'
      },
      { 
        family: 'SetoFont', 
        networkPath: 'https://636c-cloud1-7g8g6kzj90e7c7e2-1325348850.tcb.qcloud.la/fonts/SetoFont-1.ttf'
      },
      { 
        family: 'SourceHanSerifCN', 
        networkPath: 'https://636c-cloud1-7g8g6kzj90e7c7e2-1325348850.tcb.qcloud.la/fonts/SourceHanSerifCN-Regular.otf'
      }
    ];

    fonts.forEach(font => {
      wx.loadFontFace({
        family: font.family,
        source: `url("${font.networkPath}")`,
        global: true,
        success: () => {
          console.log(`字体 ${font.family} 加载成功`);
        },
        fail: (err: any) => {
          console.warn(`字体 ${font.family} 加载失败:`, err);
        }
      });
    });
  },
});
