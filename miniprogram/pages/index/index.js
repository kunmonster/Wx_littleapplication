const DB = wx.cloud.database();
const _ = DB.command;
var now = new Date();
var nowTime = now.getTime();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    undo_choice: 0,
    presstag: "none",
    doing_Num: 0,
    undo_Num: 0,
    finished_Num: 0,
    bt1: "white",
    touchId: 1, //页面初始化的时候的页面(doing)
    newStatus: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    let that = this;
    //调用云函数得到用户OPENID
    var app = getApp();
    console.log(app)

    if(app.globalData.tag == 0){
      wx.cloud.callFunction({
        name:"login",
        complete:function(res){
          app.globalData.tag = 1;
          console.log(res)
          that.setData({
            OPENID:res.result.OPENID
          })
        }
      })
    }

    this.checkUser()
  },
  checkUser: function () {
    let that = this;
    //查询用户是否在后台存在,如果存在将用户的信息从数据库拿出来
    DB.collection('user_sign').where({
        _openid: that.data.OPENID,
        content: _.exists(true),
        finished: _.exists(true)
      })
      .get({
        success: function (res) {
          var nameId = res.data[0]._id;
          var doing = new Array();
          var undo = new Array();
          var finished = new Array();
          var doing_index = new Array();
          var undo_index = new Array();
          finished = res.data[0].finished.slice(0);
          var length = res.data[0].content.length;
          for (var i = 0; i < length; i++) {
            var MissionTime = new Date(res.data[0].content[i].date.replace(/-/g, '/')).getTime();
            if (nowTime >= MissionTime) {
              //任务进行中
              doing.push(res.data[0].content[i]);
              doing_index.push(i);
            } else {
              //任务还未开始
              undo.push(res.data[0].content[i]);
              undo_index.push(i);
            }
          }
          that.setData({
            ID: nameId,
            content: res.data[0].content,
            doing: doing,
            undo: undo,
            finished: finished,
            doing_Num: doing.length,
            undo_Num: undo.length,
            finished_Num: finished.length,
            doing_index: doing_index,
            undo_index: undo_index,
            date: "2021-01-01",
            time: '08:00'
          })
          return true
        },
        fail: function (res) {
          wx.showModal({
            title: '提示',
            content: '你还没有创建一个任务，点击确定可以授权登录再创建',
            success: function (res) {
              if (res.confirm) {
                //用户点击确定授权登录
              }
            }
          })
          return false
        }
      })
  },
  DateChange: function (e) {
    this.setData({
      date: e.detail.value
    })
  },
  TimeChange: function (e) {
    this.setData({
      time: e.detail.value
    })
  },
  bt0click: function (e) {
    //将按钮与下面的滑块对应起来"未开始按钮"
    if (!this.newStatus)
      this.setData({
        touchId: 0
      })
  },
  bt1click: function (e) {
    //将按钮与下面的滑块对应起来"进行中按钮"
    if (!this.newStatus)
      this.setData({
        touchId: 1
      })
  },

  bt2click: function (e) {
    //将按钮与下面的滑块对应起来"已完成按钮"
    if (!this.newStatus)
      this.setData({
        touchId: 2
      })
  },
  focus: function (e) {
    this.setData({
      textColor: 'white'
    })
  },
  unfocus: function (e) {
    this.setData({
      textColor: null
    })
  },
  PageChange: function (event) {
    var touchId = event.detail.current
    switch (touchId) {
      case 0:
        this.setData({
          bt0: "white",
          bt1: "transparent",
          bt2: "transparent"
        })
        break;
      case 1:
        this.setData({
          bt0: "transparent",
          bt1: "white",
          bt2: "transparent"
        })
        break;
      case 2:
        this.setData({
          bt0: "transparent",
          bt1: "transparent",
          bt2: "white"
        })
        break;
    }


  },
  timestampToTime: function (timestamp) {
    var date = new Date(timestamp); //时间戳为10位需*1000，时间戳为13位的话不需乘1000
    var Y = date.getFullYear() + '-';
    var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    var D = date.getDate() + ' ';
    var h = date.getHours() + ':';
    var m = date.getMinutes() + ':';
    var s = date.getSeconds();
    return Y + M + D + h + m + s;
  },

  delpressUndo: function (event) {
    //长按任务模块出现删除按钮
    let that = this;
    var index = event.currentTarget.dataset.index;
    var true_index = that.data.undo_index[index]

    wx.showActionSheet({
      itemList: ['提前开始', '删除任务'],
      success(res) {
        var index_choice = res.tapIndex;
        if (index_choice == 0) {
          //更新数据库信息，改变该条任务的状态
          //将该待办事项的时间设置为当前时间
          DB.collection('user_sign').doc(that.data.ID).update({
            data: {
              ['content.' + [true_index]]: {
                date: that.timestampToTime(nowTime)
              }
            },
            success: function (e) {
              wx.showToast({
                title: '提示',
              })
              that.onLoad()
            },
            fail: function (e) {
            }
          })
        } else {
          //更新数据库信息，删除该条任务
          that.data.content.splice(true_index, 1)
          DB.collection('user_sign').doc(that.data.ID).update({
            data: {
              content: that.data.content
            },
            success: (res) => {
              that.onLoad();
              wx.showToast({
                title: '成功',
              })
            },
            fail: (res) => {
              wx.showToast({
                title: '失败',
                icon: 'error'
              })
            }
          })

        }
      },
      fail(res) {
        // console.log(res.errMsg)
      }
    })
  },
  delpressDoing: function (event) {
    let that = this;
    var index = event.currentTarget.dataset.index;
    var true_index = that.data.doing_index[index]
    // console.log(index)
    wx.showActionSheet({
      itemList: ['提前完成', '删除任务'],
      success(res) {
        var index_choice = res.tapIndex;
        var temp_value = that.data.content[true_index];
        temp_value.date = that.timestampToTime(nowTime);
        that.data.content.splice(true_index, 1);
        var temp = that.data.finished;
        temp.push(temp_value);
        if (index_choice == 0) {
          // 更新数据库，改变该条任务状态为完成
          DB.collection('user_sign').doc(that.data.ID).update({
            data: {
              content: that.data.content,
              finished: temp
            },
            success: (res) => {
              // console.log(res)
              that.onLoad();
              wx.showToast({
                title: '成功',
              })
            },
            fail: (res) => {
              wx.showToast({
                title: '失败',
                icon: 'error'
              })

            }
          })

        } else {
          //删除任务
          DB.collection('user_sign').doc(that.data.ID).update({
            data: {
              content: that.data.content
            },
            success: (res) => {
              // console.log(res)
              that.onLoad();
              wx.showToast({
                title: '成功',
              })
            },
            fail: (res) => {
              wx.showToast({
                title: '失败',
                icon: 'error'
              })

            }
          })
        }
      },
      fail(res) {
        // console.log(res.errMsg)
      }
    })



  },
  delpressFin: function (event) {
    var that = this;
    var index = event.currentTarget.dataset.index;
    // console.log(index)
    wx.showActionSheet({
      itemList: ['重做任务', '删除任务'],
      success(res) {
        var index_choice = res.tapIndex;
        if (index_choice == 0) {
          //更新数据库信息，改变任务
          var temp = that.data.finished[index];
          temp.date = that.timestampToTime(nowTime);
          that.data.content.push(temp);
          that.data.finished.splice(index, 1);
          DB.collection('user_sign').doc(that.data.ID).update({
            data: {
              content: that.data.content,
              finished: that.data.finished
            },
            success: function (e) {
              wx.showToast({
                title: '提示',
              })
              that.onLoad()
            }
            // fail: function (e) {
            //   // console.log(e)
            // }
          })

        } else {
          //删除任务
          that.data.finished.splice(index, 1);
          DB.collection('user_sign').doc(that.data.ID).update({
            data: {
              finished: that.data.finished
            },
            success: (res) => {
              // console.log(res)
              that.onLoad();
              // console.log(res)
              wx.showToast({
                title: '成功',
              })
            },
            fail: (res) => {
              wx.showToast({
                title: '失败',
                icon: 'error'
              })

            }
          })
        }
      },
      // fail(res) {
      //   console.log(res.errMsg)
      // }
    })
  },
  formSubmit: function (e) {
    let that = this;
    var newContent = {
      title: e.detail.value.title,
      date: e.detail.value.date + " " + e.detail.value.Time,
      content: e.detail.value.textArea
    };

    if ((newContent.title != "") && (newContent.content != "")) {
      //先查询在数据库中是否存在该用户
      if (that.data.content == null) {
        DB.collection('user_sign').add({
          data: {
            content: [newContent]
          }
        })
      } else {
        DB.collection('user_sign').doc(that.data.ID).update({
          data: {
            content: _.push(newContent)
          }
        })
      }
      that.setData({
        newStatus: false
      })
      that.onLoad();
    } else {
      wx.showModal({
        title: '提示',
        content: '标题或者内容不能为空',
        showCancel: false
      })
    }


  },
  back: function (e) {
    this.setData({
      newStatus: false
    })
  },
  newTarget: function (e) {
    let that = this;
    //按下添加按钮检测是否授权，授权了直接将标志置为新建，没授权拉起授权
    if (that.data.OPENID) {
      that.setData({
        newStatus: true,
        bt1: "white",
        bt2: "transparent",
        bt0: "transparent"
      })
    }
  },
  showcontent: function (e) {
    // console.log(e)
    let that = this;
    var tag = e.currentTarget.dataset.tag;
    var index = e.currentTarget.dataset.index;
    if (tag === "undo") {
      wx.showModal({
        title: "内容",
        content: that.data.undo[index].content,
        showCancel: false
      })
    } else if (tag === "doing") {
      wx.showModal({
        title: "内容",
        content: that.data.doing[index].content,
        showCancel: false

      })
    } else {
      wx.showModal({
        title: "内容",
        content: that.data.finished[index].content,
        showCancel: false
      })
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.onLoad();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})