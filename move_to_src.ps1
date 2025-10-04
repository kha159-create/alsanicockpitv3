# المجلدات اللي بدنا ننقلها
$folders = "components", "pages", "hooks", "context", "services", "utils"

# إذا مجلد src مش موجود، أنشئه
if (-not (Test-Path "src")) {
    New-Item -ItemType Directory -Path "src" | Out-Null
}

# انقل المجلدات واحد واحد
foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Move-Item $folder -Destination "src/"
        Write-Output "Moved $folder to src/"
    } else {
        Write-Output "Folder not found: $folder"
    }
}
