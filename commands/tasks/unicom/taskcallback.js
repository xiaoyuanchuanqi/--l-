var crypto = require('crypto');
const {appInfo} = require('../../../utils/device')

var transParams = (data) => {
  let params = new URLSearchParams();
  for (let item in data) {
    params.append(item, data['' + item + '']);
  }
  return params;
};

function encryption(data, key) {
  var iv = "";
  var cipherEncoding = 'base64';
  var cipher = crypto.createCipheriv('aes-128-ecb', key, iv);
  cipher.setAutoPadding(true);
  return Buffer.concat([cipher.update(data), cipher.final()]).toString(cipherEncoding);
}

function a(str) {
  str = str + str
  return str.substr(8, 16)
}

var taskcallback = {
  // 查询活动状态
  query: async (axios, options) => {
    let {params} = options
    const useragent = `okhttp/4.4.0`

    let {data, config} = await axios.request({
      baseURL: 'https://m.client.10010.com/',
      headers: {
        "user-agent": useragent,
        "referer": `https://img.client.10010.com/`,
        "origin": "https://img.client.10010.com"
      },
      url: `/taskcallback/taskfilter/query`,
      method: 'POST',
      data: transParams(params)
    })
    if (data.code === '0000') {
      console.info(data.timeflag === '1' ? `今日参加活动已达上限(${data.achieve}/${data.allocation}次)` : `活动可参加(${data.achieve}/${data.allocation}次)`)
      let num = parseInt(data.allocation) - parseInt(data.achieve)
      if (num > 0) {
        console.info('预计获得', data.prizeName, `${data.fixNum || 0}*${num} 共`, (data.fixNum || 0) * num)
      }
      return {
        num,
        fixNum: (data.fixNum || 0),
        jar: config.jar
      }
    } else {
      console.info('查询出错', data.desc)
      return {
        num: 0,
        jar: config.jar
      }
    }
  },
  reward: async (axios, options) => {
    let {params, jar} = options
    let cookiesJson = jar.toJSON()
    let ecs_token = cookiesJson.cookies.find(i => i.key == 'ecs_token')
    if (!ecs_token) {
      throw new Error('ecs_token缺失')
    }
    ecs_token = ecs_token.value
    let orderId = params.orderId || crypto.createHash('md5').update(new Date().getTime() + '').digest('hex')
    let codeId = parseInt(params.codeId || 945535616)
    let app_id = "5049584"
    let media_extra = [
      ecs_token,
      options.user,
      'android',
      params.arguments1,
      params.arguments2,
      orderId,// orderId
      codeId, //codeId
      params.remark,
      'Wifi'
    ]

    var data = {
      "oversea_version_type": 0,
      "reward_name": `android-${params.remark1 || params.remark}-激励视频`,
      "reward_amount": 1,
      "network": 4,
      "sdk_version": "3.3.0.3",
      "user_agent": "Mozilla\/5.0 (Linux; Android 9; VKY-AL00 Build\/HUAWEIVKY-AL00; wv) AppleWebKit\/537.36 (KHTML, like Gecko) Version\/4.0 Chrome\/86.0.4240.198 Mobile Safari\/537.36",
      "extra": {
        "app_name": appInfo.app_name,
        "src_type": "app",
        "package_name": appInfo.package_name,
        "rit": codeId
      },
      "media_extra": encodeURI(media_extra.join('|')),
      "video_duration": 28.143,
      "play_start_ts": new Date().getTime() - 32 * 1000,
      "play_end_ts": 0,
      "duration": 28143,
      "user_id": app_id,
      "trans_id": crypto.createHash('md5').update(new Date().getTime() + '').digest('hex')
    }

    let key = crypto.createHash('md5').update(new Date().getTime() + '').digest('hex').substr(8, 16)
    let t = JSON.stringify(data).replace(/\//g, "\\\/")//.replace('"{pack_time}"', '1.609770734935479E9')
    let m = encryption(t, a(key)).replace(/(.{76})/g, '$1\n')
    m = '2' + key + m

    var message = {
      message: m,
      cypher: 2
    }

    const useragent = `VADNetAgent/0`
    let res = await axios.request({
      headers: {
        "user-agent": useragent,
        "Content-Type": "application/json; charset=utf-8"
      },
      url: `https://api-access.pangolin-sdk-toutiao.com/api/ad/union/sdk/reward_video/reward/`,
      method: 'POST',
      data: message
    })
    data = res.data
    if ('code' in data) {
      throw new Error('获取激励信息出错')
    }

    return {
      orderId
    }
  },
  // 提交任务
  doTask: async (axios, options) => {
    let result = await taskcallback.reward(axios, options)
    let params = options.params
    params['orderId'] = result['orderId']
    delete params.codeId
    const useragent = `okhttp/4.4.0`
    let {data} = await axios.request({
      baseURL: 'https://m.client.10010.com/',
      headers: {
        "user-agent": useragent,
        "referer": `https://img.client.10010.com/`,
        "origin": "https://img.client.10010.com"
      },
      url: `/taskcallback/taskfilter/dotasks`,
      method: 'POST',
      data: transParams(params)
    })
    if (data.code === '0000') {
      console.reward('integral', data.prizeCount)
      console.info('提交任务成功', data.prizeName + '+' + data.prizeCount)
    } else {
      console.info('提交任务出错', data.desc)
    }
  },
  // 提交任务
  doReward: async (axios, options) => {
    return await taskcallback.reward(axios, options)
  },
}
module.exports = taskcallback