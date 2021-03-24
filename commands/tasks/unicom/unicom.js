const {scheduler} = require('../../../utils/scheduler')

var start = async (params) => {
  const {cookies, options} = params

  let init = async (request, savedCookies) => {
    await require('./init')(request, {
      ...params,
      cookies: savedCookies || cookies
    })
    return {
      request
    }
  }
  let taskOption = {
    init
  }

  // 每日签到积分 integral 1 flow 180 签到得积分
  await scheduler.regTask('dailysignin', async (request) => {
    await require('./dailysignin').doTask(request, options)
    await require('./integral').addFlow(request, options)
  }, taskOption)

  // 【阅读计时器任务得积分】 integral 10 【阅读打卡看视频得积分】 integral 2
  await scheduler.regTask('dailyBookRead', async (request) => {
    // 首页-小说-阅读越有礼打卡赢话费
    await require('./dailyBookRead').doTask(request, options)
    await require('./dailyVideoBook').doTask(request, options)
  }, taskOption)

  // 首页-小说-阅读现金红包雨-看视频得积分  【现金红包雨看视频得积分】 integral 2
  await scheduler.regTask('dailyRedbagRainVideoIntegral', async (request) => {
    await require('./dailyRedbagRain').dovideoIntegralTask(request, options)
  }, taskOption)

  // 首页-小说-章节详情-看视频领积分 【章节视频得积分】  integral 6
  await scheduler.regTask('dailyBookVideo', async (request) => {
    await require('./dailyVideoBook').dovideoIntegralTask(request, options)
    await require('./dailyBookVideo').doTask(request, options)
  }, taskOption)

  // 首页-签到有礼-免费领-浏览领积分  【手机浏览有礼发积分】 integral 15
  await scheduler.regTask('dailyLiuLan', async (request) => {
    await require('./dailyTTliulan').doTask(request, options)
  }, taskOption)

  // 首页-签到有礼-免费抽-拿红米笔记本-接元宝 【签到页聚宝盆游戏】 integral 2 【签到小游戏接元宝】 integral 12
  await scheduler.regTask('dailyIngots', async (request) => {
    await require('./dailyIngots').doTask(request, options)
  }, taskOption)

  // 首页-签到有礼-免费抽-拿666积分-豪礼大派送抽奖 【签到抽奖小游戏】 integral 4
  await scheduler.regTask('jflottery', async (request) => {
    await require('./jflottery').timesDraw(request, options)
  }, taskOption)

  // 首页-签到有礼-免费抽-拿苹果iPad Pro(摇一摇) 【签到小游戏摇摇乐不倒翁】 【签到抽奖小游戏】
  await scheduler.regTask('dailyYYY', async (request) => {
    await require('./dailyYYY').doTask(request, options)
  }, taskOption)

  // 首页-签到有礼-免费抽-拆华为Pad(去抽奖) 【签到抽奖小游戏】  +1 【签到小游戏盲盒2】 +4
  await scheduler.regTask('dailyLKMH', async (request) => {
    await require('./dailyLKMH').doTask(request, options)
  }, taskOption)

  // 首页-签到有礼-免费抽-拿iPhone12(摇一摇) 【签到抽奖小游戏】  +2 【签到小游戏买扭蛋机2】 +12
  await scheduler.regTask('dailyYYQ', async (request) => {
    await require('./dailyYYQ').doTask(request, options)
  }, taskOption)

  // 首页-签到有礼-赚更多福利-看视频奖励5积分  【签到看视频得积分】  +5
  await scheduler.regTask('dailyVideo', async (request) => {
    await require('./dailyVideo').doTask(request, options)
  }, taskOption)

  // 首页-游戏-娱乐中心-每日打卡 【游戏任务积分】 +3
  await scheduler.regTask('producGameSignin', async (request) => {
    await require('./producGame').gameBox(request, options)
    await require('./producGame').gameSignin(request, options)
  }, taskOption)

  // 首页-积分查询-游戏任务 【游戏任务积分】 + 43
  await scheduler.regTask('dailygameIntegral', async (request) => {
    await require('./producGame').doGameIntegralTask(request, options)
  }, taskOption)

  // 首页-游戏-娱乐中心-每日打卡-完成今日任务(200m) 【游戏视频任务积分】+10 流量 200
  await scheduler.regTask('todayDailyTask', async (request) => {
    await require('./producGame').gameBox(request, options)
    await require('./producGame').doTodayDailyTask(request, options)
  }, {
    ...taskOption,
    startTime: 22 * 3600
  })

  // 首页-积分商城-火热抢购-三只松鼠-看视频得积分 【游戏视频任务积分】+10 【支付页】+15
  await scheduler.regTask('dailyShopVideoIntegral', async (request) => {
    await require('./dailyShop').dovideoIntegralTask(request, options)
  }, taskOption)

  // 服务-办理-套餐变更-赚积分 【套餐变更看视频得积分】 +10
  await scheduler.regTask('dailyPackageIntegral', async (request) => {
    await require('./dailyOtherRewardVideo').doPackeageChangeVideoIntegralTask(request, options)
  }, taskOption)

  // 服务-查询-电子发票-赚积分 【电子发票看视频得积分】 +10
  await scheduler.regTask('dailyWisdomActivityIntegral', async (request) => {
    await require('./dailyOtherRewardVideo').doWisdomActivityIntegralTask(request, options)
  }, taskOption)

  // 首页-签到有礼-免费领-饿了么红包 【领福利赚积分-翻倍得积分】
  await scheduler.regTask('dailyUnicomTask', async (request) => {
    await require('./dailyUnicomTask').doIntegralAd(request, options)
    await require('./dailyUnicomTask').doTurnCard(request, options)
  }, taskOption)

  // 首页-签到-APP下载领积分 【签到任务下载应用得积分】 +80
  await scheduler.regTask('dailyDownloadApp', async (request) => {
    await require('./dailyDownloadApp').doTask(request, options)
  }, {
    ...taskOption,
    startTime: 13 * 3600,
  })

  // 积分商城-疯踩小橙（沃耀联通小游戏） 【积分商城小游戏】 +120
  await scheduler.regTask('woyaoliantong', async (request) => {
    await require('./woyaoliantong').doTask(request, options)
  }, taskOption)

  // 清理领取某些未知方式的积分
  // 该处理可能会导致某些活动任务机会不足导致错误，所以执行时间要迟
  await scheduler.regTask('dailyOtherRewardVideo', async (request) => {
    await require('./dailyOtherRewardVideo').cleanRewardVideo(request, options)
  }, {
    ...taskOption,
    startTime: 21.5 * 3600,
    ignoreRelay: true
  })

  // 首页-游戏-娱乐中心-沃之树  flow 108
  await scheduler.regTask('dailywoTree', async (request) => {
    await require('./woTree').doTask(request, options)
  }, taskOption)

  // 首页-签到有礼-免费领-1G流量日包  【1GB流量日包】
  await scheduler.regTask('daily1GFlowTask', async (request) => {
    await require('./daily1GFlowTask').doTask(request, options)
  }, {
    ...taskOption,
    startTime: 20 * 3600,
    ignoreRelay: true
  })

  // 首页-游戏-娱乐中心-天天领取3G流量包 2800 flow
  await scheduler.regTask('dailygameflow', async (request) => {
    await require('./producGame').doGameFlowTask(request, options)
  }, taskOption)
}
module.exports = {
  start
}