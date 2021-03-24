var dailyShop = {
  dovideoIntegralTask: async (request, options) => {
    await require('./rewardVideo').doTask(request, {
      ...options,
      acid: 'AC20200624091508',
      taskId: '10e36b51060a46499e48082656602bf8',
      codeId: 945254816,
      reward_name: '10分精彩看视频得积分',
      remark: '支付页'
    })
  },
}
module.exports = dailyShop