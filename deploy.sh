#!/usr/bin/env bash
# Deploy to Simply.com: https://ukenummer.qraiqe.no  (web root /var/www/qraiqe.no/ukenummer)
set -euo pipefail
cd "$(dirname "$0")"
./check.sh
rsync -avz --delete \
  --exclude '.git/' --exclude '.gitignore' --exclude '.DS_Store' --exclude '.claude/' \
  --exclude 'scripts/' --exclude 'check.sh' --exclude 'deploy.sh' --exclude 'README.md' \
  -e "ssh -i $HOME/.ssh/id_rsa" \
  ./ qraiqe.no@ssh.simply.com:/var/www/qraiqe.no/ukenummer/
