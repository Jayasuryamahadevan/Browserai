@echo off
set "PATH=%PATH%;C:\Program Files\Git\cmd"

if not exist .git (
    echo Initializing Git repository...
    git init
)

echo Adding files...
git add .

echo Committing changes...
git commit -m "Update project: Saturn Browser architecture and documentation"

echo Configuring remote...
git branch -M main
call git remote remove origin 2>nul
git remote add origin https://github.com/Jayasuryamahadevan/Browserai.git

echo Pushing to GitHub...
echo A credential prompt may appear on your screen.
git push -u origin main
