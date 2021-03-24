const {encrypt, decrypt} = require('./downapp/downappCryptoUtil')
const crypto = require('crypto');
const jce = require('./downapp/jce')
const zlib = require('zlib')

let publicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDb49jFnNqMDLdl87UtY5jOMqqdMuvQg65Zuva3Qm1tORQGBuM04u7fqygA64XbOx9e/KPNkDNDmqS8SlsAPL1fV2lqM/phgV0NY62TJqSR+PLngwJd2rhYR8wQ1N0JE+R59a5c08EGsd6axStjHsVu2+evCf/SWU9Y/oQpEtOjGwIDAQAB
-----END PUBLIC KEY-----`
const rsapublicKeyEncode = function (data, publicKey) {
  let crypted = crypto.publicEncrypt({
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_PADDING
  }, Buffer.from(data));
  return crypted;
};

function randomString(len) {
  len = len || 32;
  var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz';
  var maxPos = $chars.length;
  var pwd = '';
  for (i = 0; i < len; i++) {
    pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return pwd;
}

let cg = {
  dO: 0, // int
  fm: 1,// int
  fn: 2, // int
  fq: 3, // int
  fr: 4, // int
  fo: 5, // byte[]
  fD: 6, // cf
  ft: 7, // int
  un1: 8, // byte[]
  un2: 9, // int
}

var dailyDownloadApp = {
  rsaKey: {},
  decryptSK: () => {
    // /data/data/<package name>/shared_prefs/sk.xml
    let key_rsa = "" // 开发时使用的key_rsa
    let key = Buffer.from(key_rsa.replace(/\n/ig, ''), 'base64')
    let decodeStr = Buffer.from(decrypt(key)).toString()
    console.log(decodeStr)

    let splitIndex = decodeStr.indexOf("|")

    let rsaKey = {
      im: decodeStr.substring(0, splitIndex),  // randomEncodeKey
      il: decodeStr.substring(splitIndex + 1) // sessionId
    }
    console.log('use dev?', rsaKey)

    return (rsaKey.im && rsaKey.il) ? rsaKey : dailyDownloadApp.rsaKey
  },
  encryptCompData: (cmdId, compData, rsaKey, clientSashimi) => {
    let clientData = dailyDownloadApp.concat(cmdId, compData)
    console.log('encrypt flag', (clientSashimi.ft & 2))
    if ((clientSashimi.ft & 2) == 0) {
      console.log('encrypt data', rsaKey.im)
      console.log('clientData raw', Buffer.from(clientData).length, Buffer.from(clientData).toString('hex'))
      clientData = Buffer.from(encrypt(clientData, rsaKey.im))
      console.log('clientData enc', Buffer.from(clientData).length, Buffer.from(clientData).toString('hex'))
    }
    return clientData
  },
  tryCompData: (jceBytes, cmdId, clientSashimi, rsaKey) => {
    let compData = jceBytes;
    if (jceBytes != null) {
      try {
        console.log('jceBytes length', jceBytes.length)
        if (jceBytes.length > 50) {
          console.log('deflate data')
          console.log('compressed raw', compData.length, Buffer.from(compData).toString('hex'))
          compData = zlib.deflateSync(jceBytes);
          if (clientSashimi != null) {
            console.log('clientSashimi != null')
            let oldFlag = clientSashimi.ft;
            if (compData == null || compData.length >= jceBytes.length) {
              let compLen = compData == null ? -1 : compData.length;
              compData = jceBytes;
              clientSashimi.ft |= 1;
              console.log("ConverterUtil", "[shark_compress]donnot compress, length: " + jceBytes.length + " (if compress)|-> " + compLen + " cmdId: " + cmdId + " flag: " + oldFlag + " -> " + clientSashimi.ft);
            } else {
              clientSashimi.ft &= -2;
              console.log('compressed data', compData.length, Buffer.from(compData).toString('hex'))
              console.log("ConverterUtil", "[shark_compress]compressed, length: " + jceBytes.length + " -> " + compData.length + " cmdId: " + cmdId + " flag: " + oldFlag + " -> " + clientSashimi.ft);
            }
          }
          return {
            clientData: dailyDownloadApp.encryptCompData(cmdId, compData, rsaKey, clientSashimi),
            clientSashimi
          };
        }
      } catch (err) {
        return null;
      }
    }
    if (clientSashimi != null) {
      let oldFlag2 = clientSashimi.ft;
      clientSashimi.ft |= 1;
      console.log("ConverterUtil", "[shark_compress]without compress, length: " + (jceBytes != null ? "" + jceBytes.length : "null") + " cmdId: " + cmdId + " flag: " + oldFlag2 + " -> " + clientSashimi.ft);
    }

    return {
      clientData: dailyDownloadApp.encryptCompData(cmdId, compData, rsaKey, clientSashimi),
      clientSashimi
    }
  },
  concat: (cmdId, compData) => {
    let buf = Buffer.from('')
    if (cmdId) {
      buf = Buffer.alloc(4)
      buf.writeInt32BE(cmdId)
      console.log('cmdId', cmdId, Buffer.from(buf).toString('hex'))
    }
    if (compData) {
      buf = Buffer.concat([buf, Buffer.from(compData)])
    }
    return buf
  },
  buildReqRSA: () => {
    let reqRsaStruct = {
      dR: 0 // byte[0]=0
    }
    let randomEncodeKey = randomString(16); // "DFG#$%^#%$RGHR(&*M<><"//
    let rsaKey = {}
    let reqRsaParam = {}
    let sessionId = ''
    if (dailyDownloadApp.rsaKey.il && dailyDownloadApp.rsaKey.im) {
      randomEncodeKey = dailyDownloadApp.rsaKey.im
      sessionId = dailyDownloadApp.rsaKey.il
    }
    let prikey = rsapublicKeyEncode(randomEncodeKey, publicKey)
    reqRsaParam = {
      dR: prikey
    }
    console.log('randomEncodeKey', randomEncodeKey)
    console.log('sessionId', sessionId)
    console.log('prikey', prikey.toString('hex'))
    rsaKey = {
      im: randomEncodeKey,  // randomEncodeKey
      il: sessionId // sessionId
    }
    return {
      rsaKey,
      reqRSA: jce.encode(reqRsaParam, reqRsaStruct)
    }
  },
  buildReqSashimi: (byParam, data, rsaKey) => {
    console.log('data raw', data.length, Buffer.from(data).toString('hex'))
    let byStruct = {
      dO: 0, // int cmdid
      fm: 1, // int seqNo
      fn: 2, // int
      fo: 3, // byte[]
      fp: 4, // long
      fq: 5, // int
      fr: 6, // int
      fs: 7, // bx
      ft: 8 // int
    }

    // let byParam = {
    //     dO: cmdid,
    //     fm: seqNo,
    //     // fn: undefined,
    //     fo: undefined,
    //     // fp: 4294967296,
    //     ft: 0
    // }

    let {clientData, clientSashimi} = dailyDownloadApp.tryCompData(data, byParam.dO, byParam, rsaKey)
    console.log('ReqSashimi', {
      ...clientSashimi,
      fo: clientData
    })
    return jce.encodeNested({
      ...clientSashimi,
      fo: clientData
    }, byStruct)
  },
  buildBjParam: (adConf, seesionId) => {
    // bj
    let bjStruct = {
      cJ: 0, // apn  sharkfin.apn
      cX: 1, // sharkfin.authType
      as: 2, // sharkfin.guid
      cY: 3, // pid string  sharkfin.ext1
      cZ: 4, // sessionId
      cw: 5, // task config b()  sharkfin.buildno
      da: 6, // sharkfin.netType
      db: 7, // sharkfin.accountId
      dc: 8, // sharkfin.bootType
      dd: 9 // sharkfin.wsGuid
    }

    let sharkfinParam = {
      cJ: 1,
      cX: 0,
      as: adConf.guid,
      cY: 'b26527',
      // cZ: undefined,
      cw: 6015,
      da: 1,
      db: -1,
      dc: -1,
      // dd: null
    }
    if (seesionId) {
      sharkfinParam.cZ = seesionId
    }

    console.log('sharkfinParam', sharkfinParam)
    return jce.encodeNested(sharkfinParam, bjStruct)
  },
  buildReqSharkParam: (seqNo, bj, encoded_by) => {
    let reqSharkStruct = {
      fm: 0,// int seqNoTag
      fn: 1,// int
      fw: 2,// int
      fx: 3, // bj,
      fy: 4 // array by
    }
    let reqSharkParam = {
      fm: seqNo, // seqNo
      fw: 4, // 固定为4
      fx: bj,
      fy: [encoded_by]
    }
    console.log('reqSharkParam', reqSharkParam)
    let reqSharkEncoded = jce.encode(reqSharkParam, reqSharkStruct)
    // fs.writeFileSync(path.join(__dirname, 'downapp/1-1.bin'), Buffer.from(reqSharkEncoded))
    return reqSharkEncoded
  },
  doPost: async (axios, reqShark) => {
    // mazu.3g.qq.com
    // 163.177.92.29
    let res = await axios.request({
      url: 'http://163.177.92.27',
      headers: {
        'Content-Type': ' application/octet-stream',
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 6.0.1; VKY_AL00 Build/V417IR)'
      },
      method: 'post',
      responseType: 'arraybuffer',
      data: reqShark
    })
    console.log(res.data.length, Buffer.from(res.data).toString('hex'))
    return res.data
  },
  updateRsaKey: async (axios) => {
    let {rsaKey, reqRSA} = dailyDownloadApp.buildReqRSA()
    let adConf = {
      guid: '03021321010411160500055376653281'
    }
    let reqSashimi = dailyDownloadApp.buildReqSashimi({
      dO: 152,
      fm: 15,
      fo: undefined,
      ft: 0 | 2
    }, reqRSA, rsaKey)
    let bj = dailyDownloadApp.buildBjParam(adConf, rsaKey.il)
    let reqShark = dailyDownloadApp.buildReqSharkParam(12, bj, reqSashimi)
    // dailyDownloadApp.decodeClientData(reqShark, rsaKey)
    let result = await dailyDownloadApp.doPost(axios, reqShark)
    let tt = dailyDownloadApp.decodeServerData(result, rsaKey)
    // console.log(Buffer.from(tt))
    tt = jce.decode(Buffer.from(tt))
    dailyDownloadApp.rsaKey.im = rsaKey.im
    dailyDownloadApp.rsaKey.il = tt['0']
    console.log('updateRsaKey', dailyDownloadApp.rsaKey)
  },
  decryptData: (s2, rsaKey) => {
    let decryData = new Int8Array(s2.fo);
    console.log('decrypt flag', (s2.ft & 2))
    if ((s2.ft & 2) == 0) {
      console.log('decrypt data', rsaKey.im)
      console.log('decryData raw', Buffer.from(decryData).length, Buffer.from(decryData).toString('hex'))
      decryData = decrypt(decryData, rsaKey.im)
      console.log('decryData dec', Buffer.from(decryData).length, Buffer.from(decryData).toString('hex'))
    } else {
      decryData = decryData
    }
    let decmpData = null
    console.log('decryData length', decryData.length)
    if (decryData.length >= 4) {

      // 0-4 headbyte
      console.log('jce bytes count', decryData.length - 4)
      let jceCmpData = decryData.slice(4)

      if (jceCmpData != null && jceCmpData.length > 0) {
        if ((s2.ft & 1) == 0) {
          console.log('inflate data')
          console.log('uncompressed raw', jceCmpData.length, Buffer.from(jceCmpData).toString('hex'))
          decmpData = zlib.inflateSync(jceCmpData);
          console.log('uncompressed data', decmpData.length, Buffer.from(decmpData).toString('hex'))
        } else {
          decmpData = jceCmpData;
        }
        if (decmpData == null) {
          console.log("ConverterUtil", "[shark_v4]dataForReceive2JceBytes(), decompress failed!");
        }
      }
    }
    return decmpData
  },
  decodeServerData: (data, rsaKey) => {
    console.log('ServerData length', data.length)
    let r_s = jce.decode(data)// ch
    console.log(r_s)
    let r_s1 = jce.decode(r_s['2'][0], cg)  //cg
    console.log(r_s1)
    let r_s_decmpData = dailyDownloadApp.decryptData(r_s1, rsaKey)
    return r_s_decmpData
  },
  buildPStruct(productInfo) {
    // productInfo task
    let pStruct = {
      ae: 0, // int coin_productId
      af: 1, // int coin_version
    }
    // let productInfo = productInfos[0]
    let pParam = {
      ae: productInfo.coin_productId,
      af: productInfo.coin_version
    }
    console.log('pParam', pParam)
    return {
      productInfo,
      pStructEncoded: jce.encodeNested(pParam, pStruct)
    }
  },
  buildUserInfoStruct(user, productInfo, adConf) {
    let {pStructEncoded} = dailyDownloadApp.buildPStruct(productInfo)
    console.log('pStructEncoded', Buffer.from(pStructEncoded.data).toString('hex'))
    let userinfoStruct = {
      ap: 0, // p JceStruct productInfo
      aq: 1, // string  accountId  phone
      ar: 2, // string  loginKey  token
      as: 3, // string  guid
      at: 4, // string
    }
    let userinfoParam = {
      ap: pStructEncoded,
      aq: user.accountId,
      ar: user.loginKey,
      as: adConf.guid,
      at: ''
    }
    console.log('userinfoParam', userinfoParam)
    return {
      productInfo,
      userinfoParam,
      userinfoStructEncoded: jce.encodeNested(userinfoParam, userinfoStruct)
    }
  },
  buildTasksReq(user, productInfo, adConf) {
    let {userinfoStructEncoded} = dailyDownloadApp.buildUserInfoStruct(user, productInfo, adConf)
    console.log('userinfoStructEncoded', Buffer.from(userinfoStructEncoded.data).toString('hex'))
    let tasksReqStruct = {
      S: 0, // v JceStruct
      Z: 1 // array[taskid]
    }
    let tasksReqParam = {
      S: userinfoStructEncoded,
      Z: [productInfo.coin_unkown3]
    }
    console.log('tasksReqParam', tasksReqParam)
    return {
      productInfo,
      tasksReq: jce.encode(tasksReqParam, tasksReqStruct)
    }
  },
  getTasksReq: async (axios, options) => {
    const {ecs_token, platId} = options
    let rsaKey = dailyDownloadApp.decryptSK()
    let adConf = {
      guid: '03021321010411160500055376653281'
    }
    let user = {
      accountId: options.user + '',
      loginKey: `${ecs_token}|085`
    }

    let {tasksReq} = dailyDownloadApp.buildTasksReq(user, {
      coin_productId: 8127,
      coin_version: 1,
      coin_unkown3: platId // 812759 // 103
    }, adConf)

    let reqSashimi = dailyDownloadApp.buildReqSashimi({
      dO: 5110, // cmdid
      fm: 3,
      fo: undefined,
      ft: 0,
      fp: 4294967296 // 未知固定
    }, tasksReq, rsaKey)
    let bj = dailyDownloadApp.buildBjParam(adConf, rsaKey.il)
    let reqShark = dailyDownloadApp.buildReqSharkParam(3, bj, reqSashimi)
    // let dd = dailyDownloadApp.decodeClientData(reqShark, rsaKey)
    let productInfos = []
    let result = await dailyDownloadApp.doPost(axios, reqShark)
    let tt = dailyDownloadApp.decodeServerData(result, rsaKey)
    if (tt) {
      let s = jce.decode(tt)
      console.log(s)
      let s1 = jce.decode(s['1'][0])
      console.log(s1)
      s1['1'].map(s => {
        let s1 = jce.decode(s)
        console.log(s1)
        let s2 = jce.decode(s1['4'])
        console.log(s2)
        let s3 = jce.decode(s1['8'])
        console.log('decode productInfo', s3)
        productInfos.push(s3)
      })
    }
    return productInfos
  },
  buildTaskOrderData: (productInfo) => {
    let tasks = [{
      '0': productInfo.coin_unkown1,
      '1': productInfo.coin_task_id,
      '2': productInfo.coin_unkown2,
      '3': productInfo.coin_unkown3
    }]
    let result = []
    for (let task of tasks) {
      let t = jce.encode(task)
      console.log('task raw', t.length, task)
      result.push(t)
    }
    return result
  },
  buildSubmitTaskReq: (user, productInfo, adConf) => {
    let {userinfoStructEncoded} = dailyDownloadApp.buildUserInfoStruct(user, productInfo, adConf)
    console.log('userinfoStructEncoded', Buffer.from(userinfoStructEncoded.data).toString('hex'))
    let tasksReqStruct = {
      S: 0, // v JceStruct
      Z: 1 // array[taskid]
    }
    let tasksReqParam = {
      S: userinfoStructEncoded,
      Z: dailyDownloadApp.buildTaskOrderData(productInfo) // order_data
    }
    console.log('tasksReqParam', tasksReqParam)

    return {
      tasksReq: jce.encode(tasksReqParam, tasksReqStruct)
    }
  },
  submitTaskReq: async (axios, options) => {
    const {productInfo, ecs_token, activity} = options
    let rsaKey = dailyDownloadApp.decryptSK()
    let adConf = {
      guid: '03021321010411160500055376653281'
    }
    let account = {
      yhChannel: "GGPD",
      accountChannel: "517050707",
      accountUserName: "517050707",
      accountPassword: "123456",
      accountToken: "4640b530b3f7481bb5821c6871854ce5",
    }
    let user = {
      accountId: `${options.user}`,
      loginKey: `${ecs_token}|085|${activity.activityId}|${activity.taskId}|${productInfo.coin_unkown3}|10.0.2.15|${account.yhChannel}|${account.accountChannel}|${account.accountUserName}|${account.accountPassword}|${account.accountToken}|${activity.unk}`
    }
    let {tasksReq} = dailyDownloadApp.buildSubmitTaskReq(user, productInfo, adConf)
    let reqSashimi = dailyDownloadApp.buildReqSashimi({
      dO: 5112,
      fm: 22,
      fo: undefined,
      ft: 0,
      fp: 4294967296
    }, tasksReq, rsaKey)
    let bj = dailyDownloadApp.buildBjParam(adConf, rsaKey.il)
    let reqShark = dailyDownloadApp.buildReqSharkParam(158, bj, reqSashimi)
    // let dd = dailyDownloadApp.decodeClientData(reqShark, rsaKey)
    let result = await dailyDownloadApp.doPost(axios, reqShark)
    let tt = dailyDownloadApp.decodeServerData(result, rsaKey)
    let t = jce.decode(Buffer.from(tt))
    let d = jce.decode(t['1'][0])
    console.info('下载任务ID已请求领取结束', d['0'])
  },
  doFiveTask: async (axios, options) => {
    const {ecs_token} = options
    console.log('开始 5次app任务')
    let productInfos = await dailyDownloadApp.getTasksReq(axios, {
      ...options,
      ecs_token,
      platId: 103
    })  // cmdid 5110
    let activity = {
      activityId: 'AC20200730144559',
      taskId: '1905b05581004ecf984150f95bd25e4e',
      unk: '946'
    }
    for (let productInfo of productInfos) {
      console.log('productInfo', productInfo)
      await dailyDownloadApp.submitTaskReq(axios, {
        ...options,
        ecs_token,
        activity,
        productInfo: {
          coin_productId: 8127,
          coin_version: 1,
          coin_unkown1: productInfo['0'],
          coin_task_id: productInfo['1'],
          coin_unkown2: productInfo['2'],
          coin_unkown3: productInfo['3'],
        }
      }) // cmdid 5112
      await new Promise((resolve, reject) => setTimeout(resolve, Math.floor(Math.random() * 1000) + 1000))
    }

    console.reward('integral', 50)
  },
  doThreeTask: async (axios, options) => {
    const {ecs_token} = options
    console.log('开始 3次app任务')
    let productInfos = await dailyDownloadApp.getTasksReq(axios, {
      ...options,
      ecs_token,
      platId: 812759
    })  // cmdid 5110
    let activity = {
      activityId: 'AC20200624091508',
      taskId: 'f65cd1e62af1407f88b069c0ffd4e1d8',
      unk: 'xxx'
    }
    for (let productInfo of productInfos) {
      console.log('productInfo', productInfo)
      await dailyDownloadApp.submitTaskReq(axios, {
        ...options,
        ecs_token,
        activity,
        productInfo: {
          coin_productId: 8127,
          coin_version: 1,
          coin_unkown1: productInfo['0'],
          coin_task_id: productInfo['1'],
          coin_unkown2: productInfo['2'],
          coin_unkown3: productInfo['3'],
        }
      }) // cmdid 5112
      await new Promise((resolve, reject) => setTimeout(resolve, Math.floor(Math.random() * 1000) + 1000))
    }

    console.reward('integral', 30)
  },
  doTask: async (axios, options) => {
    let {jar} = await require('./dailysignin').getIntegral(axios, options)
    let cookiesJson = jar.toJSON()
    let ecs_token = cookiesJson.cookies.find(i => i.key == 'ecs_token')
    ecs_token = ecs_token.value
    if (!ecs_token) {
      throw new Error('ecs_token缺失')
    }
    await dailyDownloadApp.updateRsaKey(axios) // cmdid 152

    // 3次下载
    await require('./dailyDownloadApp').doThreeTask(axios, {
      ...options,
      ecs_token
    })

    // 5次下载
    await require('./dailyDownloadApp').doFiveTask(axios, {
      ...options,
      ecs_token
    })

  }
}

module.exports = dailyDownloadApp