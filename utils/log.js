const util = require('util')
const fs = require('fs-extra');
var moment = require('moment');
var notify_logs = {}
var wrapper_color = (type, msg) => {
  if (process.stdout.isTTY) {
    if (type === 'error') {
      msg = `\x1B[31m${msg}\x1B[0m`
    } else if (type === 'reward') {
      msg = `\x1B[36m${msg}\x1B[0m`
    }
  }
  if (type === 'error') {
    msg = '[❌🤣🌋] ' + msg
  } else if (type === 'reward') {
    msg = '[✅🤩🍗] ' + msg
  }
  return msg
}
var stdout_task_msg = (msg) => {
  if ('current_task' in process.env && process.env.current_task) {
    msg = moment().format("YYYY-MM-DD HH:mm:ss") + "  " + `${process.env.current_task}: ` + msg
  }
  process.stdout.write(msg + '\n')
}
console.notify = function () {
  if ('current_task' in process.env) {
    if (!(process.env.current_task in notify_logs)) {
      notify_logs[process.env.current_task] = []
    }
    notify_logs[process.env.current_task].push(util.format.apply(null, arguments) + '\n')
  }
  stdout_task_msg(util.format.apply(null, arguments))
}

console.log = function () {
  if (process.env.asm_verbose === 'true') {
    stdout_task_msg(util.format.apply(null, arguments))
  }
}

console.info = function () {
  stdout_task_msg(util.format.apply(null, arguments))
}

console.error = function () {
  stdout_task_msg(wrapper_color('error', util.format.apply(null, arguments)))
}

console.reward = function () {
  let type, num
  if (arguments.length === 2) {
    type = arguments[0]
    num = arguments[1]
  } else if (arguments.length === 1) {
    type = arguments[0]
    num = 1

    if (arguments[0].indexOf('奖励积分') !== -1) {
      type = 'integral'
      num = parseInt(arguments[0])
    }
    if (arguments[0].indexOf('通信积分') !== -1) {
      type = 'txintegral'
      num = parseInt(arguments[0])
    }
    if (arguments[0].indexOf('定向积分') !== -1) {
      type = 'dxintegral'
      num = parseInt(arguments[0])
    }
  }

  stdout_task_msg(wrapper_color('reward', util.format.apply(null, [type, num])))

  let taskJson = fs.readFileSync(process.env.taskfile).toString('utf-8')
  taskJson = JSON.parse(taskJson)
  if (!('rewards' in taskJson)) {
    taskJson['rewards'] = {}
  }
  let rewards = taskJson.rewards
  if (!(type in rewards)) {
    rewards[type] = parseInt(num || 0)
  } else {
    rewards[type] += parseInt(num || 0)
  }
  taskJson['rewards'] = rewards

  fs.writeFileSync(process.env.taskfile, JSON.stringify(taskJson))
}
