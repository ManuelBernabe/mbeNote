#!/usr/bin/env bash
# Auto-deploy to Railway: runs all tests, then commits and pushes to main.
# Called by the Claude Code Stop hook.
set -e

REPO="/c/Users/sonim/mbeNote"
NODE="/c/Users/sonim/bin/node.exe"

cd "$REPO"

echo ""
echo "======================================="
echo " mbeNote — Test & Deploy"
echo "======================================="

echo ""
echo "[1/3] Backend tests..."
dotnet test tests/mbeNote.Tests/mbeNote.Tests.csproj \
  --nologo \
  --logger "console;verbosity=minimal"

echo ""
echo "[2/3] Frontend tests..."
cd "$REPO/frontend"
"$NODE" node_modules/vitest/vitest.mjs run

cd "$REPO"

echo ""
echo "[3/3] Deploying to Railway..."
git add -A

if git diff --cached --quiet; then
  echo "Nothing new to deploy (no uncommitted changes)."
else
  TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
  git commit -m "deploy: $TIMESTAMP"
  git push origin main
  echo ""
  echo "✓ Pushed to main → Railway is deploying!"
fi

echo "======================================="
echo ""
