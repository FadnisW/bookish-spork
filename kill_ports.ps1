$ports = @(3000, 3001, 5555)
foreach ($port in $ports) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connections) {
            foreach ($conn in $connections) {
                $pidValue = $conn.OwningProcess
                Write-Host "Killing process on port $port (PID: $pidValue)"
                Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {
        Write-Host "No process found on port $port"
    }
}
