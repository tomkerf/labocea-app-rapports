#!/bin/bash
echo "🚀 Deploy staging labocea-app-rapports..."
npm run build
npx wrangler deploy --env dev
echo "✅ Done → labocea-app-rapports-dev.tomkerf.workers.dev"
