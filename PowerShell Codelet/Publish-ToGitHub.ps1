Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$colors = @{
    Background = [System.Drawing.Color]::FromArgb(245, 247, 248)
    Card       = [System.Drawing.Color]::White
    Ink        = [System.Drawing.Color]::FromArgb(23, 32, 37)
    Muted      = [System.Drawing.Color]::FromArgb(94, 107, 114)
    Line       = [System.Drawing.Color]::FromArgb(207, 216, 220)
    Accent     = [System.Drawing.Color]::FromArgb(23, 107, 91)
    AccentDark = [System.Drawing.Color]::FromArgb(13, 76, 65)
}

$font = New-Object System.Drawing.Font("Segoe UI", 9)
$fontBold = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$fontTitle = New-Object System.Drawing.Font("Segoe UI", 18, [System.Drawing.FontStyle]::Bold)
$fontSection = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)

function New-Label {
    param(
        [string]$Text,
        [int]$X,
        [int]$Y,
        [int]$Width = 160,
        [int]$Height = 22,
        [bool]$Bold = $false
    )

    $label = New-Object System.Windows.Forms.Label
    $label.Text = $Text
    $label.Location = New-Object System.Drawing.Point($X, $Y)
    $label.Size = New-Object System.Drawing.Size($Width, $Height)
    $label.ForeColor = $colors.Muted
    $label.Font = if ($Bold) { $fontBold } else { $font }
    $label
}

function New-TextBox {
    param(
        [int]$X,
        [int]$Y,
        [int]$Width = 430,
        [string]$Text = ""
    )

    $box = New-Object System.Windows.Forms.TextBox
    $box.Location = New-Object System.Drawing.Point($X, $Y)
    $box.Size = New-Object System.Drawing.Size($Width, 26)
    $box.Text = $Text
    $box.Font = $font
    $box.BorderStyle = "FixedSingle"
    $box.BackColor = [System.Drawing.Color]::FromArgb(251, 252, 252)
    $box.ForeColor = $colors.Ink
    $box
}

function New-Button {
    param(
        [string]$Text,
        [int]$X,
        [int]$Y,
        [int]$Width = 120,
        [int]$Height = 34,
        [bool]$Primary = $false
    )

    $button = New-Object System.Windows.Forms.Button
    $button.Text = $Text
    $button.Location = New-Object System.Drawing.Point($X, $Y)
    $button.Size = New-Object System.Drawing.Size($Width, $Height)
    $button.FlatStyle = "Flat"
    $button.Font = $fontBold
    $button.FlatAppearance.BorderColor = if ($Primary) { $colors.Accent } else { $colors.Line }
    $button.BackColor = if ($Primary) { $colors.Accent } else { $colors.Card }
    $button.ForeColor = if ($Primary) { [System.Drawing.Color]::White } else { $colors.Ink }
    $button
}

function New-Card {
    param([int]$X, [int]$Y, [int]$Width, [int]$Height)
    $panel = New-Object System.Windows.Forms.Panel
    $panel.Location = New-Object System.Drawing.Point($X, $Y)
    $panel.Size = New-Object System.Drawing.Size($Width, $Height)
    $panel.BackColor = $colors.Card
    $panel.BorderStyle = "FixedSingle"
    $panel
}

function Join-Arguments {
    param([string[]]$Arguments)

    ($Arguments | ForEach-Object {
        if ($_ -match '[\s"]') {
            '"' + ($_ -replace '"', '\"') + '"'
        } else {
            $_
        }
    }) -join " "
}

function Invoke-External {
    param(
        [string]$FileName,
        [string[]]$Arguments,
        [string]$WorkingDirectory
    )

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = New-Object System.Diagnostics.ProcessStartInfo
    $process.StartInfo.FileName = $FileName
    $process.StartInfo.WorkingDirectory = $WorkingDirectory
    $process.StartInfo.Arguments = Join-Arguments $Arguments
    $process.StartInfo.UseShellExecute = $false
    $process.StartInfo.RedirectStandardOutput = $true
    $process.StartInfo.RedirectStandardError = $true
    $process.StartInfo.CreateNoWindow = $true

    [void]$process.Start()
    $stdout = $process.StandardOutput.ReadToEnd()
    $stderr = $process.StandardError.ReadToEnd()
    $process.WaitForExit()

    [pscustomobject]@{
        ExitCode = $process.ExitCode
        Output   = ($stdout + $stderr).Trim()
    }
}

function Test-Command {
    param([string]$Name)
    $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-ValidatedProjectPath {
    $projectPath = $projectBox.Text.Trim()
    if (-not (Test-Path $projectPath)) { throw "Project folder does not exist." }
    if ((Split-Path $projectPath -Leaf) -eq ".git") {
        throw "Choose the main project folder, not the hidden .git folder. Use: C:\Users\Preston W. Robbins\Documents\PNG to SVG Converter"
    }
    if (-not (Test-Command "git")) { throw "Git is not installed or is not available in PATH." }
    $projectPath
}

function Get-ServerPort {
    $portText = $serverPortBox.Text.Trim()
    if ([string]::IsNullOrWhiteSpace($portText)) { return 4173 }
    $port = 0
    if (-not [int]::TryParse($portText, [ref]$port) -or $port -lt 1 -or $port -gt 65535) {
        throw "Enter a valid server port between 1 and 65535."
    }
    $port
}

function Get-ServerProcesses {
    param([int]$Port)

    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if (-not $connections) { return @() }

    $processes = @()
    foreach ($processId in ($connections | Select-Object -ExpandProperty OwningProcess -Unique)) {
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process) { $processes += $process }
    }
    $processes
}

function Update-ServerStatus {
    try {
        $port = Get-ServerPort
        $processes = Get-ServerProcesses $port
        if ($processes.Count -gt 0) {
            $serverStateLabel.Text = "Running on port $port"
            $serverStateLabel.ForeColor = $colors.Accent
            $serverProcessLabel.Text = "Process: " + (($processes | ForEach-Object { "$($_.ProcessName) #$($_.Id)" }) -join ", ")
        } else {
            $serverStateLabel.Text = "Stopped"
            $serverStateLabel.ForeColor = $colors.Muted
            $serverProcessLabel.Text = "Process: none"
        }
    } catch {
        $serverStateLabel.Text = "Status unavailable"
        $serverStateLabel.ForeColor = $colors.Muted
        $serverProcessLabel.Text = $_.Exception.Message
    }
}

function Stop-LocalServer {
    try {
        $port = Get-ServerPort
        $processes = Get-ServerProcesses $port
        if ($processes.Count -eq 0) {
            Write-Log "Local server is already stopped."
            Update-ServerStatus
            return
        }

        foreach ($process in $processes) {
            Stop-Process -Id $process.Id -Force -ErrorAction Stop
        }
        Start-Sleep -Milliseconds 500
        Write-Log "Stopped local server on port $port."
        Update-ServerStatus
    } catch {
        Write-Log "Stop server failed."
        [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, "Stop server failed")
    }
}

function Start-LocalServer {
    try {
        $projectPath = Get-ValidatedProjectPath
        $port = Get-ServerPort
        $serverFile = Join-Path $projectPath "server.js"
        if (-not (Test-Path $serverFile)) { throw "server.js was not found in the selected project folder." }
        if (-not (Test-Command "node")) { throw "Node.js is not installed or is not available in PATH." }

        $running = Get-ServerProcesses $port
        if ($running.Count -gt 0) {
            Write-Log "Local server is already running on port $port."
            Update-ServerStatus
            return
        }

        $startInfo = New-Object System.Diagnostics.ProcessStartInfo
        $startInfo.FileName = "node"
        $startInfo.Arguments = "server.js"
        $startInfo.WorkingDirectory = $projectPath
        $startInfo.UseShellExecute = $false
        $startInfo.CreateNoWindow = $true
        $startInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
        $startInfo.EnvironmentVariables["PORT"] = [string]$port
        if (-not $startInfo.EnvironmentVariables.ContainsKey("HOST")) {
            $startInfo.EnvironmentVariables["HOST"] = "0.0.0.0"
        }

        $process = New-Object System.Diagnostics.Process
        $process.StartInfo = $startInfo
        [void]$process.Start()
        Start-Sleep -Seconds 2

        $running = Get-ServerProcesses $port
        if ($running.Count -eq 0) { throw "The server did not start. Check your .env file and server.js." }

        Write-Log "Started local server on port $port."
        Update-ServerStatus
    } catch {
        Write-Log "Start server failed."
        [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, "Start server failed")
    }
}

function Restart-LocalServer {
    Stop-LocalServer
    Start-LocalServer
}

function Open-LocalServer {
    try {
        $port = Get-ServerPort
        Start-Process "http://127.0.0.1:$port/"
        Write-Log "Opened local app in browser."
    } catch {
        Write-Log "Open browser failed."
        [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, "Open browser failed")
    }
}

function Ensure-GitRepository {
    param([string]$ProjectPath)

    if (-not (Test-Path (Join-Path $ProjectPath ".git"))) {
        $result = Invoke-External "git" @("init") $ProjectPath
        if ($result.ExitCode -ne 0) { throw $result.Output }
    }

    [void](Invoke-External "git" @("branch", "-M", "main") $ProjectPath)
}

function Ensure-OriginRemote {
    param([string]$ProjectPath)

    $repoName = $repoBox.Text.Trim()
    $owner = $ownerBox.Text.Trim()
    $remoteUrl = $remoteBox.Text.Trim()

    if ([string]::IsNullOrWhiteSpace($remoteUrl)) {
        if ([string]::IsNullOrWhiteSpace($owner)) { throw "Enter either GitHub owner or existing remote URL." }
        if ([string]::IsNullOrWhiteSpace($repoName)) { throw "Repository name is required." }
        $remoteUrl = "https://github.com/$owner/$repoName.git"
    }

    $currentRemote = Invoke-External "git" @("remote", "get-url", "origin") $ProjectPath
    if ($currentRemote.ExitCode -eq 0) {
        $result = Invoke-External "git" @("remote", "set-url", "origin", $remoteUrl) $ProjectPath
    } else {
        $result = Invoke-External "git" @("remote", "add", "origin", $remoteUrl) $ProjectPath
    }
    if ($result.ExitCode -ne 0) { throw $result.Output }

    $remoteUrl
}

function Convert-GitPathToLocalPath {
    param(
        [string]$ProjectPath,
        [string]$GitPath
    )

    $parts = $GitPath -split "/"
    $localPath = $ProjectPath
    foreach ($part in $parts) {
        if (-not [string]::IsNullOrWhiteSpace($part)) {
            $localPath = Join-Path $localPath $part
        }
    }
    $localPath
}

function Get-StatusPath {
    param([string]$Line)

    if ($Line.Length -lt 4) { return $null }
    $path = $Line.Substring(3).Trim()
    if ($path -match " -> ") {
        $path = ($path -split " -> ")[-1].Trim()
    }
    $path.Trim('"')
}

function Get-SelectedSyncFiles {
    $files = @()
    foreach ($item in $syncFileList.CheckedItems) {
        $files += [string]$item
    }
    $files
}

function Get-RemoteFileTimestamp {
    param(
        [string]$ProjectPath,
        [string]$GitPath
    )

    $result = Invoke-External "git" @("log", "-1", "--format=%ct", "origin/main", "--", $GitPath) $ProjectPath
    if ($result.ExitCode -ne 0 -or [string]::IsNullOrWhiteSpace($result.Output)) { return $null }
    [DateTimeOffset]::FromUnixTimeSeconds([int64]$result.Output.Trim()).UtcDateTime
}

function Get-SmartSyncDirection {
    param(
        [string]$ProjectPath,
        [string]$GitPath
    )

    $localPath = Convert-GitPathToLocalPath $ProjectPath $GitPath
    $localExists = Test-Path $localPath
    $remoteTime = Get-RemoteFileTimestamp $ProjectPath $GitPath

    if ($localExists -and $null -eq $remoteTime) { return "Push" }
    if ((-not $localExists) -and $null -ne $remoteTime) { return "Pull" }
    if ((-not $localExists) -and $null -eq $remoteTime) { return "Skip" }

    $localTime = (Get-Item $localPath).LastWriteTimeUtc
    if ($localTime -ge $remoteTime) { "Push" } else { "Pull" }
}

function Refresh-SyncFileList {
    try {
        $syncFileList.Items.Clear()
        $projectPath = Get-ValidatedProjectPath
        Ensure-GitRepository $projectPath
        [void](Ensure-OriginRemote $projectPath)

        Write-Log "Fetching latest file list from GitHub..."
        $fetch = Invoke-External "git" @("fetch", "origin", "main") $projectPath
        if ($fetch.ExitCode -ne 0) { throw $fetch.Output }

        $paths = New-Object System.Collections.Generic.HashSet[string]

        $status = Invoke-External "git" @("status", "--porcelain", "--untracked-files=all") $projectPath
        if ($status.ExitCode -eq 0 -and -not [string]::IsNullOrWhiteSpace($status.Output)) {
            foreach ($line in ($status.Output -split "`r?`n")) {
                $path = Get-StatusPath $line
                if (-not [string]::IsNullOrWhiteSpace($path)) { [void]$paths.Add($path) }
            }
        }

        foreach ($direction in @("HEAD..origin/main", "origin/main..HEAD")) {
            $diff = Invoke-External "git" @("diff", "--name-only", $direction) $projectPath
            if ($diff.ExitCode -eq 0 -and -not [string]::IsNullOrWhiteSpace($diff.Output)) {
                foreach ($path in ($diff.Output -split "`r?`n")) {
                    if (-not [string]::IsNullOrWhiteSpace($path)) { [void]$paths.Add($path.Trim()) }
                }
            }
        }

        $sortedPaths = @($paths) | Sort-Object
        foreach ($path in $sortedPaths) {
            [void]$syncFileList.Items.Add($path, $true)
        }

        if ($syncFileList.Items.Count -eq 0) {
            Write-Log "No file differences found between local project and GitHub."
        } else {
            Write-Log "Found $($syncFileList.Items.Count) file(s) available for sync."
        }
    } catch {
        Write-Log "Refresh failed."
        [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, "Refresh failed")
    }
}

function Sync-SelectedFiles {
    try {
        $syncButton.Enabled = $false
        $refreshFilesButton.Enabled = $false

        $projectPath = Get-ValidatedProjectPath
        Ensure-GitRepository $projectPath
        [void](Ensure-OriginRemote $projectPath)

        $selectedFiles = Get-SelectedSyncFiles
        if ($selectedFiles.Count -eq 0) { throw "Select at least one file to sync." }

        Write-Log "Fetching latest from GitHub..."
        $fetch = Invoke-External "git" @("fetch", "origin", "main") $projectPath
        if ($fetch.ExitCode -ne 0) { throw $fetch.Output }

        $filesToPush = @()
        $filesToPull = @()

        foreach ($file in $selectedFiles) {
            if ($overrideNewestCheck.Checked -and $forcePullRadio.Checked) {
                $filesToPull += $file
            } elseif ($overrideNewestCheck.Checked -and $forcePushRadio.Checked) {
                $filesToPush += $file
            } else {
                $direction = Get-SmartSyncDirection $projectPath $file
                if ($direction -eq "Push") { $filesToPush += $file }
                if ($direction -eq "Pull") { $filesToPull += $file }
            }
        }

        if ($filesToPull.Count -gt 0) {
            $confirmPull = [System.Windows.Forms.MessageBox]::Show(
                "This will replace $($filesToPull.Count) selected local file(s) with the GitHub copy. Continue?",
                "Confirm pull from GitHub",
                [System.Windows.Forms.MessageBoxButtons]::YesNo,
                [System.Windows.Forms.MessageBoxIcon]::Warning
            )
            if ($confirmPull -ne [System.Windows.Forms.DialogResult]::Yes) {
                Write-Log "Sync canceled."
                return
            }
        }

        if ($filesToPull.Count -gt 0) {
            Write-Log "Pulling $($filesToPull.Count) selected file(s) from GitHub..."
            $args = @("checkout", "origin/main", "--") + $filesToPull
            $pullResult = Invoke-External "git" $args $projectPath
            if ($pullResult.ExitCode -ne 0) { throw $pullResult.Output }
        }

        if ($filesToPush.Count -gt 0) {
            $commitMessage = $commitBox.Text.Trim()
            if ([string]::IsNullOrWhiteSpace($commitMessage)) { throw "Commit message is required when pushing files." }

            Write-Log "Staging $($filesToPush.Count) selected file(s)..."
            $addArgs = @("add", "--") + $filesToPush
            $addResult = Invoke-External "git" $addArgs $projectPath
            if ($addResult.ExitCode -ne 0) { throw $addResult.Output }

            Write-Log "Creating sync commit..."
            $commitResult = Invoke-External "git" @("commit", "-m", $commitMessage) $projectPath
            if ($commitResult.ExitCode -ne 0) {
                if ($commitResult.Output -match "nothing to commit|no changes added|working tree clean") {
                    Write-Log "No selected file changes to commit. Continuing..."
                } else {
                    throw $commitResult.Output
                }
            }

            Write-Log "Pushing selected file changes to GitHub..."
            $pushResult = Invoke-External "git" @("push", "-u", "origin", "main") $projectPath
            if ($pushResult.ExitCode -ne 0) { throw $pushResult.Output }
        }

        if ($filesToPush.Count -eq 0 -and $filesToPull.Count -eq 0) {
            Write-Log "Selected files are already in sync."
        } else {
            Write-Log "Sync complete. Pushed $($filesToPush.Count), pulled $($filesToPull.Count)."
        }

        Refresh-SyncFileList
    } catch {
        Write-Log "Sync failed."
        [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, "Sync failed")
    } finally {
        $syncButton.Enabled = $true
        $refreshFilesButton.Enabled = $true
    }
}

function Show-HelpDialog {
    $helpForm = New-Object System.Windows.Forms.Form
    $helpForm.Text = "Project Tools Help"
    $helpForm.Size = New-Object System.Drawing.Size(720, 620)
    $helpForm.StartPosition = "CenterParent"
    $helpForm.BackColor = $colors.Background
    $helpForm.Font = $font

    $title = New-Object System.Windows.Forms.Label
    $title.Text = "How to use this form"
    $title.Location = New-Object System.Drawing.Point(22, 18)
    $title.Size = New-Object System.Drawing.Size(540, 34)
    $title.Font = New-Object System.Drawing.Font("Segoe UI", 15, [System.Drawing.FontStyle]::Bold)
    $title.ForeColor = $colors.Ink

    $helpText = New-Object System.Windows.Forms.RichTextBox
    $helpText.Location = New-Object System.Drawing.Point(22, 62)
    $helpText.Size = New-Object System.Drawing.Size(660, 450)
    $helpText.ScrollBars = "Vertical"
    $helpText.ReadOnly = $true
    $helpText.BorderStyle = "FixedSingle"
    $helpText.BackColor = $colors.Card
    $helpText.ForeColor = $colors.Ink
    $helpText.Font = $font

    $addHelpLine = {
        param(
            [string]$Text,
            [System.Drawing.Font]$LineFont = $font,
            [System.Drawing.Color]$Color = $colors.Ink,
            [int]$BottomSpace = 6
        )

        $helpText.SelectionFont = $LineFont
        $helpText.SelectionColor = $Color
        $helpText.AppendText($Text)
        $helpText.AppendText("`r`n")
        if ($BottomSpace -gt 0) {
            $helpText.AppendText("`r`n")
        }
    }

    & $addHelpLine "Quick Start" $fontSection $colors.Accent 4
    & $addHelpLine "1. Choose the project folder you want to publish.`r`n2. Enter the GitHub repository name.`r`n3. Enter your GitHub username or organization.`r`n4. Enter a commit message.`r`n5. Choose whether to publish to an existing repo or create a new repo.`r`n6. Click Publish to GitHub." $font $colors.Ink 10

    & $addHelpLine "Required Fields" $fontSection $colors.Accent 4
    & $addHelpLine "Project folder" $fontBold $colors.Ink 0
    & $addHelpLine "The local folder that contains your app or project files. Choose the main project folder, not the hidden .git folder." $font $colors.Muted 6
    & $addHelpLine "Repository name" $fontBold $colors.Ink 0
    & $addHelpLine "The GitHub repository name, such as PNG_To_SVG_Converter or My_New_App. Avoid spaces. Use dashes, underscores, letters, and numbers." $font $colors.Muted 6
    & $addHelpLine "Commit message" $fontBold $colors.Ink 0
    & $addHelpLine "A short note describing what changed. Example: Update converter UI or Add photo line art mode." $font $colors.Muted 10

    & $addHelpLine "Usually Required" $fontSection $colors.Accent 4
    & $addHelpLine "GitHub owner" $fontBold $colors.Ink 0
    & $addHelpLine "Usually this is your GitHub username. It can also be an organization name. This is required unless you type a full Existing remote URL." $font $colors.Muted 10

    & $addHelpLine "Optional Fields" $fontSection $colors.Accent 4
    & $addHelpLine "Existing remote URL" $fontBold $colors.Ink 0
    & $addHelpLine "Use this when the GitHub repository already exists and you want to push to it directly." $font $colors.Muted 0
    & $addHelpLine "Example: https://github.com/guido9800/PNG_To_SVG_Converter.git" $font $colors.Muted 10

    & $addHelpLine "Repository Creation" $fontSection $colors.Accent 4
    & $addHelpLine "Create new GitHub repository" $fontBold $colors.Ink 0
    & $addHelpLine "Check this if you want the form to create a new GitHub repo for you. This requires GitHub CLI (gh) to be installed and logged in." $font $colors.Muted 6
    & $addHelpLine "Public / Private" $fontBold $colors.Ink 0
    & $addHelpLine "Only used when creating a new GitHub repository. Public means anyone can view it. Private means only you and invited collaborators can view it." $font $colors.Muted 10

    & $addHelpLine "Sync Selected Files" $fontSection $colors.Accent 4
    & $addHelpLine "Refresh files" $fontBold $colors.Ink 0
    & $addHelpLine "Checks GitHub and your local folder, then lists files that are different or not yet tracked." $font $colors.Muted 6
    & $addHelpLine "Newest wins" $fontBold $colors.Ink 0
    & $addHelpLine "Compares your local file modified time with the latest GitHub commit time for that file. The newer copy is used." $font $colors.Muted 6
    & $addHelpLine "Override newest" $fontBold $colors.Ink 0
    & $addHelpLine "Lets you force the selected files to push up to GitHub or pull down from GitHub, even if that copy is older. Use this carefully." $font $colors.Muted 6
    & $addHelpLine "File checklist" $fontBold $colors.Ink 0
    & $addHelpLine "Only checked files are synced. Uncheck files you want to leave alone." $font $colors.Muted 10

    & $addHelpLine "Local App Server" $fontSection $colors.Accent 4
    & $addHelpLine "Port" $fontBold $colors.Ink 0
    & $addHelpLine "The local web server port. This project normally uses 4173. The app opens at http://127.0.0.1:4173/." $font $colors.Muted 6
    & $addHelpLine "Start" $fontBold $colors.Ink 0
    & $addHelpLine "Starts the local Node server from the selected project folder. Use this when the app is not running." $font $colors.Muted 6
    & $addHelpLine "Restart" $fontBold $colors.Ink 0
    & $addHelpLine "Stops anything currently listening on the selected port, then starts server.js again. Use this after changing .env, server.js, or backend settings." $font $colors.Muted 6
    & $addHelpLine "Stop" $fontBold $colors.Ink 0
    & $addHelpLine "Stops the local server on the selected port. This frees the port if PowerShell says address already in use." $font $colors.Muted 6
    & $addHelpLine "Open App" $fontBold $colors.Ink 0
    & $addHelpLine "Opens the local app in your browser. Use the local URL for AI features before the backend is hosted." $font $colors.Muted 10

    & $addHelpLine "Requirements" $fontSection $colors.Accent 4
    & $addHelpLine "Git must be installed and available in PowerShell." $font $colors.Ink 4
    & $addHelpLine "Node.js must be installed for the local server controls." $font $colors.Ink 4
    & $addHelpLine "GitHub CLI is only needed if you want the form to create new repositories. To set it up, open PowerShell and run:" $font $colors.Ink 0
    & $addHelpLine "gh auth login" $fontBold $colors.AccentDark 6
    & $addHelpLine "If GitHub CLI is not installed, you can still publish to an existing GitHub repo by entering the owner and repository name or the full remote URL." $font $colors.Muted 0
    $helpText.Select(0, 0)

    $closeButton = New-Button "Close" 562 526 120 34 $true
    $closeButton.Add_Click({ $helpForm.Close() })

    $helpForm.Controls.AddRange(@($title, $helpText, $closeButton))
    [void]$helpForm.ShowDialog()
}

$form = New-Object System.Windows.Forms.Form
$form.Text = "Project Publisher and Server Tools"
$form.Size = New-Object System.Drawing.Size(830, 1040)
$form.StartPosition = "CenterScreen"
$form.MinimumSize = New-Object System.Drawing.Size(820, 980)
$form.BackColor = $colors.Background
$form.Font = $font

$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Text = "Project Publisher and Server Tools"
$titleLabel.Location = New-Object System.Drawing.Point(24, 20)
$titleLabel.Size = New-Object System.Drawing.Size(460, 40)
$titleLabel.Font = $fontTitle
$titleLabel.ForeColor = $colors.Ink

$subtitleLabel = New-Object System.Windows.Forms.Label
$subtitleLabel.Text = "Commit changes, sync GitHub files, and restart the local web app server."
$subtitleLabel.Location = New-Object System.Drawing.Point(27, 60)
$subtitleLabel.Size = New-Object System.Drawing.Size(560, 24)
$subtitleLabel.Font = $font
$subtitleLabel.ForeColor = $colors.Muted

$helpButton = New-Button "Help" 690 28 84 32 $false

$projectCard = New-Card 24 102 750 140
$projectHeader = New-Label "Project" 18 14 180 24 $true
$projectHeader.ForeColor = $colors.Ink
$projectLabel = New-Label "Project folder *" 18 52 135
$projectBox = New-TextBox 160 50 460 (Get-Location).Path
$browseButton = New-Button "Browse" 632 48 88 30 $false
$projectHint = New-Label "Choose the local folder that contains the files you want to publish." 160 83 540 22
$projectCard.Controls.AddRange(@($projectHeader, $projectLabel, $projectBox, $browseButton, $projectHint))

$repoCard = New-Card 24 258 750 214
$repoHeader = New-Label "GitHub Repository" 18 14 220 24 $true
$repoHeader.ForeColor = $colors.Ink
$repoLabel = New-Label "Repository name *" 18 52 135
$repoBox = New-TextBox 160 50 245 "PNG_To_SVG_Converter"
$ownerLabel = New-Label "GitHub owner" 430 52 110
$ownerBox = New-TextBox 542 50 178 "guido9800"
$commitLabel = New-Label "Commit message *" 18 92 135
$commitBox = New-TextBox 160 90 560 "Update project"
$remoteLabel = New-Label "Existing remote URL" 18 132 135
$remoteBox = New-TextBox 160 130 560 ""
$remoteHint = New-Label "Optional. Leave blank to build the URL from owner and repository name." 160 163 540 22
$repoCard.Controls.AddRange(@($repoHeader, $repoLabel, $repoBox, $ownerLabel, $ownerBox, $commitLabel, $commitBox, $remoteLabel, $remoteBox, $remoteHint))

$optionsCard = New-Card 24 488 750 82
$optionsHeader = New-Label "Options" 18 12 160 24 $true
$optionsHeader.ForeColor = $colors.Ink
$createRepoCheck = New-Object System.Windows.Forms.CheckBox
$createRepoCheck.Text = "Create new GitHub repository if needed"
$createRepoCheck.Location = New-Object System.Drawing.Point(18, 42)
$createRepoCheck.Size = New-Object System.Drawing.Size(270, 24)
$createRepoCheck.Font = $font
$createRepoCheck.ForeColor = $colors.Ink
$createRepoCheck.BackColor = $colors.Card
$publicRadio = New-Object System.Windows.Forms.RadioButton
$publicRadio.Text = "Public"
$publicRadio.Location = New-Object System.Drawing.Point(300, 42)
$publicRadio.Size = New-Object System.Drawing.Size(70, 24)
$publicRadio.Checked = $true
$publicRadio.BackColor = $colors.Card
$privateRadio = New-Object System.Windows.Forms.RadioButton
$privateRadio.Text = "Private"
$privateRadio.Location = New-Object System.Drawing.Point(374, 42)
$privateRadio.Size = New-Object System.Drawing.Size(90, 24)
$privateRadio.BackColor = $colors.Card
$ghHint = New-Label "Repo creation requires GitHub CLI: gh auth login" 462 44 270 22
$optionsCard.Controls.AddRange(@($optionsHeader, $createRepoCheck, $publicRadio, $privateRadio, $ghHint))

$syncCard = New-Card 24 586 750 190
$syncHeader = New-Label "Sync Selected Files" 18 12 180 24 $true
$syncHeader.ForeColor = $colors.Ink
$syncHint = New-Label "Refresh the list, select files, then sync by newest file or force push/pull with override." 18 36 700 22

$refreshFilesButton = New-Button "Refresh Files" 18 66 126 30 $false
$syncButton = New-Button "Sync Selected" 154 66 132 30 $true

$newestRadio = New-Object System.Windows.Forms.RadioButton
$newestRadio.Text = "Newest wins"
$newestRadio.Location = New-Object System.Drawing.Point(306, 68)
$newestRadio.Size = New-Object System.Drawing.Size(110, 24)
$newestRadio.Checked = $true
$newestRadio.BackColor = $colors.Card
$newestRadio.ForeColor = $colors.Ink

$forcePushRadio = New-Object System.Windows.Forms.RadioButton
$forcePushRadio.Text = "Force push"
$forcePushRadio.Location = New-Object System.Drawing.Point(420, 68)
$forcePushRadio.Size = New-Object System.Drawing.Size(100, 24)
$forcePushRadio.BackColor = $colors.Card
$forcePushRadio.ForeColor = $colors.Ink

$forcePullRadio = New-Object System.Windows.Forms.RadioButton
$forcePullRadio.Text = "Force pull"
$forcePullRadio.Location = New-Object System.Drawing.Point(524, 68)
$forcePullRadio.Size = New-Object System.Drawing.Size(95, 24)
$forcePullRadio.BackColor = $colors.Card
$forcePullRadio.ForeColor = $colors.Ink

$overrideNewestCheck = New-Object System.Windows.Forms.CheckBox
$overrideNewestCheck.Text = "Override newest"
$overrideNewestCheck.Location = New-Object System.Drawing.Point(624, 68)
$overrideNewestCheck.Size = New-Object System.Drawing.Size(120, 24)
$overrideNewestCheck.Font = $font
$overrideNewestCheck.ForeColor = $colors.Ink
$overrideNewestCheck.BackColor = $colors.Card

$syncFileList = New-Object System.Windows.Forms.CheckedListBox
$syncFileList.Location = New-Object System.Drawing.Point(18, 106)
$syncFileList.Size = New-Object System.Drawing.Size(702, 68)
$syncFileList.CheckOnClick = $true
$syncFileList.BorderStyle = "FixedSingle"
$syncFileList.BackColor = [System.Drawing.Color]::FromArgb(251, 252, 252)
$syncFileList.ForeColor = $colors.Ink
$syncFileList.Font = $font

$syncCard.Controls.AddRange(@(
    $syncHeader, $syncHint, $refreshFilesButton, $syncButton,
    $newestRadio, $forcePushRadio, $forcePullRadio, $overrideNewestCheck,
    $syncFileList
))

$serverCard = New-Card 24 792 750 112
$serverHeader = New-Label "Local App Server" 18 12 180 24 $true
$serverHeader.ForeColor = $colors.Ink
$serverHint = New-Label "Start, stop, or restart the local Node server used by the AI-enabled app." 18 36 700 22
$serverPortLabel = New-Label "Port" 18 70 40 22
$serverPortBox = New-TextBox 62 68 72 "4173"
$startServerButton = New-Button "Start" 148 66 86 30 $false
$restartServerButton = New-Button "Restart" 244 66 96 30 $true
$stopServerButton = New-Button "Stop" 350 66 86 30 $false
$openServerButton = New-Button "Open App" 446 66 96 30 $false
$serverStateLabel = New-Label "Stopped" 556 68 170 22 $true
$serverProcessLabel = New-Label "Process: none" 556 88 170 20
$serverCard.Controls.AddRange(@(
    $serverHeader, $serverHint, $serverPortLabel, $serverPortBox,
    $startServerButton, $restartServerButton, $stopServerButton, $openServerButton,
    $serverStateLabel, $serverProcessLabel
))

$publishButton = New-Button "Publish to GitHub" 24 922 170 38 $true
$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = "Ready"
$statusLabel.Location = New-Object System.Drawing.Point(210, 930)
$statusLabel.Size = New-Object System.Drawing.Size(560, 24)
$statusLabel.ForeColor = $colors.Muted
$statusLabel.Font = $font

$logBox = New-Object System.Windows.Forms.TextBox
$logBox.Location = New-Object System.Drawing.Point(24, 972)
$logBox.Size = New-Object System.Drawing.Size(750, 26)
$logBox.Multiline = $false
$logBox.ReadOnly = $true
$logBox.BorderStyle = "FixedSingle"
$logBox.BackColor = $colors.Card
$logBox.ForeColor = $colors.Muted
$logBox.Font = $font

function Write-Log {
    param([string]$Message)
    $statusLabel.Text = $Message
    $logBox.Text = $Message
    [System.Windows.Forms.Application]::DoEvents()
}

$helpButton.Add_Click({ Show-HelpDialog })

$browseButton.Add_Click({
    $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $dialog.Description = "Choose the project folder to publish"
    $dialog.SelectedPath = $projectBox.Text
    if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        $projectBox.Text = $dialog.SelectedPath
        if ([string]::IsNullOrWhiteSpace($repoBox.Text)) {
            $repoBox.Text = Split-Path $dialog.SelectedPath -Leaf
        }
    }
})

$refreshFilesButton.Add_Click({ Refresh-SyncFileList })
$syncButton.Add_Click({ Sync-SelectedFiles })
$startServerButton.Add_Click({ Start-LocalServer })
$restartServerButton.Add_Click({ Restart-LocalServer })
$stopServerButton.Add_Click({ Stop-LocalServer })
$openServerButton.Add_Click({ Open-LocalServer })
$serverPortBox.Add_TextChanged({ Update-ServerStatus })
$newestRadio.Add_CheckedChanged({
    if ($newestRadio.Checked) { $overrideNewestCheck.Checked = $false }
})
$forcePushRadio.Add_CheckedChanged({
    if ($forcePushRadio.Checked) { $overrideNewestCheck.Checked = $true }
})
$forcePullRadio.Add_CheckedChanged({
    if ($forcePullRadio.Checked) { $overrideNewestCheck.Checked = $true }
})

$publishButton.Add_Click({
    try {
        $publishButton.Enabled = $false
        Write-Log "Starting publish..."

        $projectPath = Get-ValidatedProjectPath
        $repoName = $repoBox.Text.Trim()
        $owner = $ownerBox.Text.Trim()
        $commitMessage = $commitBox.Text.Trim()
        $remoteUrl = $remoteBox.Text.Trim()

        if ([string]::IsNullOrWhiteSpace($repoName)) { throw "Repository name is required." }
        if ([string]::IsNullOrWhiteSpace($commitMessage)) { throw "Commit message is required." }

        Write-Log "Checking Git repository..."
        Ensure-GitRepository $projectPath

        Write-Log "Staging files..."
        $result = Invoke-External "git" @("add", "-A") $projectPath
        if ($result.ExitCode -ne 0) { throw $result.Output }

        Write-Log "Creating commit..."
        $result = Invoke-External "git" @("commit", "-m", $commitMessage) $projectPath
        if ($result.ExitCode -ne 0) {
            if ($result.Output -match "nothing to commit|no changes added|working tree clean") {
                Write-Log "No new changes to commit. Continuing to push..."
            } else {
                throw $result.Output
            }
        }

        if ($createRepoCheck.Checked) {
            if (-not (Test-Command "gh")) {
                throw "GitHub CLI was not found. Finish installing gh, restart PowerShell, then run gh auth login."
            }
            if ([string]::IsNullOrWhiteSpace($owner)) { throw "GitHub owner is required to create a repository." }

            $visibility = if ($privateRadio.Checked) { "--private" } else { "--public" }
            Write-Log "Creating GitHub repository $owner/$repoName..."
            $result = Invoke-External "gh" @("repo", "create", "$owner/$repoName", $visibility, "--source", $projectPath, "--remote", "origin", "--push") $projectPath
            if ($result.ExitCode -ne 0) { throw $result.Output }
        } else {
            if ([string]::IsNullOrWhiteSpace($remoteUrl)) {
                if ([string]::IsNullOrWhiteSpace($owner)) { throw "Enter either GitHub owner or existing remote URL." }
                $remoteUrl = "https://github.com/$owner/$repoName.git"
            }

            Write-Log "Configuring remote..."
            [void](Ensure-OriginRemote $projectPath)

            Write-Log "Pushing to GitHub..."
            $result = Invoke-External "git" @("push", "-u", "origin", "main") $projectPath
            if ($result.ExitCode -ne 0) { throw $result.Output }
        }

        Write-Log "Published successfully."
        [System.Windows.Forms.MessageBox]::Show("Project published successfully.", "GitHub Publisher")
    } catch {
        Write-Log "Publish failed."
        [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, "Publish failed")
    } finally {
        $publishButton.Enabled = $true
    }
})

$form.Controls.AddRange(@(
    $titleLabel, $subtitleLabel, $helpButton,
    $projectCard, $repoCard, $optionsCard, $syncCard,
    $serverCard, $publishButton, $statusLabel, $logBox
))

Update-ServerStatus
[void]$form.ShowDialog()
