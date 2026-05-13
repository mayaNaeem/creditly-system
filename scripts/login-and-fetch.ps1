$ErrorActionPreference = 'Stop'
Set-Location "$PSScriptRoot/.."
$body = @{ email = 'manager@creditly.demo'; password = 'Creditly123!' } | ConvertTo-Json
$r = Invoke-RestMethod -Uri 'http://localhost:5000/auth/login' -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 10
Write-Host 'TOKEN:' $r.token
$t = $r.token
$headers = @{ Authorization = "Bearer $t" }
try {
  $resp = Invoke-WebRequest -Uri 'http://localhost:4000/accounts' -Method Get -Headers $headers -UseBasicParsing -TimeoutSec 10
  Write-Host 'STATUS:' $resp.StatusCode
  $s = $resp.Content
  if ($s.Length -gt 2000) { $s = $s.Substring(0,2000) }
  Write-Host 'HTML PREVIEW:'
  Write-Host $s
} catch {
  Write-Host 'FETCH ERROR:' $_.Exception.Message
}
