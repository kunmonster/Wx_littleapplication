//app.js
App({
  globalData:{
  },
  onLaunch: function () {
    let that = this;
    wx.cloud.init({
      env: "demo3-9gcfnciq7761675c",
      traceUser: true
    })
    that.globalData.tag = 0;
  }
  
})