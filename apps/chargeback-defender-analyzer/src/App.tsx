import React, { useState } from 'react';
import {
	AppLayout,
	Button,
	Card,
	InputField,
	Banner,
	EmptyState,
	useShellConnection,
} from 'shell';
import type { ShellAppProps } from 'shell';
import { PipeException } from 'rocketride';
import disputeAnalyzerPipeline from '../../../pipelines/dispute-analyzer.pipe';

const styles: Record<string, React.CSSProperties> = {
	wrap: { padding: 40, maxWidth: 720, fontFamily: 'var(--rr-font-family, system-ui)' },
	title: { fontSize: 22, fontWeight: 600, color: 'var(--rr-text-primary)' },
	sub: { marginTop: 8, marginBottom: 24, fontSize: 13, color: 'var(--rr-text-secondary)' },
	textarea: {
		width: '100%',
		minHeight: 220,
		fontFamily: 'var(--rr-font-mono, Consolas, monospace)',
		fontSize: 13,
		padding: 12,
		background: 'var(--rr-bg-input)',
		color: 'var(--rr-text-primary)',
		border: '1px solid var(--rr-border-input)',
		borderRadius: 6,
	},
	actions: { marginTop: 16, display: 'flex', gap: 12 },
	resultCard: { marginTop: 24 },
};

const SAMPLE = `{
  "dispute": { "id": "dp_123", "reason": "product_not_received", "amount": 4200, "currency": "usd", "cardBrand": "visa" },
  "customer": { "id": "cus_456", "sessionsMatchDelivery": true },
  "transaction": { "avsResult": "Y", "cvcResult": "M", "threeDSecure": true },
  "evidence": [
    { "type": "SHIPPING_PROOF", "trackingNumber": "1Z999AA10123456784", "carrier": "UPS", "signaturePresent": true }
  ]
}`;

function DisputeAnalyzer({ isConnected }: ShellAppProps) {
	const { client } = useShellConnection();
	const [input, setInput] = useState(SAMPLE);
	const [running, setRunning] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<string | null>(null);

	async function runAnalysis() {
		if (!client) return;
		setRunning(true);
		setError(null);
		setResult(null);
		try {
			const { token } = await client.use({ pipeline: disputeAnalyzerPipeline, useExisting: true });
			const response = await client.send(token, input, undefined, 'application/json');
			setResult(JSON.stringify(response, null, 2));
		} catch (err) {
			setError(
				err instanceof PipeException
					? 'The pipeline rejected the request — check the JSON shape against the sample.'
					: String((err as Error).message ?? err),
			);
		} finally {
			setRunning(false);
		}
	}

	if (!isConnected) {
		return (
			<AppLayout showStatus>
				<div style={styles.wrap}>
					<EmptyState title="Connecting..." description="Waiting for the RocketRide connection." />
				</div>
			</AppLayout>
		);
	}

	return (
		<AppLayout showStatus>
			<div style={styles.wrap}>
				<div style={styles.title}>Dispute Analyzer</div>
				<div style={styles.sub}>
					Paste dispute, transaction, and evidence data as JSON. Returns a win-probability
					score, evidence gaps, and a draft rebuttal letter.
				</div>

				<textarea
					style={styles.textarea}
					value={input}
					onChange={(e) => setInput(e.target.value)}
					spellCheck={false}
				/>

				<div style={styles.actions}>
					<Button onClick={runAnalysis} disabled={running}>
						{running ? 'Analyzing...' : 'Analyze Dispute'}
					</Button>
				</div>

				{error && (
					<div style={{ marginTop: 16 }}>
						<Banner variant="error">{error}</Banner>
					</div>
				)}

				{result && (
					<Card style={styles.resultCard}>
						<pre style={{ ...styles.textarea, minHeight: 'auto' } as React.CSSProperties}>
							{result}
						</pre>
					</Card>
				)}
			</div>
		</AppLayout>
	);
}

export default DisputeAnalyzer;
