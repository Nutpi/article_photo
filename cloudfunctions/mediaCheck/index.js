const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { fileID } = event
  const wxContext = cloud.getWXContext()

  try {
    // 获取文件临时下载链接（供微信服务器下载检测）
    const tempUrlRes = await cloud.getTempFileURL({ fileList: [fileID] })
    const mediaUrl = tempUrlRes.fileList[0].tempFileURL

    if (!mediaUrl) {
      return { submitted: false, errcode: -1, errmsg: '获取文件链接失败' }
    }

    // 调用 2.0 版本异步图片检测接口
    const result = await cloud.openapi.security.mediaCheckAsync({
      openid: wxContext.OPENID,
      media_url: mediaUrl,
      media_type: 2,
      version: 2,
      scene: 1
    })

    const submitted = result.errCode === 0
    return { submitted, errcode: result.errCode, errmsg: result.errMsg, trace_id: result.trace_id }
  } catch (err) {
    console.error('mediaCheckAsync error:', err)
    return { submitted: false, errcode: -1, errmsg: err.message || 'check failed' }
  }
}
