# PharmaSathi Windows Installer

The Windows installer bundles the Java runtime and uses an embedded H2 database.
Customers do not need to install Java, MySQL, Node.js, or any developer tools.

## Build the EXE

Use GitHub Actions:

1. Push this repository to GitHub.
2. Open **Actions > Build Windows Installer**.
3. Choose **Run workflow**.
4. Download the `PharmaSathi-Windows-Setup` artifact.

Or run this on a Windows development machine with JDK 17, Node.js 22, and WiX:

```powershell
./scripts/build-windows-installer.ps1
```

The installer is created under `installer-output`.

## Customer installation

1. Send the generated `.exe` to the customer.
2. The customer installs it using Next, Install, Finish.
3. PharmaSathi opens automatically in the default browser.
4. On first launch, the customer registers the pharmacy and creates login details.
5. Later launches show the login screen and then the dashboard.

Application data is stored under the Windows user profile in `.pharmasathi/data`.
