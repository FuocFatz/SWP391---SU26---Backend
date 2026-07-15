$env:JAVA_HOME="C:\Users\User\.antigravity-ide\extensions\redhat.java-1.54.0-win32-x64\jre\21.0.10-win32-x86_64"
.\mvnw.cmd clean compile -DskipTests > compile.log 2>&1
$errors = Get-Content compile.log | Select-String "\[ERROR\] .*\.java:\["
if ($errors.Count -eq 0) {
    Write-Host "SUCCESS: 0 errors"
} else {
    Write-Host "ERRORS: $($errors.Count)"
    $errors | Select-Object -First 30
}
