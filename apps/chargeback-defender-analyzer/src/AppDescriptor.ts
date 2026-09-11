// HMR anchor — keeps the shared JSX runtime referenced even if App.tsx fails
// to compile. Do not remove (see ROCKETRIDE_APPS.md: "the frozen-preview bug").
import 'react/jsx-dev-runtime';

import type { AppDescriptor } from 'shell';
import App from './App';

// id MUST match appManifest.id in package.json after you fill in your
// developer namespace, and MUST match the id embedded in
// chargeback-defender-analyzer.rrapp (the App Builder writes that file;
// it starts as an empty {} trigger, per ROCKETRIDE_APPS.md).
const descriptor: AppDescriptor = {
	id: 'REPLACE_WITH_YOUR_DEVELOPER_ID.chargeback_defender_analyzer',
	name: 'Chargeback Defender — Dispute Analyzer',
	branding: {
		appName: 'Chargeback Defender',
		welcomeTitle: 'Dispute Analyzer',
		welcomeSubtitle: 'Win-probability scoring and rebuttal drafting for payment disputes',
	},
	app: App,
};

export default descriptor;
