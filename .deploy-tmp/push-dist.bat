@echo off
set KEY=%USERPROFILE%\.ssh\yuyirrr_deploy
set RELEASE=/var/www/yuyirrr/releases/e281d9ec064366f4f68fef469903976e06ce0dbc
echo [1/2] create release dir
ssh -i "%KEY%" -o IdentitiesOnly=yes -o BatchMode=yes deploy@124.221.58.200 "mkdir -p %RELEASE%"
echo MKDIR_EXIT=%ERRORLEVEL%
echo [2/2] upload dist
tar -czf - -C D:\code\yuyirrr\dist . | ssh -i "%KEY%" -o IdentitiesOnly=yes -o BatchMode=yes deploy@124.221.58.200 "tar -xzf - -C %RELEASE%"
echo UPLOAD_EXIT=%ERRORLEVEL%
