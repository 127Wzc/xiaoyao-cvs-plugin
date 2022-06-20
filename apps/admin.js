import { segment } from "oicq";
import fs from "fs";
import lodash from "lodash";
import { createRequire } from "module";
import { exec } from "child_process";
import { Cfg } from "../components/index.js";
import Common from "../components/Common.js";


const require = createRequire(import.meta.url);


export const rule = {
  updateRes: {
    hashMark: true,
    reg: "^#图鉴更新$",
    describe: "【#管理】更新素材",
  },
  updateMiaoPlugin: {
    hashMark: true,
    reg: "^#逍遥插件(强制)?更新",
    describe: "【#管理】图鉴更新",
  },
 
};


const _path = process.cwd();
const resPath = `${_path}/plugins/xiaoyao-cvs-plugin/resources/`;
const plusPath = `${resPath}/xiaoyao-plus/`;

const checkAuth = async function (e) {
  return await e.checkAuth({
    auth: "master",
    replyMsg: `只有主人才能命令喵喵哦~
    (*/ω＼*)`
  });
}
const getStatus = function (rote, def = true) {
  if (Cfg.get(rote, def)) {
    return `<div class="cfg-status" >已开启</div>`;
  } else {
    return `<div class="cfg-status status-off">已关闭</div>`;
  }

}

export async function updateRes(e) {
  if (!await checkAuth(e)) {
    return true;
  }
  let command = "";
  if (fs.existsSync(`${resPath}/res-plus/`)) {
    e.reply("开始尝试更新，请耐心等待~");
    command = `git pull`;
    exec(command, { cwd: `${resPath}/xiaoyao-plus/` }, function (error, stdout, stderr) {
      //console.log(stdout);
      if (/Already up to date/.test(stdout)) {
        e.reply("目前所有图片都已经是最新了~");
        return true;
      }
      let numRet = /(\d*) files changed,/.exec(stdout);
      if (numRet && numRet[1]) {
        e.reply(`报告主人，更新成功，此次更新了${numRet[1]}个图片~`);
        return true;
      }
      if (error) {
        e.reply("更新失败！\nError code: " + error.code + "\n" + error.stack + "\n 请稍后重试。");
      } else {
        e.reply("图片加量包更新成功~");
      }
    });
  } else {
    command = `git clone https://github.com/ctrlcvs/xiaoyao_plus.git "${resPath}/xiaoyao-plus/"`;
    e.reply("开始尝试安装图片加量包，可能会需要一段时间，请耐心等待~\n此链接为github图床,如异常请请求多次");
    exec(command, function (error, stdout, stderr) {
      if (error) {
        e.reply("角色图片加量包安装失败！\nError code: " + error.code + "\n" + error.stack + "\n 请稍后重试。");
      } else {
        e.reply("角色图片加量包安装成功！您后续也可以通过 #图鉴更新 命令来更新图像");
      }
    });
  }
  return true;
}

let timer;

export async function updateMiaoPlugin(e) {
  if (!await checkAuth(e)) {
    return true;
  }
  let isForce = e.msg.includes("强制");
  let command = "git  pull";
  if (isForce) {
    command = "git  checkout . && git  pull";
    e.reply("正在执行强制更新操作，请稍等");
  } else {
    e.reply("正在执行更新操作，请稍等");
  }
  exec(command, { cwd: `${_path}/plugins/xiaoyao-cvs-plugin/` }, function (error, stdout, stderr) {
    //console.log(stdout);
    if (/Already up to date/.test(stdout)) {
      e.reply("目前已经是最新版逍遥插件了~");
      return true;
    }
    if (error) {
      e.reply("逍遥插件更新失败！\nError code: " + error.code + "\n" + error.stack + "\n 请稍后重试。");
      return true;
    }
    e.reply("逍遥插件更新成功，尝试重新启动Yunzai以应用更新...");
    timer && clearTimeout(timer);
    redis.set("xiaoyao:restart-msg", JSON.stringify({
      msg: "重启成功，新版逍遥插件已经生效",
      qq: e.user_id
    }), { EX: 30 });
    timer = setTimeout(function () {
      let command = "npm run restart";
      exec(command, function (error, stdout, stderr) {
        if (error) {
          if (/Yunzai not found/.test(error)) {
            e.reply("自动重启失败，请手动重启以应用新版逍遥插件。请使用 npm run start 命令启动Yunzai-Bot");
          } else {
            e.reply("重启失败！\nError code: " + error.code + "\n" + error.stack + "\n 请稍后重试。");
          }
          return true;
        }
      })
    }, 1000);

  });
  return true;
}