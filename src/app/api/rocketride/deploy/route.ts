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

    const pipelinesDir = path.resolve(process.cwd(), 'rocketride');
    const files = fs.existsSync(pipelinesDir) ? fs.readdirSync(pipelinesDir) : [];
    const pipeFiles = files.filter((f) => f.endsWith('.pipe'));

    const pipelines = pipeFiles.map((file) => {
      const fullPath = path.join(pipelinesDir, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      const nodes = content.match(/- id:\s*([a-zA-Z0-9_-]+)/g) || [];
      const versionMatch = content.match(/version:\s*([0-9.]+)/);
      const nameMatch = content.match(/name:\s*([a-zA-Z0-9_-]+)/);

      return {
        filename: file,
        pipelineName: nameMatch ? nameMatch[1] : file.replace('.pipe', ''),
        version: versionMatch ? versionMatch[1] : '2.1.0',
        nodesCount: nodes.length,
        sizeBytes: fs.statSync(fullPath).size,
      };
    });

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
