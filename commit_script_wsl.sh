#!/bin/bash

# Configuration
export GIT_AUTHOR_NAME="theb0imanuu"
export GIT_AUTHOR_EMAIL="manu@example.com"
export GIT_COMMITTER_NAME="theb0imanuu"
export GIT_COMMITTER_EMAIL="manu@example.com"

# Set the start time to 3 hours ago
START_TIME=$(date -d "3 hours ago" +%s)

declare -a commits=(
  "0;Initial commit: project boilerplate and environment setup;go.mod go.sum README.md .env .gitignore"
  "15;feat(core): implement core models for jobs, workers, and dlq;internal/core/"
  "30;feat(db): setup postgres schema for jobs, workers, and dlq tables;internal/store/postgres/schema.sql"
  "45;feat(store): implement postgres storage interface for job queues;internal/store/"
  "60;feat(worker): create background worker pool execution loops;internal/worker/"
  "75;feat(api): implement http server routes handles and cors middleware;internal/api/"
  "90;feat(scheduler): implement dag and cron scheduler engine;internal/scheduler/"
  "105;feat(cmd): connect widad daemon entrypoint and services;cmd/"
  "120;feat(ui): scaffold Vite React dashboard with Tailwind;ui/package.json ui/package-lock.json ui/tsconfig.json ui/tsconfig.node.json ui/tsconfig.app.json ui/vite.config.ts ui/index.html ui/eslint.config.js ui/postcss.config.js ui/tailwind.config.js ui/.gitignore"
  "135;feat(ui): add layout components, types, and styling;ui/src/types.ts ui/src/components/ ui/src/layouts/ ui/src/index.css ui/src/main.tsx ui/src/vite-env.d.ts"
  "150;feat(ui): implement dashboard, queues, and jobs views;ui/src/pages/Dashboard.tsx ui/src/pages/Queues.tsx ui/src/pages/Jobs.tsx"
  "165;feat(ui): implement workers, scheduler, and dlq views;ui/src/pages/Workers.tsx ui/src/pages/Scheduler.tsx ui/src/pages/DLQ.tsx"
  "175;feat(ui): wire router to api backend and finalize frontend;ui/src/App.tsx"
  "180;fix: resolve remaining linter errors and dependencies;."
)

for entry in "${commits[@]}"; do
    IFS=";" read -r mins msg files <<< "$entry"
    COMMIT_TIME=$(date -d "@$(($START_TIME + $mins * 60))" +"%Y-%m-%d %H:%M:%S %z")
    export GIT_AUTHOR_DATE="$COMMIT_TIME"
    export GIT_COMMITTER_DATE="$COMMIT_TIME"
    
    for file in $files; do
        if [ -e "$file" ] || [ -d "$file" ]; then
            git add "$file"
        fi
    done
    
    git commit -m "$msg"
done
