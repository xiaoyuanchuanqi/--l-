const {appInfo, buildUnicomUserAgent} = require('../../../utils/device')
const {RSAUtils} = require('./RSAUtils');
const moment = require('moment');

var transParams = (data) => {
  let params = new URLSearchParams();
  for (let item in data) {
    params.append(item, data['' + item + '']);
  }
  return params;
};

// 阅读-每晚8点现金红包雨
var dailyRedbagRain = {
  dovideoIntegralTask: async (request, options) => {
    await require('./rewardVideo').doTask(request, {
      ...options,
      acid: 'AC20200521222721',
      taskId: 'c32ef7f06d8e4b5fa3818a5504da2109',
      codeId: 945569148,
      reward_name: '现金红包雨看视频得积分'
    })
  },
  oauthMethod: async (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')
    let {data} = await axios.request({
      headers: {
        "user-agent": useragent,
        "referer": `https://img.client.10010.com/`,
        "origin": "https://img.client.10010.com"
      },
      url: `https://m.client.10010.com/finderInterface/woReadOauth/?typeCode=oauthMethod`,
      method: 'GET'
    })
    return data.data.key
  },
  shouTingLogin: async (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')
    //密码加密
    var modulus = "00D9C7EE8B8C599CD75FC2629DBFC18625B677E6BA66E81102CF2D644A5C3550775163095A3AA7ED9091F0152A0B764EF8C301B63097495C7E4EA7CF2795029F61229828221B510AAE9A594CA002BA4F44CA7D1196697AEB833FD95F2FA6A5B9C2C0C44220E1761B4AB1A1520612754E94C55DC097D02C2157A8E8F159232ABC87";
    var exponent = "010001";
    var key = RSAUtils.getKeyPair(exponent, '', modulus);
    let phonenum = RSAUtils.encryptedString(key, options.user);

    let {config: st_config} = await axios.request({
      headers: {
        "user-agent": useragent,
        "X-Requested-With": "XMLHttpRequest"
      },
      url: `http://st.woread.com.cn/touchextenernal/common/shouTingLogin.action`,
      method: 'POST',
      data: transParams({
        phonenum
      })
    })
    let st_jar = st_config.jar
    let cookiesJson = st_jar.toJSON()
    let diwert = cookiesJson.cookies.find(i => i.key == 'diwert')
    let userAccount = cookiesJson.cookies.find(i => i.key == 'useraccount')
    if (!userAccount || !diwert) {
      throw new Error('获取用户信息失败')
    }
    return {
      st_jar,
      phonenum
    }
  },
}
module.exports = dailyRedbagRain