# Twilio MCP Remote Server Setup Guide

**Author**: Ayush Mudgal
**Date**: March 6, 2026
**Purpose**: Deploy a fixed version of Twilio MCP as a remote HTTP service in Turo's sandbox environment

---

## Table of Contents

1. [Overview](#overview)
2. [Background & Problem Statement](#background--problem-statement)
3. [Architecture](#architecture)
4. [Prerequisites](#prerequisites)
5. [Implementation Phases](#implementation-phases)
6. [Configuration Reference](#configuration-reference)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This document outlines the process of:
1. Forking and fixing the Twilio MCP repository
2. Creating an HTTP wrapper for the stdio-based MCP
3. Deploying it as a remote MCP service in Turo's Kubernetes sandbox
4. Integrating it with LibreChat for use across Turo

**Goal**: Create a working, remotely-accessible Twilio MCP that bypasses the bugs in the official `@twilio-alpha/mcp` package.

---

## Background & Problem Statement

### The Problem

The official Twilio MCP (`@twilio-alpha/mcp`) has critical bugs that make it unusable:
- **PR #50**: https://github.com/twilio-labs/mcp/pull/50 - Fixes OpenAPI parameter name sanitization issues
- **PR #54**: https://github.com/twilio-labs/mcp/pull/54 - Additional fixes

These PRs are not being merged, and the maintainer (nafg) has become unresponsive.

### Current State

- ✅ LibreChat is deployed at Turo with MCP support
- ✅ Several MCPs are working: Atlassian, GitHub, New Relic, Engineering KB
- ❌ Twilio MCP is broken in the official package
- ❌ No one at Turo can use Twilio APIs via LibreChat

### The Solution

Deploy a custom-fixed version of Twilio MCP as a **remote HTTP service** in the sandbox environment, then promote to production if successful.

---

## Architecture

### Current LibreChat MCP Types

**Type 1: Remote HTTP MCPs** (Atlassian, GitHub, New Relic)
```
LibreChat Pod → HTTP → Remote MCP Service → External API
```

**Type 2: Local Command MCPs** (Engineering KB)
```
LibreChat Pod → npx/uvx → MCP (same pod) → External API
```

### Target Architecture (What We're Building)

```
┌─────────────────────┐
│  LibreChat Pod      │
│  (eng-tools ns)     │
└──────────┬──────────┘
           │
           │ HTTP Request (streamable-http)
           │ POST /mcp
           ▼
┌──────────────────────────────────────┐
│  Twilio MCP Service                  │
│  (purple-wasp-736404 namespace)      │
│  ─────────────────────────────────   │
│                                      │
│  ┌────────────────────────────┐     │
│  │  HTTP Server Wrapper       │     │
│  │  (Express/Fastify + MCP)   │     │
│  └─────────────┬──────────────┘     │
│                │                     │
│                ▼                     │
│  ┌────────────────────────────┐     │
│  │  Twilio MCP Server         │     │
│  │  (stdio-based, fixed)      │     │
│  └─────────────┬──────────────┘     │
│                │                     │
└────────────────┼─────────────────────┘
                 │
                 │ Twilio API calls
                 ▼
        ┌────────────────┐
        │  Twilio API    │
        └────────────────┘
```

**Key Components:**
1. **LibreChat** - The chat interface users interact with
2. **HTTP Wrapper** - Converts HTTP requests to stdio MCP protocol
3. **Twilio MCP** - The fixed MCP server (from PR #50/#54)
4. **Twilio API** - External Twilio services

---

## Prerequisites

### Credentials & Access

**Twilio Credentials:**
```bash
ACCOUNT_SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
API_KEY_SID: SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
API_SECRET: ********************************
AUTH_TOKEN: ********************************
```

**Credential Format for MCP:**
```
ACCOUNT_SID/API_KEY_SID:API_SECRET
ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx:********************************
```

### GitHub & Deployment Access

- ✅ Access to Turo GitHub organization
- ✅ Sandbox branch: `sbx/purple-wasp-736404` in `dev-sbx-deployments`
- ✅ Sandbox PR: https://github.com/turo/dev-sbx-deployments/pull/6844
- ✅ LibreChat PR: https://github.com/turo/llm-gateway-deployments/pull/21

### Tools Required

- Node.js v20+
- Docker
- kubectl (with access to sandbox clusters)
- gh CLI
- git

---

## Progress Tracking

### Current Status: Phase 1 Complete ✅ → Moving to Phase 2

**Last Updated**: March 7, 2026

#### ✅ Completed Tasks - Phase 1: Get the Fixed Twilio MCP Code
- [x] **Repository forked**: `https://github.com/ayushmudgal/twilio-mcp.git`
- [x] **Branch created**: `turo-fixed-version` with all fixes applied
- [x] **PR #50 fixes applied**: Sanitize OpenAPI parameter names with invalid characters
- [x] **PR #54 fixes applied**: Sanitize tool schema property keys to match LLM API requirements
- [x] **Built successfully**: `packages/mcp/build/` contains compiled code
- [x] **Local testing completed**: Verified with Claude Code's MCP configuration
- [x] **Query parameters working**: Tested GET requests with filtering
- [x] **Verify V2 tools accessible**: Confirmed all services load correctly
- [x] **Rate limiting investigation**: Explored detection mechanisms

#### 🚧 Next Phase: Phase 2 - Create HTTP Wrapper
**Status**: Ready to begin

**What needs to be done:**
- [ ] Install `@modelcontextprotocol/server-streamable-http` dependency
- [ ] Create `packages/mcp/http-server.js` wrapper script
- [ ] Update package.json with `start:http` script
- [ ] Test HTTP endpoints locally (health check + /mcp endpoint)

#### 📋 Pending Tasks - Phase 1 (Minor cleanup)
- [ ] Commit pending changes to package-lock.json and server.ts
- [ ] Push latest changes to origin/turo-fixed-version

#### 📋 Pending Tasks - Phase 2: HTTP Wrapper
- [ ] Install `@modelcontextprotocol/server-streamable-http`
- [ ] Create `http-server.js` wrapper
- [ ] Update package.json with HTTP server scripts
- [ ] Test HTTP endpoints locally (health + /mcp)

#### 📋 Pending Tasks - Phase 3: Containerization
- [ ] Create Dockerfile
- [ ] Create .dockerignore
- [ ] Build Docker image locally
- [ ] Test container locally
- [ ] Get Turo container registry details from DevEx
- [ ] Push image to Turo registry

#### 📋 Pending Tasks - Phase 4: Sandbox Deployment
- [ ] Create Kubernetes Secret for credentials
- [ ] Create Deployment manifest
- [ ] Create Service manifest
- [ ] Create Kustomization file
- [ ] Commit to sandbox branch
- [ ] Deploy to purple-wasp-736404 namespace
- [ ] Verify pod is running and healthy

#### 📋 Pending Tasks - Phase 5: LibreChat Integration
- [ ] Add Twilio MCP to librechat.yaml allowedDomains
- [ ] Add Twilio server configuration to mcpServers
- [ ] Update LibreChat documentation
- [ ] Test integration in LibreChat UI
- [ ] Verify logs show MCP requests

### Notes
- The fixes from PR #50 have been tested locally and work correctly
- Query parameter filtering is working as expected
- Rate limiting detection has been explored (was a tangent but valuable learning)
- Ready to move forward with creating the HTTP wrapper and containerization

---

## Implementation Phases

### Phase 1: Get the Fixed Twilio MCP Code

**Objective**: Fork the Twilio MCP repo, apply fixes, and verify it builds.

#### Steps:

1. **Fork the repository**
   ```bash
   # Option A: Fork to Turo org (recommended)
   gh repo fork twilio-labs/mcp --org turo --fork-name twilio-mcp-fixed

   # Option B: Fork to personal account
   gh repo fork twilio-labs/mcp
   ```

2. **Clone your fork**
   ```bash
   cd ~/code
   git clone https://github.com/turo/twilio-mcp-fixed.git  # Or your personal fork
   cd twilio-mcp-fixed
   ```

3. **Apply fixes from PR #50**
   ```bash
   # Add the upstream remote
   git remote add upstream https://github.com/twilio-labs/mcp.git

   # Fetch PR #50
   gh pr checkout 50 --repo twilio-labs/mcp

   # Or manually:
   git fetch upstream pull/50/head:pr-50-fix
   git checkout pr-50-fix

   # Create a new branch with the fixes
   git checkout -b turo-fixed-version
   ```

4. **Optionally apply PR #54 fixes**
   ```bash
   # Check if PR #54 is needed
   gh pr view 54 --repo twilio-labs/mcp

   # Apply if needed (cherry-pick or merge)
   ```

5. **Install dependencies and build**
   ```bash
   npm install
   npm run build
   ```

6. **Test locally**
   ```bash
   # Test the built MCP server
   node packages/mcp/build/index.js \
     ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx:********************************

   # You should see: "Twilio MCP Server running on stdio"
   ```

**Success Criteria:**
- ✅ Repository forked and cloned
- ✅ Fixes applied
- ✅ Build succeeds
- ✅ MCP server starts without errors

---

### Phase 2: Create HTTP Wrapper

**Objective**: Wrap the stdio-based MCP in an HTTP server so LibreChat can communicate with it.

#### Understanding the Problem

The Twilio MCP is stdio-based (communicates via stdin/stdout), but LibreChat needs an HTTP endpoint. We need to bridge these two protocols.

#### Implementation Options

**Option A: Use `@modelcontextprotocol/server-streamable-http`**

This is the official MCP HTTP transport library.

**Option B: Custom Express/Fastify wrapper**

Build a simple HTTP server that spawns the MCP process and proxies requests.

#### Steps (Using Official Library):

1. **Install HTTP transport**
   ```bash
   cd ~/code/twilio-mcp-fixed
   npm install @modelcontextprotocol/server-streamable-http
   ```

2. **Create HTTP server wrapper** (`packages/mcp/http-server.js`):
   ```javascript
   #!/usr/bin/env node
   import { StreamableHTTPServerTransport } from '@modelcontextprotocol/server-streamable-http';
   import express from 'express';
   import { spawn } from 'child_process';

   const app = express();
   const PORT = process.env.PORT || 8080;

   // Get Twilio credentials from environment or args
   const TWILIO_CREDENTIALS = process.env.TWILIO_CREDENTIALS ||
     'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx:********************************';

   app.post('/mcp', async (req, res) => {
     // Spawn the MCP server process
     const mcpProcess = spawn('node', [
       './build/index.js',
       TWILIO_CREDENTIALS
     ], {
       cwd: __dirname,
       stdio: ['pipe', 'pipe', 'pipe']
     });

     // Create HTTP transport
     const transport = new StreamableHTTPServerTransport(req, res);

     // Connect stdio to HTTP transport
     mcpProcess.stdout.pipe(transport);
     transport.pipe(mcpProcess.stdin);

     // Handle errors
     mcpProcess.stderr.on('data', (data) => {
       console.error('MCP Error:', data.toString());
     });

     mcpProcess.on('exit', (code) => {
       if (code !== 0) {
         console.error('MCP process exited with code:', code);
       }
     });
   });

   app.get('/health', (req, res) => {
     res.json({ status: 'healthy', service: 'twilio-mcp' });
   });

   app.listen(PORT, () => {
     console.log(`Twilio MCP HTTP server listening on port ${PORT}`);
   });
   ```

3. **Update package.json**
   ```json
   {
     "scripts": {
       "start": "node packages/mcp/http-server.js",
       "start:http": "node packages/mcp/http-server.js"
     }
   }
   ```

4. **Test locally**
   ```bash
   # Start the HTTP server
   npm run start:http

   # In another terminal, test the endpoint
   curl -X POST http://localhost:8080/health

   # Test MCP endpoint with a simple request
   curl -X POST http://localhost:8080/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'
   ```

**Success Criteria:**
- ✅ HTTP server starts on port 8080
- ✅ Health check endpoint responds
- ✅ MCP endpoint accepts requests
- ✅ MCP protocol works over HTTP

---

### Phase 3: Containerize

**Objective**: Package the HTTP-wrapped MCP into a Docker container.

#### Steps:

1. **Create Dockerfile** (`Dockerfile`):
   ```dockerfile
   FROM node:20-alpine

   # Install build dependencies
   RUN apk add --no-cache git python3 make g++

   WORKDIR /app

   # Copy package files
   COPY package*.json ./
   COPY packages/mcp/package*.json ./packages/mcp/

   # Install dependencies
   RUN npm ci --production

   # Copy source code
   COPY . .

   # Build the MCP server
   RUN npm run build

   # Expose HTTP port
   EXPOSE 8080

   # Set environment variables
   ENV PORT=8080
   ENV NODE_ENV=production

   # Health check
   HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
     CMD node -e "require('http').get('http://localhost:8080/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

   # Run the HTTP server
   CMD ["npm", "run", "start:http"]
   ```

2. **Create .dockerignore**:
   ```
   node_modules
   .git
   .github
   *.md
   .env*
   dist
   coverage
   .vscode
   ```

3. **Build the image**
   ```bash
   cd ~/code/twilio-mcp-fixed

   # Build locally
   docker build -t twilio-mcp:local .
   ```

4. **Test the container locally**
   ```bash
   # Run the container
   docker run -p 8080:8080 \
     -e TWILIO_CREDENTIALS="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx:********************************" \
     twilio-mcp:local

   # Test health endpoint
   curl http://localhost:8080/health

   # Test MCP endpoint
   curl -X POST http://localhost:8080/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'
   ```

5. **Tag and push to Turo's container registry**
   ```bash
   # Assuming Turo uses ECR or similar
   # Get the registry URL from DevEx team

   # Example for ECR:
   aws ecr get-login-password --region us-east-1 | \
     docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

   # Tag the image
   docker tag twilio-mcp:local <REGISTRY_URL>/twilio-mcp:v1.0.0

   # Push
   docker push <REGISTRY_URL>/twilio-mcp:v1.0.0
   ```

**Success Criteria:**
- ✅ Docker image builds successfully
- ✅ Container runs and passes health check
- ✅ MCP endpoint is accessible
- ✅ Image pushed to registry

**Questions for DevEx:**
- What is Turo's container registry URL?
- What naming convention should I use for the image?
- Do we need to scan the image for vulnerabilities?

---

### Phase 4: Deploy to Sandbox

**Objective**: Deploy the containerized MCP to your sandbox environment.

#### Kubernetes Resources Needed

1. **Namespace** (already exists: `purple-wasp-736404`)
2. **Secret** (for Twilio credentials)
3. **Deployment** (the MCP server)
4. **Service** (expose the deployment)
5. **Ingress** (optional, if external access needed)

#### Steps:

1. **Switch to your sandbox branch**
   ```bash
   cd ~/code/dev-sbx-deployments
   git checkout sbx/purple-wasp-736404
   ```

2. **Create directory for Twilio MCP**
   ```bash
   mkdir -p twilio-mcp
   cd twilio-mcp
   ```

3. **Create Secret** (`secret.yaml`):
   ```yaml
   apiVersion: v1
   kind: Secret
   metadata:
     name: twilio-mcp-credentials
     namespace: purple-wasp-736404
   type: Opaque
   stringData:
     twilio-credentials: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx:********************************"
   ```

4. **Create Deployment** (`deployment.yaml`):
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: twilio-mcp
     namespace: purple-wasp-736404
     labels:
       app: twilio-mcp
   spec:
     replicas: 1
     selector:
       matchLabels:
         app: twilio-mcp
     template:
       metadata:
         labels:
           app: twilio-mcp
       spec:
         containers:
         - name: twilio-mcp
           image: <REGISTRY_URL>/twilio-mcp:v1.0.0  # Update with actual registry URL
           ports:
           - containerPort: 8080
             name: http
           env:
           - name: PORT
             value: "8080"
           - name: TWILIO_CREDENTIALS
             valueFrom:
               secretKeyRef:
                 name: twilio-mcp-credentials
                 key: twilio-credentials
           - name: NODE_ENV
             value: "production"
           resources:
             requests:
               memory: "256Mi"
               cpu: "100m"
             limits:
               memory: "512Mi"
               cpu: "500m"
           livenessProbe:
             httpGet:
               path: /health
               port: 8080
             initialDelaySeconds: 10
             periodSeconds: 30
           readinessProbe:
             httpGet:
               path: /health
               port: 8080
             initialDelaySeconds: 5
             periodSeconds: 10
   ```

5. **Create Service** (`service.yaml`):
   ```yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: twilio-mcp
     namespace: purple-wasp-736404
     labels:
       app: twilio-mcp
   spec:
     type: ClusterIP
     selector:
       app: twilio-mcp
     ports:
     - port: 80
       targetPort: 8080
       protocol: TCP
       name: http
   ```

6. **Create Kustomization** (`kustomization.yaml`):
   ```yaml
   apiVersion: kustomize.config.k8s.io/v1beta1
   kind: Kustomization

   namespace: purple-wasp-736404

   resources:
     - secret.yaml
     - deployment.yaml
     - service.yaml

   commonLabels:
     app: twilio-mcp
     owner: ayush-mudgal
     environment: sandbox
   ```

7. **Commit and push**
   ```bash
   git add twilio-mcp/
   git commit -m "Add Twilio MCP service to sandbox

   - Deploys fixed version of Twilio MCP with PR #50 fixes
   - Exposes as HTTP service for LibreChat integration
   - Uses credentials from secret

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

   git push origin sbx/purple-wasp-736404
   ```

8. **Deploy to sandbox**
   ```bash
   # This will be deployed automatically via ArgoCD/Flux
   # Or manually if needed:
   kubectl apply -k twilio-mcp/
   ```

9. **Verify deployment**
   ```bash
   # Check pods
   kubectl get pods -n purple-wasp-736404 -l app=twilio-mcp

   # Check logs
   kubectl logs -n purple-wasp-736404 -l app=twilio-mcp --tail=50

   # Port forward to test locally
   kubectl port-forward -n purple-wasp-736404 svc/twilio-mcp 8080:80

   # Test in another terminal
   curl http://localhost:8080/health
   ```

**Success Criteria:**
- ✅ Pod is running
- ✅ Health check is passing
- ✅ Service is accessible within cluster
- ✅ No errors in logs

---

### Phase 5: Configure LibreChat

**Objective**: Add Twilio MCP configuration to LibreChat so users can access it.

#### Steps:

1. **Switch to LibreChat PR branch**
   ```bash
   cd ~/code  # or wherever you work
   gh repo clone turo/llm-gateway-deployments
   cd llm-gateway-deployments
   gh pr checkout 21
   ```

2. **Edit librechat.yaml**

   File: `deployments/librechat/environments/eng-tools/librechat.yaml`

   Add to `mcpSettings.allowedDomains`:
   ```yaml
   mcpSettings:
     allowedDomains:
       - "api.githubcopilot.com"
       - "api.mcp-platform-internal.svc.cluster.local"
       - "mcp.atlassian.com"
       - "mcp.newrelic.com"
       - "twilio-mcp.purple-wasp-736404.svc.cluster.local"  # Add this
   ```

   Add to `mcpServers`:
   ```yaml
   mcpServers:
     # ... existing servers ...

     twilio:
       title: "Twilio"
       description: "Twilio API integration for SMS, calls, and messaging"
       type: streamable-http
       url: http://twilio-mcp.purple-wasp-736404.svc.cluster.local/mcp
       startup: false
   ```

3. **Update documentation**

   File: `docs/how-to/enable-mcps.md`

   Add to the table:
   ```markdown
   | **Twilio**                     | Twilio API access for SMS, calls, and messaging services    |
   ```

   Add server-specific section:
   ```markdown
   ### Twilio

   No credentials required — Twilio credentials are configured server-side. Enable directly from the dropdown and it connects automatically.
   ```

4. **Commit changes**
   ```bash
   git add deployments/librechat/environments/eng-tools/librechat.yaml
   git add docs/how-to/enable-mcps.md

   git commit -m "Add Twilio MCP integration to LibreChat

   - Adds Twilio MCP server pointing to sandbox deployment
   - Allows users to interact with Twilio APIs via chat
   - Uses fixed version with PR #50 patches applied

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

   git push
   ```

5. **Wait for deployment**

   LibreChat will be automatically redeployed with the new configuration.

6. **Test in LibreChat**

   a. Open LibreChat: https://chat.turo.com (or whatever the URL is)

   b. Start a new conversation

   c. Click the MCP dropdown below the chat input

   d. Select "Twilio"

   e. The server should connect (green icon)

   f. Test with a prompt:
   ```
   Can you list my Twilio phone numbers?
   ```

   g. Verify the MCP is being called:
   ```bash
   kubectl logs -n purple-wasp-736404 -l app=twilio-mcp -f
   ```

**Success Criteria:**
- ✅ Twilio appears in LibreChat MCP dropdown
- ✅ Server connects successfully (green icon)
- ✅ Can execute Twilio API calls through chat
- ✅ Logs show MCP requests being processed

---

## Configuration Reference

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TWILIO_CREDENTIALS` | Combined credentials string | `AC.../SK...:SECRET` |
| `PORT` | HTTP server port | `8080` |
| `NODE_ENV` | Node environment | `production` |

### Service Endpoints

| Environment | URL | Description |
|-------------|-----|-------------|
| Local Dev | `http://localhost:8080` | Local testing |
| Sandbox | `http://twilio-mcp.purple-wasp-736404.svc.cluster.local` | Sandbox deployment |
| Production | TBD | After promotion |

### LibreChat Configuration

**MCP Server Block:**
```yaml
twilio:
  title: "Twilio"
  description: "Twilio API integration"
  type: streamable-http
  url: http://twilio-mcp.purple-wasp-736404.svc.cluster.local/mcp
  startup: false
```

**Allowed Domains:**
```yaml
mcpSettings:
  allowedDomains:
    - "twilio-mcp.purple-wasp-736404.svc.cluster.local"
```

---

## Troubleshooting

### Issue: MCP server won't start

**Symptoms:**
- Pod in CrashLoopBackOff
- Logs show "Invalid AccountSid" or credential errors

**Solutions:**
1. Verify secret is created:
   ```bash
   kubectl get secret twilio-mcp-credentials -n purple-wasp-736404 -o yaml
   ```

2. Check credentials format:
   ```bash
   kubectl get secret twilio-mcp-credentials -n purple-wasp-736404 -o jsonpath='{.data.twilio-credentials}' | base64 -d
   ```

3. Verify it matches: `AC.../SK...:SECRET`

### Issue: LibreChat can't connect to MCP

**Symptoms:**
- Server shows as disconnected (orange plug icon)
- "Failed to connect" error in LibreChat

**Solutions:**
1. Check if service is running:
   ```bash
   kubectl get svc -n purple-wasp-736404
   ```

2. Test connectivity from LibreChat pod:
   ```bash
   # Get LibreChat pod name
   kubectl get pods -n eng-tools -l app=librechat

   # Exec into pod
   kubectl exec -it <librechat-pod> -n eng-tools -- /bin/sh

   # Test connection
   curl http://twilio-mcp.purple-wasp-736404.svc.cluster.local/health
   ```

3. Check allowed domains in librechat.yaml

4. Check logs:
   ```bash
   kubectl logs -n purple-wasp-736404 -l app=twilio-mcp
   ```

### Issue: HTTP wrapper not working

**Symptoms:**
- Health check passes but MCP requests fail
- Logs show protocol errors

**Solutions:**
1. Test MCP protocol locally:
   ```bash
   echo '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}' | \
     node packages/mcp/build/index.js AC.../SK...:SECRET
   ```

2. Compare with HTTP endpoint:
   ```bash
   curl -X POST http://localhost:8080/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'
   ```

3. Check that the HTTP wrapper correctly proxies stdio

### Issue: Twilio API errors

**Symptoms:**
- MCP connects but Twilio operations fail
- "Authentication failed" errors

**Solutions:**
1. Verify credentials are still valid in Twilio Console

2. Check API key permissions

3. Test credentials directly:
   ```bash
   curl -X GET 'https://api.twilio.com/2010-04-01/Accounts/AC.../Messages.json' \
     -u 'SK...:SECRET'
   ```

---

## Next Steps After Deployment

1. **Monitor usage**
   - Set up metrics/dashboards for MCP usage
   - Track error rates

2. **Gather feedback**
   - Ask team members to test
   - Document common use cases

3. **Promote to production**
   - If sandbox testing is successful
   - Work with DevEx to deploy to prod namespace
   - Update LibreChat prod config

4. **Contributing back**
   - If the fix works well, try to get it merged upstream
   - Or maintain the fork for Turo's use

5. **Documentation**
   - Add to Turo's internal docs
   - Create examples of Twilio + LibreChat workflows

---

## Questions for DevEx Team

Before starting, confirm with DevEx:

1. **Container Registry**
   - What's the registry URL?
   - What naming convention?
   - Do we need vulnerability scanning?

2. **Sandbox Deployment**
   - Will ArgoCD/Flux auto-deploy from the PR?
   - Or do we need manual kubectl apply?
   - Any specific labels/annotations required?

3. **Secrets Management**
   - Is it okay to use a plain Secret for sandbox?
   - Should we use SealedSecret or external secrets?
   - How do we rotate credentials?

4. **Network Policies**
   - Are there any network policies we need to configure?
   - Can sandbox namespace talk to eng-tools namespace?

5. **Resource Limits**
   - What are appropriate CPU/memory requests?
   - Any quotas on the sandbox namespace?

6. **Monitoring**
   - Do we need to add ServiceMonitor for Prometheus?
   - Should we set up alerts?

7. **Long-term Strategy**
   - If this works, should we:
     - Keep it in sandbox?
     - Promote to shared infrastructure?
     - Publish as internal Turo MCP?

---

## Appendix: Useful Commands

### Development

```bash
# Build the MCP locally
npm run build

# Test stdio MCP
node packages/mcp/build/index.js AC.../SK...:SECRET

# Start HTTP server locally
npm run start:http

# Test HTTP endpoint
curl http://localhost:8080/health
```

### Docker

```bash
# Build image
docker build -t twilio-mcp:local .

# Run container
docker run -p 8080:8080 -e TWILIO_CREDENTIALS="..." twilio-mcp:local

# Check logs
docker logs <container-id>

# Shell into container
docker exec -it <container-id> /bin/sh
```

### Kubernetes

```bash
# Get all resources
kubectl get all -n purple-wasp-736404

# Get logs
kubectl logs -n purple-wasp-736404 -l app=twilio-mcp --tail=100 -f

# Describe pod
kubectl describe pod -n purple-wasp-736404 -l app=twilio-mcp

# Port forward
kubectl port-forward -n purple-wasp-736404 svc/twilio-mcp 8080:80

# Exec into pod
kubectl exec -it <pod-name> -n purple-wasp-736404 -- /bin/sh

# Delete all resources
kubectl delete -k twilio-mcp/

# Force restart deployment
kubectl rollout restart deployment/twilio-mcp -n purple-wasp-736404
```

### Debugging

```bash
# Check if service DNS resolves from LibreChat
kubectl run -it --rm debug --image=alpine --restart=Never -n eng-tools -- sh
nslookup twilio-mcp.purple-wasp-736404.svc.cluster.local
wget -O- http://twilio-mcp.purple-wasp-736404.svc.cluster.local/health

# Check network connectivity
kubectl run -it --rm debug --image=nicolaka/netshoot --restart=Never -- sh
curl http://twilio-mcp.purple-wasp-736404.svc.cluster.local/health

# View events
kubectl get events -n purple-wasp-736404 --sort-by='.lastTimestamp'
```

---

## Resources

### Documentation
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [LibreChat MCP Integration](https://docs.librechat.ai/features/mcp)
- [Twilio API Reference](https://www.twilio.com/docs/api)

### Repositories
- [Original Twilio MCP](https://github.com/twilio-labs/mcp)
- [PR #50 - Fix OpenAPI sanitization](https://github.com/twilio-labs/mcp/pull/50)
- [PR #54 - Additional fixes](https://github.com/twilio-labs/mcp/pull/54)
- [Your fork](https://github.com/turo/twilio-mcp-fixed) (TBD)

### Turo Internal
- [Sandbox PR](https://github.com/turo/dev-sbx-deployments/pull/6844)
- [LibreChat PR](https://github.com/turo/llm-gateway-deployments/pull/21)

---

**End of Document**

_Last Updated: March 6, 2026_
