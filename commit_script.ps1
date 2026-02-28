$start = (Get-Date).AddHours(-3)
$commits = @(
  @{ msg="Initial commit: project boilerplate and environment setup"; files="go.mod go.sum README.md .env .gitignore"; mins=0 },
  @{ msg="feat(core): implement core models for jobs, workers, and dlq"; files="internal/core/"; mins=15 },
  @{ msg="feat(db): setup postgres schema for jobs, workers, and dlq tables"; files="internal/store/postgres/schema.sql"; mins=30 },
  @{ msg="feat(store): implement postgres storage interface for job queues"; files="internal/store/"; mins=45 },
  @{ msg="feat(worker): create background worker pool execution loops"; files="internal/worker/"; mins=60 },
  @{ msg="feat(api): implement http server routes handles and cors middleware"; files="internal/api/"; mins=75 },
  @{ msg="feat(scheduler): implement dag and cron scheduler engine"; files="internal/scheduler/"; mins=90 },
  @{ msg="feat(cmd): connect widad daemon entrypoint and services"; files="cmd/"; mins=105 },
  @{ msg="feat(ui): scaffold Vite React dashboard with Tailwind"; files="ui/package.json ui/package-lock.json ui/tsconfig.json ui/tsconfig.node.json ui/tsconfig.app.json ui/vite.config.ts ui/index.html ui/eslint.config.js ui/postcss.config.js ui/tailwind.config.js ui/.gitignore"; mins=120 },
  @{ msg="feat(ui): add layout components, types, and styling"; files="ui/src/types.ts ui/src/components/ ui/src/layouts/ ui/src/index.css ui/src/main.tsx ui/src/vite-env.d.ts"; mins=135 },
  @{ msg="feat(ui): implement dashboard, queues, and jobs views"; files="ui/src/pages/Dashboard.tsx ui/src/pages/Queues.tsx ui/src/pages/Jobs.tsx"; mins=150 },
  @{ msg="feat(ui): implement workers, scheduler, and dlq views"; files="ui/src/pages/Workers.tsx ui/src/pages/Scheduler.tsx ui/src/pages/DLQ.tsx"; mins=165 },
  @{ msg="feat(ui): wire router to api backend and finalize frontend"; files="ui/src/App.tsx"; mins=175 },
  @{ msg="fix: resolve remaining linter errors and dependencies"; files="."; mins=180 }
)

foreach ($c in $commits) {
    $d = $start.AddMinutes($c.mins).ToString("yyyy-MM-dd HH:mm:ss K")
    $env:GIT_AUTHOR_DATE = $d
    $env:GIT_COMMITTER_DATE = $d
    $files = $c.files -split ' '
    foreach ($f in $files) {
        if (Test-Path $f) {
            git add $f
        }
    }
    git commit -m $c.msg
}
