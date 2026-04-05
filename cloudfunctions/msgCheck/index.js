const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { content } = event
  const wxContext = cloud.getWXContext()

  try {
    const result = await cloud.openapi.security.msgSecCheck({
      openid: wxContext.OPENID,
      content: content,
      version: 2,
      scene: 2
    })

    // 2.0 版本：通过 result.result.suggest 判断是否通过
    const pass = result.errCode === 0 &&
                 result.result &&
                 result.result.suggest === 'pass'
    return { pass, errcode: result.errCode, errmsg: result.errMsg, result: result.result }
  } catch (err) {
    console.error('msgSecCheck error:', err)
    return { pass: false, errcode: -1, errmsg: err.message || 'check failed' }
  }
}
