const crypto = require('crypto');
const {RSAUtils} = require('./RSAUtils');
const {appInfo, buildUnicomUserAgent} = require('../../../utils/device')

//阅读打卡看视频得积分
var transParams = (data) => {
  let params = new URLSearchParams();
  for (let item in data) {
    params.append(item, data['' + item + '']);
  }
  return params;
};

var dailyVideoBook = {
  doTask: async (axios, options) => {
    await require('./rewardVideo').doTask(axios, {
      ...options,
      acid: 'AC20200521222721',
      taskId: '2f2a13e527594a31aebfde5af673524f',
      codeId: 945535616,
      reward_name: '阅读打卡看视频得积分'
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
  login: async (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')
    //密码加密
    var modulus = "00D9C7EE8B8C599CD75FC2629DBFC18625B677E6BA66E81102CF2D644A5C3550775163095A3AA7ED9091F0152A0B764EF8C301B63097495C7E4EA7CF2795029F61229828221B510AAE9A594CA002BA4F44CA7D1196697AEB833FD95F2FA6A5B9C2C0C44220E1761B4AB1A1520612754E94C55DC097D02C2157A8E8F159232ABC87";
    var exponent = "010001";
    var key = RSAUtils.getKeyPair(exponent, '', modulus);
    let phonenum = RSAUtils.encryptedString(key, options.user);


    let {config: m_config} = await axios.request({
      headers: {
        "user-agent": useragent,
        "X-Requested-With": "XMLHttpRequest"
      },
      url: `https://m.iread.wo.cn/touchextenernal/common/shouTingLogin.action`,
      method: 'POST',
      data: transParams({
        phonenum
      })
    })
    let m_jar = m_config.jar
    let cookiesJson = m_jar.toJSON()
    let diwert = cookiesJson.cookies.find(i => i.key == 'diwert')
    let useraccount = cookiesJson.cookies.find(i => i.key == 'useraccount')
    if (!useraccount || !diwert) {
      throw new Error('获取用户信息失败')
    }

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
    cookiesJson = st_jar.toJSON()
    diwert = cookiesJson.cookies.find(i => i.key == 'diwert')
    useraccount = cookiesJson.cookies.find(i => i.key == 'useraccount')
    if (!useraccount || !diwert) {
      throw new Error('获取用户信息失败')
    }

    return {
      st_jar,
      m_jar
    }
  },
  addDrawTimes: async (axios, options) => {
    let {jar} = options
    const useragent = buildUnicomUserAgent(options, 'p')
    let {data} = await axios.request({
      headers: {
        "user-agent": useragent,
        "referer": `http://st.woread.com.cn/`,
        "origin": "http://st.woread.com.cn",
        "X-Requested-With": "XMLHttpRequest"
      },
      url: `http://st.woread.com.cn/touchextenernal/readluchdraw/addDrawTimes.action`,
      method: 'POST',
      jar
    })

    console.info('addDrawTimes', data.message)
  },
  addReadRatioToRedis: async (axios, options) => {
    let {jar, detail} = options
    const useragent = buildUnicomUserAgent(options, 'p')
    let {data} = await axios.request({
      headers: {
        "user-agent": useragent,
        "referer": `https://m.iread.wo.cn/`,
        "origin": "http://m.iread.wo.cn",
        "X-Requested-With": "XMLHttpRequest"
      },
      url: `http://m.iread.wo.cn/touchextenernal/contentread/addReadRatioToRedis.action`,
      method: 'POST',
      jar,
      data: transParams({
        'chapterallindex': detail.chapterallindex,
        'cntindex': detail.cntindex,
        'curChaptNo': detail.chapterseno,
        'curChaptRatio': '0.0539946886857252',
        'curChaptWidth': '313.052',
        'volumeallindex': detail.chapterallindex
      })
    })
    console.log('addReadRatioToRedis', data.message)
  },
  reportLatestRead: async (axios, options) => {
    let {jar, detail} = options
    const useragent = buildUnicomUserAgent(options, 'p')
    let {data} = await axios.request({
      headers: {
        "user-agent": useragent,
        "referer": `http://st.woread.com.cn/`,
        "origin": "http://st.woread.com.cn",
        "X-Requested-With": "XMLHttpRequest"
      },
      url: `http://st.woread.com.cn/touchextenernal/contentread/reportLatestRead.action`,
      method: 'POST',
      jar,
      data: transParams({
        'chapterallindex': detail.chapterallindex,
        'cntindex': detail.cntindex
      })
    })
    console.log('reportLatestRead', data.message)
  },
  sltPreReadChapter: async (axios, options) => {
    let {jar, detail} = options
    const useragent = buildUnicomUserAgent(options, 'p')
    let {data} = await axios.request({
      headers: {
        "user-agent": useragent,
        "referer": `http://st.woread.com.cn/`,
        "origin": "http://st.woread.com.cn",
        "X-Requested-With": "XMLHttpRequest"
      },
      url: `http://st.woread.com.cn/touchextenernal/contentread/sltPreReadChapter.action`,
      method: 'get',
      jar,
      params: transParams({
        'cntindex': detail.cntindex,
        'chapterseno': detail.chapterseno,
        'finishflag': '2',
        'beginchapter': '',
        'prenum': 1,
        'nextnum': 2,
        '_': new Date().getTime()
      })
    })
    console.log('sltPreReadChapter', data.curChapterTitle)
  },
  getActivityStatus: async (axios, options) => {
    let {jar, detail} = options
    const useragent = buildUnicomUserAgent(options, 'p')
    let {data} = await axios.request({
      headers: {
        "user-agent": useragent,
        "referer": `http://st.woread.com.cn/`,
        "origin": "http://st.woread.com.cn",
        "X-Requested-With": "XMLHttpRequest"
      },
      url: `http://st.woread.com.cn/touchextenernal/thanksgiving/getActivityStatus.action`,
      method: 'POST',
      jar
    })
    console.info('getActivityStatus', data.message)
  },
  dovideoIntegralTask: async (axios, options) => {
    await require('./rewardVideo').doTask(axios, {
      ...options,
      acid: 'AC20200521222721',
      taskId: '8e374761c0af4d9d9748ae9be7e5a3f8',
      codeId: 945559732,
      reward_name: '阅读看视频领积分'
    })
  },
  lookVideoDouble: async (axios, options) => {
    const {jar} = options
    let params = {
      'arguments1': '', // acid
      'arguments2': 'GGPD', // yhChannel
      'arguments3': '', // yhTaskId menuId
      'arguments4': new Date().getTime(), // time
      'arguments6': '',
      'arguments7': '',
      'arguments8': '',
      'arguments9': '',
      'orderId': crypto.createHash('md5').update(new Date().getTime() + '').digest('hex'),
      'netWay': 'Wifi',
      'remark': '签到积分翻倍',
      'remark1': '签到任务读小说赚积分',
      'version': appInfo.unicom_version,
      'codeId': 945535625
    }
    await require('./taskcallback').reward(axios, {
      ...options,
      params,
      jar
    })

    await dailyVideoBook.lookVideoDoubleResult(axios, options)
  },
  lookVideoDoubleResult: async (axios, options) => {
    const useragent = buildUnicomUserAgent(options, 'p')
    let {data} = await axios.request({
      headers: {
        "user-agent": useragent,
        "referer": `https://img.client.10010.com/`,
        "origin": "https://img.client.10010.com"
      },
      url: `https://act.10010.com/SigninApp/integral/giftBoints`,
      method: 'POST',
      data: transParams({
        'type': 'readNovelDouble'
      })
    })
    console.info('翻倍结果', data.msg)
  }
}

module.exports = dailyVideoBook