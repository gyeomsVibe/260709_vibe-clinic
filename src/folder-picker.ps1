# Vibe Clinic - Compile-free modern folder picker
#
# Opens the Windows 10/11 Explorer-style folder-pick dialog (IFileOpenDialog
# with FOS_PICKFOLDERS) WITHOUT any runtime C# compilation, by driving the
# COM interfaces already defined inside System.Windows.Forms via reflection.
# This avoids Add-Type/csc.exe entirely (antivirus/security-policy safe).
#
# Output contract (stdout):
#   SELECTED:<absolute path>   when the user picks a folder
#   (nothing)                  when the user cancels
#   DRYRUN_OK                  with -DryRun (verifies reflection chain, no UI)
#
# Requires -STA (caller must pass:  powershell -NoProfile -STA -File <this>)

param(
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms

$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.CheckFileExists = $false
$dialog.CheckPathExists = $true
$dialog.FileName = 'Select'

$parentType = $dialog.GetType().BaseType
$bf = [System.Reflection.BindingFlags]::Instance -bor [System.Reflection.BindingFlags]::NonPublic

# 1) Read the FOS options computed by the .NET wrapper
$getOptionsManaged = $parentType.GetMethod('GetOptions', $bf)
$currentFOS = $getOptionsManaged.Invoke($dialog, $null)

# 2) Add FOS_PICKFOLDERS (0x20)
$newFOSValue = [int]$currentFOS -bor 0x20
$newFOSEnum = [System.Enum]::ToObject($currentFOS.GetType(), $newFOSValue)

# 3) Create the internal Vista (IFileOpenDialog) COM object
$createVistaDialog = $parentType.GetMethod('CreateVistaDialog', $bf)
$vistaDialog = $createVistaDialog.Invoke($dialog, $null)

# 4) Apply the .NET wrapper's properties, then inject our options on top
$onBefore = $parentType.GetMethod('OnBeforeVistaDialog', $bf)
$onBefore.Invoke($dialog, @($vistaDialog))

$ifdType = $createVistaDialog.ReturnType
$ifdType.GetMethod('SetOptions').Invoke($vistaDialog, @($newFOSEnum))
$ifdType.GetMethod('SetTitle').Invoke($vistaDialog, @('Vibe Clinic 검증 대상 폴더를 선택하세요'))

if ($DryRun) {
  Write-Host 'DRYRUN_OK'
  exit 0
}

# 5) Foreground guarantee: own the dialog with an invisible top-most form so
#    it opens in front instead of behind other windows (Show(IntPtr.Zero)
#    gives the dialog no owner and it may not receive focus).
$owner = New-Object System.Windows.Forms.Form
$owner.TopMost = $true
$owner.ShowInTaskbar = $false
$owner.FormBorderStyle = 'None'
$owner.StartPosition = 'CenterScreen'
$owner.Opacity = 0
$owner.Show()
$owner.Activate()

try {
  $hr = $ifdType.GetMethod('Show').Invoke($vistaDialog, @($owner.Handle))

  if ($hr -eq 0) {
    # 6) Extract the picked folder path (GetResult -> IShellItem.GetDisplayName)
    $getResultMethod = $ifdType.GetMethod('GetResult')
    $shellItemType = $getResultMethod.GetParameters()[0].ParameterType

    $resultArgs = @($null)
    $getResultMethod.Invoke($vistaDialog, $resultArgs)
    $shellItem = $resultArgs[0]

    if ($null -ne $shellItem) {
      # SIGDN_FILESYSPATH = 0x80058000 per Shell API; the .NET internal enum
      # uses the same underlying value exposed on the interface signature.
      $getDisplayName = $shellItemType.GetMethod('GetDisplayName')
      $dnArgs = @([int]0x80028000, $null)
      $getDisplayName.Invoke($shellItem, $dnArgs)
      $selectedPath = $dnArgs[1]
      if ($selectedPath) {
        Write-Host "SELECTED:$selectedPath"
      }
    }
  }
  # Non-zero HRESULT (e.g. 0x800704C7) = user cancelled -> print nothing.
}
finally {
  $owner.Close()
  $owner.Dispose()
}
