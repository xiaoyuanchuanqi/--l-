const {buildUnicomUserAgent} = require('../../../utils/device')

var integral = {
  addFlow: async (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')
    let i = 1
    do {
      // 签到看视频流量
      let {data} = await axios.request({
        headers: {
          "user-agent": useragent,
          "referer": "https://act.10010.com/SigninApp/",
          "origin": "https://act.10010.com"
        },
        url: `https://act.10010.com/SigninApp/mySignin/addFlow`,
        method: 'post',
        data: 'stepflag=22'
      })

      if (data.reason === '00') {
        console.reward('flow', data.addNum)
        console.info('获得流量+', data.addNum)
      }

      // 签到下载App奖励
      let {data: datan} = await axios.request({
        headers: {
          "user-agent": useragent,
          "referer": "https://act.10010.com/SigninApp/",
          "origin": "https://act.10010.com"
        },
        url: `https://act.10010.com/SigninApp/mySignin/addFlow`,
        method: 'post',
        data: 'stepflag=23'
      })
      if (datan.reason === '00') {
        console.reward('flow', data.addNum)
        console.info('获得流量+', datan.addNum)
      }
      ++i

    } while (i <= 3)
  },
}
module.exports = integral