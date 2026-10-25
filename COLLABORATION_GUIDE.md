# Team Collaboration & Co-Working Guide
## Police Headquarters Data Management System (PHDMS v2.0)

This guide provides the 4 best ways to share and work on this project together with your teammates simultaneously.

---

### Option 1: Instant Live Access (Same Wi-Fi / Hotspot) — *No Setup Required for Teammates*

Both your backend (port `5000`) and frontend (port `5173`) are running and configured with open CORS and network binding.

- **Your Local Network IP:** `10.30.79.109`
- **Link for Teammates on the same Wi-Fi:**
  ```text
  http://10.30.79.109:5173
  ```
- **How it works:**
  1. Ensure your laptop and teammates' laptops/phones are connected to the same Wi-Fi or mobile hotspot.
  2. Send them the link: `http://10.30.79.109:5173`.
  3. They can open it immediately in Chrome/Edge, log in as any officer (e.g. `MH-HQ-001` / `Admin@123`), file FIRs, catalog evidence, and book lockup detainees simultaneously with live Socket.io sync!

---

### Option 2: Remote Public Internet Link (If Teammates Are at Home)

If your teammates are on different Wi-Fi networks or in different locations:

1. Double-click the file:
   ```text
   SHARE_PUBLIC_LINK.bat
   ```
   *(Or run `npx localtunnel --port 5173` in your terminal)*
2. It generates a secure public URL (e.g., `https://silent-police-app.loca.lt`).
3. Share that URL with your teammates.
4. They can open it in any web browser anywhere in the world and use the application live with you in real-time.

---

### Option 3: Real-Time Live Pair Programming (VS Code Live Share)

If you and your teammates want to **edit code files simultaneously** (like Google Docs) and test together:

1. In VS Code, install the official extension: **Live Share** (by Microsoft).
2. Click **"Live Share"** in the bottom status bar (or press `Ctrl+Shift+P` -> `Live Share: Start Collaboration Session`).
3. It will automatically copy an invite link to your clipboard.
4. Send the link to your teammate.
5. When they click the link:
   - They can join in their VS Code or right in their browser at `vscode.dev`.
   - You can see each other's cursors, edit files in real-time, and chat.
   - Live Share automatically forwards port `5173` and `5000` to your teammate's session, so they can test the running app without having to install MySQL or Node on their machine!

---

### Option 4: Full Codebase Collaboration via GitHub

To collaborate using version control, pull requests, and Git branches:

#### Step 1: Install Git on Windows (if not installed)
- Download from: [https://git-scm.com/download/win](https://git-scm.com/download/win)
- Or run in PowerShell:
  ```powershell
  winget install --id Git.Git -e --source winget
  ```

#### Step 2: Initialize & Push to GitHub
1. Create a new repository on [GitHub](https://github.com/new) (e.g., `police-hq-management`).
2. Run in the project folder:
   ```bash
   git init
   git add .
   git commit -m "feat: complete Police HQ management system v2.0"
   git branch -M main
   git remote add origin https://github.com/<YOUR-USERNAME>/police-hq-management.git
   git push -u origin main
   ```
3. Add your teammates as collaborators in GitHub Settings -> Collaborators.

#### Step 3: Shared Database for Teammates
A consolidated export with all 16 tables and Maharashtra Police seed data has been saved at:
```text
database/police_hq_full_export.sql
```
- **Local MySQL:** Teammates can import it with:
  ```bash
  mysql -u root -p < database/police_hq_full_export.sql
  ```
- **Free Shared Cloud Database:** You can import `database/police_hq_full_export.sql` into a free cloud MySQL database (e.g., [TiDB Cloud Serverless](https://tidbcloud.com/) or [Aiven](https://aiven.io/)), and put that DB connection string in `server/.env`. That way, when any teammate files a case or adds evidence, all teammates see it in real-time on their screens!
