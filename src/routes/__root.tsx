import { TanStackDevtools } from '@tanstack/react-devtools';
import {
	createRootRoute,
	type ErrorComponentProps,
	HeadContent,
	Scripts,
} from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';

import appCss from '../styles.css?url';

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: 'utf-8',
			},
			{
				name: 'viewport',
				content: 'width=device-width, initial-scale=1',
			},
			{
				title: 'Modular Resume Composer',
			},
		],
		links: [
			{
				rel: 'stylesheet',
				href: appCss,
			},
		],
	}),
	errorComponent: RootErrorDocument,
	notFoundComponent: RootNotFoundDocument,
	shellComponent: RootDocument,
});

function RootErrorDocument({ error }: ErrorComponentProps) {
	return (
		<main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-10">
			<div className="max-w-2xl rounded-3xl border border-rose-200 bg-white p-8 shadow-sm shadow-rose-100/40">
				<p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-600">
					Application error
				</p>
				<h1 className="mt-2 text-2xl font-semibold text-slate-950">
					The resume composer hit an unexpected error.
				</h1>
				<p className="mt-3 text-sm leading-6 text-slate-700">
					{error instanceof Error ? error.message : 'An unknown error occurred.'}
				</p>
			</div>
		</main>
	);
}

function RootNotFoundDocument() {
	return (
		<main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-10">
			<div className="max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
				<p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
					Not found
				</p>
				<h1 className="mt-2 text-2xl font-semibold text-slate-950">That route does not exist.</h1>
				<p className="mt-3 text-sm leading-6 text-slate-700">
					Use the builder, preview, or presets routes to continue.
				</p>
			</div>
		</main>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<div className="print:hidden">
					<TanStackDevtools
						config={{
							position: 'bottom-right',
						}}
						plugins={[
							{
								name: 'Tanstack Router',
								render: <TanStackRouterDevtoolsPanel />,
							},
						]}
					/>
				</div>
				<Scripts />
			</body>
		</html>
	);
}
