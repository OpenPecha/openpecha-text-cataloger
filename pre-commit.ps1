Write-Host "Checking for console.log..."
$files = git diff --cached --name-only --diff-filter=ACM | Select-String -Pattern "\.js$|\.ts$|\.jsx$|\.tsx$"

$found = $false
foreach ($file in $files) {
    if (Select-String -Path $file -Pattern "console\.log") {
        Write-Host "❌ console.log found in $file"
        $found = $true
    }
}

if ($found) {
    Write-Host "Remove console.log() before committing."
    exit 1
}

Write-Host "✅ No console.log found."
exit 0
