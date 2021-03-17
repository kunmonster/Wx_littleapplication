// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
  })
    return (cloud.openapi.security.msgSecCheck({
      content:event.value
    }))
}