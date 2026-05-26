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

function Show-HelpDialog {
    $helpForm = New-Object System.Windows.Forms.Form
    $helpForm.Text = "GitHub Publisher Help"
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

    & $addHelpLine "Requirements" $fontSection $colors.Accent 4
    & $addHelpLine "Git must be installed and available in PowerShell." $font $colors.Ink 4
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
$form.Text = "Publish Project to GitHub"
$form.Size = New-Object System.Drawing.Size(820, 720)
$form.StartPosition = "CenterScreen"
$form.MinimumSize = New-Object System.Drawing.Size(820, 720)
$form.BackColor = $colors.Background
$form.Font = $font

$titleLabel = New-Object System.Windows.Forms.Label
$titleLabel.Text = "Publish Project to GitHub"
$titleLabel.Location = New-Object System.Drawing.Point(24, 20)
$titleLabel.Size = New-Object System.Drawing.Size(460, 40)
$titleLabel.Font = $fontTitle
$titleLabel.ForeColor = $colors.Ink

$subtitleLabel = New-Object System.Windows.Forms.Label
$subtitleLabel.Text = "Commit local changes, connect a remote, and push your app to GitHub."
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
$createRepoCheck.Size = New-Object System.Drawing.Size(285, 24)
$createRepoCheck.Font = $font
$createRepoCheck.ForeColor = $colors.Ink
$createRepoCheck.BackColor = $colors.Card
$publicRadio = New-Object System.Windows.Forms.RadioButton
$publicRadio.Text = "Public"
$publicRadio.Location = New-Object System.Drawing.Point(330, 42)
$publicRadio.Size = New-Object System.Drawing.Size(80, 24)
$publicRadio.Checked = $true
$publicRadio.BackColor = $colors.Card
$privateRadio = New-Object System.Windows.Forms.RadioButton
$privateRadio.Text = "Private"
$privateRadio.Location = New-Object System.Drawing.Point(420, 42)
$privateRadio.Size = New-Object System.Drawing.Size(90, 24)
$privateRadio.BackColor = $colors.Card
$ghHint = New-Label "Repo creation requires GitHub CLI: gh auth login" 520 44 210 22
$optionsCard.Controls.AddRange(@($optionsHeader, $createRepoCheck, $publicRadio, $privateRadio, $ghHint))

$publishButton = New-Button "Publish to GitHub" 24 590 170 38 $true
$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = "Ready"
$statusLabel.Location = New-Object System.Drawing.Point(210, 598)
$statusLabel.Size = New-Object System.Drawing.Size(560, 24)
$statusLabel.ForeColor = $colors.Muted
$statusLabel.Font = $font

$logBox = New-Object System.Windows.Forms.TextBox
$logBox.Location = New-Object System.Drawing.Point(24, 640)
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

$publishButton.Add_Click({
    try {
        $publishButton.Enabled = $false
        Write-Log "Starting publish..."

        $projectPath = $projectBox.Text.Trim()
        $repoName = $repoBox.Text.Trim()
        $owner = $ownerBox.Text.Trim()
        $commitMessage = $commitBox.Text.Trim()
        $remoteUrl = $remoteBox.Text.Trim()

        if (-not (Test-Path $projectPath)) { throw "Project folder does not exist." }
        if ((Split-Path $projectPath -Leaf) -eq ".git") {
            throw "Choose the main project folder, not the hidden .git folder. Use: C:\Users\Preston W. Robbins\Documents\PNG to SVG Converter"
        }
        if ([string]::IsNullOrWhiteSpace($repoName)) { throw "Repository name is required." }
        if ([string]::IsNullOrWhiteSpace($commitMessage)) { throw "Commit message is required." }
        if (-not (Test-Command "git")) { throw "Git is not installed or is not available in PATH." }

        Write-Log "Checking Git repository..."
        if (-not (Test-Path (Join-Path $projectPath ".git"))) {
            $result = Invoke-External "git" @("init") $projectPath
            if ($result.ExitCode -ne 0) { throw $result.Output }
        }

        [void](Invoke-External "git" @("branch", "-M", "main") $projectPath)

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
            $currentRemote = Invoke-External "git" @("remote", "get-url", "origin") $projectPath
            if ($currentRemote.ExitCode -eq 0) {
                $result = Invoke-External "git" @("remote", "set-url", "origin", $remoteUrl) $projectPath
            } else {
                $result = Invoke-External "git" @("remote", "add", "origin", $remoteUrl) $projectPath
            }
            if ($result.ExitCode -ne 0) { throw $result.Output }

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
    $projectCard, $repoCard, $optionsCard,
    $publishButton, $statusLabel, $logBox
))

[void]$form.ShowDialog()
