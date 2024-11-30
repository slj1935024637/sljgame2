@echo off

REM 构建
D:\slj_doc\nodejs\npm.cmd run build

REM 进入构建文件夹
cd dist

REM 初始化git仓库
git init

REM 添加所有文件
git add -A

REM 提交更改
git commit -m "deploy"

REM 推送到gh-pages分支
git push -f git@github.com:slj1935024637/sljgame2.git master:gh-pages

REM 返回上级目录
cd ..
