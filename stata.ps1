#!/usr/bin/env pwsh
# Stata wrapper -- runs a .do file in batch mode
param(
    [Parameter(Position=0, Mandatory=$true)]
    [string]$DoFile,

    [switch]$Quiet,
    [string]$LogFile = "",
    [int]$Timeout = 300
)

$stata = "C:\Program Files\Stata18\StataMP-64.exe"
$doAbs = Resolve-Path $DoFile -ErrorAction Stop

if (-not $LogFile) {
    $LogFile = [System.IO.Path]::ChangeExtension($doAbs, ".log")
}

Write-Host "[Stata] Running: $doAbs"
Write-Host "[Stata] Log: $LogFile"

$proc = Start-Process -FilePath $stata -ArgumentList "/e do `"$doAbs`"" -NoNewWindow -PassThru -RedirectStandardOutput "$LogFile.tmp"

$proc | Wait-Process -Timeout $Timeout
if (-not $proc.HasExited) {
    $proc.Kill()
    Write-Error "[Stata] Timeout after ${Timeout}s, killed"
    exit 1
}

Remove-Item "$LogFile.tmp" -ErrorAction SilentlyContinue

if (Test-Path $LogFile) {
    if (-not $Quiet) {
        Write-Host "`n=== Stata Output ==="
        Get-Content $LogFile
        Write-Host "=== End ==="
    } else {
        Write-Host "[Stata] Done (exit code $($proc.ExitCode))"
    }
    exit $proc.ExitCode
} else {
    Write-Error "[Stata] No log file generated"
    exit 1
}
