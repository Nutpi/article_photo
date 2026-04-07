const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { fileID } = event

  try {
    console.log('[imgSecCheck] 开始检测图片:', fileID)

    // 从云存储下载文件
    const fileRes = await cloud.downloadFile({ fileID })
    const buffer = fileRes.fileContent

    if (!buffer) {
      return { pass: false, errcode: -1, errmsg: '文件下载失败' }
    }

    // 根据扩展名确定 contentType
    const ext = (fileID.split('.').pop() || 'jpg').toLowerCase()
    const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', bmp: 'image/bmp', gif: 'image/gif' }

    // 调用同步图片安全检测
    const result = await cloud.openapi.security.imgSecCheck({
      media: {
        contentType: mimeMap[ext] || 'image/jpeg',
        value: buffer
      }
    })

    console.log('[imgSecCheck] 检测结果:', result)
    return { pass: result.errCode === 0, errcode: result.errCode, errmsg: result.errMsg }
  } catch (err) {
    console.error('[imgSecCheck] error:', err)
    // 87014 表示内容不合规
    if (err.errCode === 87014) {
      return { pass: false, errcode: 87014, errmsg: '图片内容不合规' }
    }
    return { pass: false, errcode: -1, errmsg: err.errMsg || err.message || '检测失败' }
  }
}
