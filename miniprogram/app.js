//app.js
App({
  onLaunch: function () {
    wx.cloud.init({
      env: "demo3-9gcfnciq7761675c",
      traceUser: true
    })
  }
})