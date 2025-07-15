@echo off
echo ========================================
echo    基因序列比对工具启动脚本
echo ========================================
echo.

echo 检查Python环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Python环境，请先安装Python 3.7+
    pause
    exit /b 1
)

echo 检查依赖包...
pip show flask >nul 2>&1
if errorlevel 1 (
    echo 安装依赖包...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo 错误: 依赖包安装失败
        pause
        exit /b 1
    )
)

echo.
echo 启动应用...
echo 应用将在浏览器中自动打开: http://localhost:5000
echo 按 Ctrl+C 停止应用
echo.

python app.py

pause 