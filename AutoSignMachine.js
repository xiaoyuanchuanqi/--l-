const yargs = require('yargs/yargs')
const path = require('path')
const log = require('./utils/log')

function registerEvn(argvs) {
  if ('verbose' in argvs) {
    process.env['asm_verbose'] = 'true'
  }
  process.env['asm_func'] = 'false'
  process.env['asm_code_dir'] = ''
  process.env['asm_save_data_dir'] = path.join(path.resolve("./"), '.cookies')
}

/**
 * 命令执行入口
 */
var AutoSignMachine_Run = (argv) => {
  argv = (argv || process.argv).slice(2)

  let argvs = yargs(argv)
    .commandDir('commands')
    .demand(1)
    .config('config', 'JSON配置文件路径')
    .help()
    .alias('h', 'help')
    .locale('en')
    .showHelpOnFail(true, '使用--help查看有效选项')
    .epilog('copyright 2020 LunnLew')
    .argv;

  registerEvn(argvs)

}
module.exports = {
  run: AutoSignMachine_Run
}