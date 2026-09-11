import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { RocketRideClient } from '@/lib/ai/rocketride-client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rocketride/deploy
 * Returns available pipeline configurations and current registration info.
 */
export async function GET() {
  try {
    const rrClient = new RocketRideClient();
    const clusterHealth = await rrClient.checkClusterHealth();

    const searchDirs = [
      path.resolve(process.cwd(), 'pipelines'),
      path.resolve(process.cwd(), 'rocketride'),
    ];

    const pipelines: Array<{
      filename: string;
      pipelineName: string;
      version: string;
      nodesCount: number;
      sizeBytes: number;
      directory: string;
    }> = [];

    for (const dir of searchDirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.pipe'));
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        let nodesCount = 0;
        let version = '2.1.0';
        let pipelineName = file.replace('.pipe', '');

        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed.components)) {
            nodesCount = parsed.components.length;
            version = String(parsed.version || '1.0.0');
          }
        } catch {
          const nodes = content.match(/- id:\s*([a-zA-Z0-9_-]+)/g) || [];
          nodesCount = nodes.length;
          const versionMatch = content.match(/version:\s*([0-9.]+)/);
          const nameMatch = content.match(/name:\s*([a-zA-Z0-9_-]+)/);
          if (versionMatch) version = versionMatch[1];
          if (nameMatch) pipelineName = nameMatch[1];
        }

        pipelines.push({
          filename: file,
          pipelineName,
          version,
          nodesCount,
          sizeBytes: fs.statSync(fullPath).size,
          directory: path.basename(dir),
        });
      }
    }

    return NextResponse.json({
      success: true,
      cluster: clusterHealth,
      availablePipelines: pipelines,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to inspect pipelines' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rocketride/deploy
 * Deploys/registers a pipeline to RocketRide cluster or stages locally.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const pipelineName = body.pipelineName || 'dispute-analyzer';
    const pipeContent = body.pipeContent;

    const rrClient = new RocketRideClient();
    const deployment = await rrClient.deployPipeline(pipelineName, pipeContent);

    return NextResponse.json({
      success: true,
      data: deployment,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Pipeline deployment failed',
      },
      { status: 500 }
    );
  }
}
