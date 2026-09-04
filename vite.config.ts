import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

function midnightDeployPlugin(): Plugin {
  return {
    name: 'midnight-deploy-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/deploy/status' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          const depFile = path.resolve(process.cwd(), '.midnight-deployment.json');
          if (fs.existsSync(depFile)) {
            res.end(fs.readFileSync(depFile, 'utf-8'));
          } else {
            res.end(JSON.stringify({ deployed: false, contractAddress: process.env.MIDNIGHT_CONTRACT_ADDRESS || '' }));
          }
          return;
        }

        if (req.url === '/api/deploy/record' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const { contractAddress, txHash, deployerAddress, network } = data;

              // 1. Write to .midnight-deployment.json
              const depRecord = {
                deployed: true,
                contractAddress,
                txHash,
                deployerAddress,
                network: network || 'Midnight Preview',
                deployedAt: new Date().toISOString()
              };
              fs.writeFileSync(
                path.resolve(process.cwd(), '.midnight-deployment.json'),
                JSON.stringify(depRecord, null, 2),
                'utf-8'
              );

              // 2. Update .env
              const envPath = path.resolve(process.cwd(), '.env');
              let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
              if (!envContent.includes('MIDNIGHT_CONTRACT_ADDRESS=')) {
                envContent += `\nMIDNIGHT_CONTRACT_ADDRESS="${contractAddress}"\nVITE_MIDNIGHT_CONTRACT_ADDRESS="${contractAddress}"\n`;
              } else {
                envContent = envContent.replace(/MIDNIGHT_CONTRACT_ADDRESS=.*/g, `MIDNIGHT_CONTRACT_ADDRESS="${contractAddress}"`);
                envContent = envContent.replace(/VITE_MIDNIGHT_CONTRACT_ADDRESS=.*/g, `VITE_MIDNIGHT_CONTRACT_ADDRESS="${contractAddress}"`);
              }
              fs.writeFileSync(envPath, envContent, 'utf-8');

              // 3. Update MIDNIGHT_DEPLOYMENT.md
              const docPath = path.resolve(process.cwd(), 'MIDNIGHT_DEPLOYMENT.md');
              if (fs.existsSync(docPath)) {
                let docContent = fs.readFileSync(docPath, 'utf-8');
                docContent = docContent.replace(/\[UNSET — PENDING ON-CHAIN DEPLOYMENT\]/g, contractAddress);
                docContent = docContent.replace(/PENDING_BROADCAST/g, txHash);
                fs.writeFileSync(docPath, docContent, 'utf-8');
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, record: depRecord }));
            } catch (err: unknown) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [wasm(), react(), tailwindcss(), midnightDeployPlugin()],
    build: {
      target: 'esnext',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
