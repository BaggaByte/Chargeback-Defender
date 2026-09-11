declare module '*.pipe' {
	const value: {
		components: unknown[];
		project_id: string;
		viewport: { x: number; y: number; zoom: number };
		version: number;
	};
	export default value;
}
