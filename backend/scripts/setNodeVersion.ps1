# Sets v16.16.0 only on current terminal by modifying $env:PATH
# nvm should be installed

$version = "v16.16.0"
if(!(Test-Path "$env:NVM_HOME\$version")) {
    nvm install $version
}

$oldNodejsPath = "C:\Program Files\nodejs"
$env:PATH = ($env:PATH -split ";") -notmatch [regex]::Escape($oldNodejsPath) -join ";"

$newNodeJsPath = "$env:NVM_HOME\$version"
$env:PATH = "$env:PATH;$newNodeJsPath"
