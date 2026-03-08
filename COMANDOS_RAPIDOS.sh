#!/bin/bash
# COMANDOS RÁPIDOS - Frontend ↔ Backend Communication

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  NervyAI - Comunicación Frontend ↔ Backend                   ║"
echo "║  Comandos de Testing y Deployment                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"

# ========== LOCAL TESTING ==========
echo ""
echo "🟢 LOCAL TESTING (localhost)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "1️⃣ Start Backend:"
echo "  $ cd /path/to/nervyai-im && node server/index.js"

echo ""
echo "2️⃣ Start Frontend (new terminal):"
echo "  $ export PATH=\"/home/arelyxl/.local/share/nvm/v25.6.1/bin:\$PATH\""
echo "  $ npm run dev"

echo ""
echo "3️⃣ Test Backend Health:"
echo "  $ curl http://localhost:4001/api/health"

echo ""
echo "4️⃣ Test Login:"
echo "  $ curl -X POST http://localhost:4001/api/accounts/login \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -d '{\"id\":\"testuser\",\"pin\":\"1234\",\"mode\":\"create\"}'"

# ========== DOCKER TESTING ==========
echo ""
echo "🐳 DOCKER TESTING (docker-compose)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "1️⃣ Start Services:"
echo "  $ docker-compose up -d"

echo ""
echo "2️⃣ View Logs:"
echo "  $ docker-compose logs -f frontend"
echo "  $ docker-compose logs -f backend"

echo ""
echo "3️⃣ Test Backend (from host):"
echo "  $ curl http://localhost:4001/api/health"

echo ""
echo "4️⃣ Test Frontend:"
echo "  $ open http://localhost:3000"

echo ""
echo "5️⃣ Stop Services:"
echo "  $ docker-compose down"

# ========== K8S DEPLOYMENT ==========
echo ""
echo "☸️  KUBERNETES DEPLOYMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "1️⃣ Build Docker Image with Backend URL:"
echo "  $ docker build \\"
echo "      --build-arg NEXT_PUBLIC_BACKEND_URL='https://api.tudominio.com' \\"
echo "      -t nervyai-frontend:latest ."

echo ""
echo "2️⃣ Create Namespace:"
echo "  $ kubectl create namespace nervyai"

echo ""
echo "3️⃣ Update ConfigMap with your domain:"
echo "  $ sed -i 's/tudominio.com/your-domain.com/g' k8s-deployment.yml"

echo ""
echo "4️⃣ Apply Deployment:"
echo "  $ kubectl apply -f k8s-deployment.yml"

echo ""
echo "5️⃣ Watch Pods:"
echo "  $ kubectl get pods -n nervyai -w"

echo ""
echo "6️⃣ View Logs:"
echo "  $ kubectl logs -n nervyai deployment/frontend -f"
echo "  $ kubectl logs -n nervyai deployment/backend -f"

echo ""
echo "7️⃣ Verify Health:"
echo "  $ kubectl port-forward -n nervyai svc/backend-service 4001:4001 &"
echo "  $ curl http://localhost:4001/api/health"
echo "  $ kill %1"

echo ""
echo "8️⃣ Configure Cloudflare DNS:"
echo "  frontend.tudominio.com → K8s Ingress IP"
echo "  api.tudominio.com      → K8s Ingress IP"

# ========== DEBUGGING ==========
echo ""
echo "🔍 DEBUGGING IN BROWSER"
echo "━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "Open DevTools (F12) → Console → Paste:"
echo ""
echo "// 1. Check Backend URL"
echo "localStorage.getItem('backendUrl')"
echo "document.querySelector('meta[name=\"backend-url\"]')?.content"
echo "window.location.hostname"
echo ""
echo "// 2. Test Health Check"
echo "fetch('https://api.tudominio.com/api/health')"
echo "  .then(r => r.json())"
echo "  .then(console.log)"
echo "  .catch(console.error)"
echo ""
echo "// 3. Force Backend URL (temporary)"
echo "localStorage.setItem('backendUrl', 'https://api.tudominio.com')"
echo "location.reload()"

# ========== VERIFY PERSISTENCE ==========
echo ""
echo "💾 VERIFY DATA PERSISTENCE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "1️⃣ Check database file:"
echo "  $ cat server/db.json | jq '.accounts[] | .id'"

echo ""
echo "2️⃣ Check specific account:"
echo "  $ cat server/db.json | jq '.accounts[] | select(.id==\"arelyxl\")'"

echo ""
echo "3️⃣ Test Account Creation & Retrieval:"
echo "  $ curl -X POST http://localhost:4001/api/accounts/login \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -d '{\"id\":\"persist-test\",\"pin\":\"1234\",\"mode\":\"create\",\"state\":{}}'"
echo ""
echo "  $ curl -X GET http://localhost:4001/api/collections/accounts/persist-test"

# ========== COMMON ISSUES ==========
echo ""
echo "⚠️  COMMON ISSUES & FIXES"
echo "━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "❌ Backend says 'pin incorrecto' after creating account:"
echo "   → Issue: Likely using /api proxy (Next.js backend) instead of Express"
echo "   → Fix: Ensure NEXT_PUBLIC_BACKEND_URL points to Express backend"

echo ""
echo "❌ 'Backend ❌' in frontend despite backend running:"
echo "   → Issue: CORS blocked or wrong health check URL"
echo "   → Fix: Check DevTools Network tab, verify ALLOWED_ORIGIN"

echo ""
echo "❌ Data not saving between sessions:"
echo "   → Issue: Frontend using /api (Next.js) instead of Express backend"
echo "   → Fix: Verify meta tag or env var is set correctly"

echo ""
echo "❌ Works on localhost but not on network IP:"
echo "   → Issue: Backend only listening on localhost (not 0.0.0.0)"
echo "   → Fix: Backend should listen on '0.0.0.0' (already fixed in server/index.js)"

echo ""
echo "❌ Different behavior on phone vs computer:"
echo "   → Issue: Each device using different hostname detection"
echo "   → Fix: Use meta tag instead of auto-detection"

# ========== QUICK LINKS ==========
echo ""
echo "📚 DOCUMENTATION"
echo "━━━━━━━━━━━━━━━"
echo ""
echo "Full Technical Details:"
echo "  → COMUNICACION_TECNICA.md"
echo ""
echo "K8s + Cloudflare Setup:"
echo "  → K8S_SETUP.md"
echo ""
echo "Frontend Code:"
echo "  → src/shared/presentation/use-app-store.ts (getDefaultBackendUrl)"
echo "  → app/layout.tsx (meta tag injection)"
echo ""
echo "Backend Code:"
echo "  → server/index.js (Express API)"
echo ""
echo "Config Files:"
echo "  → .env.example (environment variables)"
echo "  → Dockerfile (build config)"
echo "  → docker-compose.yml (local development)"
echo "  → k8s-deployment.yml (production)"

echo ""
echo "╚════════════════════════════════════════════════════════════════╝"
