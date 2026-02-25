Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File ""C:\Claude_AI\web-fms\fms-web\scripts\launch.ps1""", 0, False
