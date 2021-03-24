# 联通 APP 签到任务

## 安卓手机运行

> 凡是碰到执行代码中出现（Y/N）的一律打上打上字母Y回车

打开 `Termux`，`Termux` 带有一个包管理器 `apt`，平常要装什么包都要用 `apt` 命令。 先输入以下命令：

1. 输入 `apt update` 回车

2. 输入 `apt upgrade` 回车

   这是进行本身功能升级，某些时候这是必须的，否则不能安装 `nodejs`

3. 然后，安装nodejs： 输入 `apt install nodejs` 回车

4. 安装个编辑器： 输入 `apt install vim` 回车

5. 复制脚本文件夹到手机目录 输入 `cd xxx` 回车( `xxx` 为脚本文件夹的名字)
   进入 `xxx` 目录内 输入 `npm i` 回车安装所有依赖

6. 运行全局任务代码

   ```sh
   node index.js unicom --user 17*****0325 --password 3****3 --appid f**********9
   ```

7. 重新运行

   删除 `.cookies` 文件夹,再次运行 node index.js 命令.
