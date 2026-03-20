import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

import { ActionLink } from '@/components/resume/action-link';
import { ResumeDocument } from '@/components/resume/resume-document';
import { Button } from '@/components/ui/button';
import { deriveBuilderState, deriveBuilderStateFromLastUsed } from '@/lib/resume/builder';
import { composeResumeDocument } from '@/lib/resume/compose';
import type { ResumeRuntimeData } from '@/lib/resume/load';
import { loadResumeRuntimeData } from '@/lib/resume/load';
import type { BuilderSearch } from '@/lib/resume/search';
import {
	areBuilderSearchesEqual,
	buildResumeHref,
	createSearchFromPreset,
	hasMeaningfulBuilderSearch,
	validateBuilderSearch,
} from '@/lib/resume/search';
import { readLastUsedResumeState, readSavedPresetCollection } from '@/lib/resume/storage';

export const Route = createFileRoute('/preview')({
	validateSearch: (search) => validateBuilderSearch(search),
	loaderDeps: ({ search }) => ({
		language: search.language,
		preferredPresetId: search.preset,
	}),
	loader: ({ deps }) =>
		loadResumeRuntimeData({
			data: {
				language: deps.language,
				preferredPresetId: deps.preferredPresetId,
			},
		}),
	component: PreviewRouteComponent,
});

function PreviewRouteComponent() {
	const runtimeData = Route.useLoaderData() as ResumeRuntimeData;
	const rawSearch = Route.useSearch() as BuilderSearch;
	const navigate = Route.useNavigate();
	const [savedPresets] = useState(() => readSavedPresetCollection());
	const [lastUsedState] = useState(() => readLastUsedResumeState());

	const search = useMemo(
		() =>
			runtimeData.language === rawSearch.language
				? rawSearch
				: { ...rawSearch, language: runtimeData.language },
		[rawSearch, runtimeData.language]
	);

	const restoredSearch = useMemo(() => {
		if (!lastUsedState) {
			return null;
		}

		const next = createSearchFromPreset({
			presetId: lastUsedState.preset.id,
			savedPresetId: lastUsedState.saved_preset_id,
			preset: lastUsedState.preset,
		});

		return runtimeData.language === next.language
			? next
			: { ...next, language: runtimeData.language };
	}, [lastUsedState, runtimeData.language]);

	const shouldRestoreLastUsed = !hasMeaningfulBuilderSearch(rawSearch) && Boolean(restoredSearch);

	useEffect(() => {
		if (runtimeData.language !== rawSearch.language) {
			navigate({
				replace: true,
				search,
			});
		}
	}, [navigate, rawSearch.language, runtimeData.language, search]);

	useEffect(() => {
		if (
			shouldRestoreLastUsed &&
			restoredSearch &&
			!areBuilderSearchesEqual(search, restoredSearch)
		) {
			navigate({
				replace: true,
				search: restoredSearch,
			});
		}
	}, [navigate, restoredSearch, search, shouldRestoreLastUsed]);

	const builderState = useMemo(() => {
		if (shouldRestoreLastUsed && lastUsedState) {
			return deriveBuilderStateFromLastUsed(lastUsedState, restoredSearch ?? search);
		}

		return deriveBuilderState({
			presetCatalog: runtimeData.presetCatalog,
			search,
			savedPresets,
		});
	}, [
		lastUsedState,
		restoredSearch,
		runtimeData.presetCatalog,
		savedPresets,
		search,
		shouldRestoreLastUsed,
	]);

	const activeSearch = useMemo(
		() =>
			createSearchFromPreset({
				presetId: builderState.builtinPresetId ?? runtimeData.activePresetId,
				savedPresetId: builderState.savedPresetId,
				preset: builderState.preset,
			}),
		[
			builderState.builtinPresetId,
			builderState.preset,
			builderState.savedPresetId,
			runtimeData.activePresetId,
		]
	);

	const document = useMemo(
		() =>
			composeResumeDocument({
				modules: runtimeData.modules,
				preset: builderState.preset,
			}),
		[builderState.preset, runtimeData.modules]
	);

	return (
		<div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 print:bg-white print:p-0">
			<div className="mx-auto flex max-w-6xl flex-col gap-4 print:hidden">
				<div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
							Print preview
						</p>
						<h1 className="text-2xl font-semibold text-slate-950">{builderState.label}</h1>
					</div>
					<div className="flex flex-wrap gap-2">
						<ActionLink href={buildResumeHref('/', activeSearch)} variant="secondary">
							Back to builder
						</ActionLink>
						<Button onClick={() => window.print()}>Print to PDF</Button>
					</div>
				</div>
			</div>
			<ResumeDocument document={document} ui={builderState.ui} className="print:min-h-screen" />
		</div>
	);
}
