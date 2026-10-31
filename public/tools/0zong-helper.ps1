<#
  0zong helper (Windows). Tells 0zong's room which kind of thing you are doing on this PC.

  Every 30 seconds it looks at the process name of the foreground window, finds it in the list below, and sends only
  { category, app } to your site. It never reads window titles, documents, keystrokes, or the screen.
  Programs that are not in the list (browsers included) are not sent. After 5 minutes without input nothing is sent.

  Run (the owner screen on your site shows this line with your token filled in):
    powershell -ExecutionPolicy Bypass -File "$HOME\Downloads\0zong-helper.ps1" -Url "http://localhost:3000" -Token "<token>"
  Stop: close the window or press Ctrl+C.

  Categories: code, game, design, study, video, rest. Edit $Apps below to add your own programs
  (key = process name in lower case, as Task Manager's "Details" tab shows it, without ".exe").
#>
param(
  [string]$Url = "http://localhost:3000",
  [string]$Token = $env:ZONG_HELPER_TOKEN,
  [int]$Every = 30,
  [int]$IdleMinutes = 5
)

$Apps = @{
  # code
  "code" = @("code", "VS Code"); "code - insiders" = @("code", "VS Code Insiders"); "cursor" = @("code", "Cursor")
  "devenv" = @("code", "Visual Studio"); "idea64" = @("code", "IntelliJ IDEA"); "pycharm64" = @("code", "PyCharm")
  "webstorm64" = @("code", "WebStorm"); "clion64" = @("code", "CLion"); "rider64" = @("code", "Rider")
  "sublime_text" = @("code", "Sublime Text"); "notepad++" = @("code", "Notepad++"); "windowsterminal" = @("code", "Terminal")
  # study (security study included)
  "notion" = @("study", "Notion"); "obsidian" = @("study", "Obsidian"); "anki" = @("study", "Anki")
  "acrobat" = @("study", "Acrobat"); "acrord32" = @("study", "Acrobat Reader"); "sumatrapdf" = @("study", "SumatraPDF")
  "wireshark" = @("study", "Wireshark"); "burpsuite" = @("study", "Burp Suite"); "burpsuitepro" = @("study", "Burp Suite")
  "ida64" = @("study", "IDA"); "x64dbg" = @("study", "x64dbg"); "vmware" = @("study", "VMware"); "virtualboxvm" = @("study", "VirtualBox")
  # design and drawing
  "photoshop" = @("design", "Photoshop"); "illustrator" = @("design", "Illustrator"); "figma" = @("design", "Figma")
  "clipstudiopaint" = @("design", "CLIP STUDIO PAINT"); "krita" = @("design", "Krita"); "blender" = @("design", "Blender")
  "aseprite" = @("design", "Aseprite"); "mspaint" = @("design", "Paint")
  # video
  "vlc" = @("video", "VLC"); "potplayermini64" = @("video", "PotPlayer"); "potplayer" = @("video", "PotPlayer")
  "adobe premiere pro" = @("video", "Premiere Pro"); "afterfx" = @("video", "After Effects"); "resolve" = @("video", "DaVinci Resolve")
  "capcut" = @("video", "CapCut"); "obs64" = @("video", "OBS")
  # rest
  "spotify" = @("rest", "Spotify"); "discord" = @("rest", "Discord"); "kakaotalk" = @("rest", "KakaoTalk")
  # games outside the folders below
  "league of legends" = @("game", "League of Legends"); "valorant-win64-shipping" = @("game", "VALORANT")
}
# Anything running from these folders counts as a game (the app name is the program's own name).
$GameFolders = @("\steamapps\common\", "\Epic Games\", "\Riot Games\")

if (-not $Token) { Write-Host "Token is missing. Make one on your site (owner screen > PC helper) and pass -Token."; exit 1 }
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class ZongWin {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
  [StructLayout(LayoutKind.Sequential)] public struct LASTINPUTINFO { public uint cbSize; public uint dwTime; }
  [DllImport("user32.dll")] static extern bool GetLastInputInfo(ref LASTINPUTINFO info);
  public static uint IdleMs() {
    var info = new LASTINPUTINFO(); info.cbSize = (uint)Marshal.SizeOf(info);
    if (!GetLastInputInfo(ref info)) return 0;
    return (uint)Environment.TickCount - info.dwTime;
  }
}
"@

function Get-Activity {
  if ([ZongWin]::IdleMs() -ge [uint32]($IdleMinutes * 60000)) { return $null }
  $hwnd = [ZongWin]::GetForegroundWindow()
  if ($hwnd -eq [IntPtr]::Zero) { return $null }
  $procId = [uint32]0
  [void][ZongWin]::GetWindowThreadProcessId($hwnd, [ref]$procId)
  $p = Get-Process -Id $procId -ErrorAction SilentlyContinue
  if (-not $p) { return $null }
  $name = $p.ProcessName.ToLower()
  if ($Apps.ContainsKey($name)) { return @{ category = $Apps[$name][0]; app = $Apps[$name][1] } }
  $path = $null
  try { $path = $p.Path } catch { }
  if ($path) { foreach ($f in $GameFolders) { if ($path.IndexOf($f, [StringComparison]::OrdinalIgnoreCase) -ge 0) { return @{ category = "game"; app = $p.ProcessName } } } }
  return $null
}

$endpoint = $Url.TrimEnd("/") + "/api/activity"
$headers = @{ Authorization = "Bearer $Token" }
$last = ""
Write-Host "0zong helper: sending to $endpoint every $Every s. Close this window to stop."
while ($true) {
  $a = Get-Activity
  if ($a) {
    $body = [Text.Encoding]::UTF8.GetBytes(($a | ConvertTo-Json -Compress))
    try {
      Invoke-RestMethod -Method Post -Uri $endpoint -Headers $headers -ContentType "application/json; charset=utf-8" -Body $body -TimeoutSec 10 | Out-Null
      $now = "$($a.category) ($($a.app))"
      if ($now -ne $last) { Write-Host ("{0:HH:mm} {1}" -f (Get-Date), $now); $last = $now }
    } catch {
      $code = $null
      try { $code = [int]$_.Exception.Response.StatusCode } catch { }
      if ($code -eq 401) { Write-Host "The site refused the token (it may have been replaced). Make a new one and start again."; exit 1 }
      Write-Host ("{0:HH:mm} could not reach the site: {1}" -f (Get-Date), $_.Exception.Message)
    }
  } elseif ($last -ne "") { Write-Host ("{0:HH:mm} (not sending)" -f (Get-Date)); $last = "" }
  Start-Sleep -Seconds $Every
}
