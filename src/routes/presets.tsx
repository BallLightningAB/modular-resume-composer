import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';

import { ActionLink } from '@/components/resume/action-link';
import { Button } from '@/components/ui/button';
import type { ResumeRuntimeData } from '@/lib/resume/load';
import { loadResumeRuntimeData } from '@/lib/resume/load';
import type { BuilderSearch } from '@/lib/resume/search';
import {
	buildResumeHref,
	createSearchFromPreset,
	createSearchFromSavedPreset,
	validateBuilderSearch,
} from '@/lib/resume/search';
import { deleteSavedPreset, readSavedPresetCollection } from '@/lib/resume/storage';
import type { PresetFile, SavedPresetRecord } from '@/lib/resume/types';

export const Route = createFileRoute('/presets')({
	validateSearch: (search) => validateBuilderSearch(search),
	loaderDeps: ({ search }) => ({ language: search.language }),
	loader: ({ deps }) =>
		loadResumeRuntimeData({
			data: {
				language: deps.language,
			},
		}),
	component: PresetsRouteComponent,
});

function PresetsRouteComponent() {
	const runtimeData = Route.useLoaderData() as ResumeRuntimeData;
	const rawSearch = Route.useSearch() as BuilderSearch;
	const [savedPresets, setSavedPresets] = useState<Array<SavedPresetRecord>>(() =>
		readSavedPresetCollection()
	);

	const search = useMemo(
		() =>
			runtimeData.language === rawSearch.language
				? rawSearch
				: { ...rawSearch, language: runtimeData.language },
		[rawSearch, runtimeData.language]
	);

	const datasetLabel =
		runtimeData.sources.dataset === 'mixed'
			? 'Private + example data'
			: runtimeData.sources.dataset === 'private'
				? 'Private data'
				: 'Example data';

	const builtinLinks = useMemo(
		() =>
			runtimeData.presetCatalog.map((preset: PresetFile) => {
				const presetSearch = createSearchFromPreset({
					presetId: preset.id,
					preset,
				});

				return {
					preset,
					builderHref: buildResumeHref('/', presetSearch),
					previewHref: buildResumeHref('/preview', presetSearch),
				};
			}),
		[runtimeData.presetCatalog]
	);

	return (
		<div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
			<div className="mx-auto flex max-w-6xl flex-col gap-6">
				<header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div className="space-y-2">
							<p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
								Preset library
							</p>
							<h1 className="text-3xl font-semibold text-slate-950">
								Built-in and saved resume presets
							</h1>
							<p className="max-w-3xl text-sm leading-6 text-slate-600">
								Use this route as a clean catalog for demoing built-in presets and managing local
								browser-saved variants.
							</p>
						</div>
						<div className="flex flex-wrap gap-2">
							<ActionLink href={buildResumeHref('/', search)} variant="secondary">
								Open builder
							</ActionLink>
						</div>
					</div>
					<div className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
						Source: {datasetLabel}
					</div>
				</header>
				<section className="grid gap-4 lg:grid-cols-2">
					<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
						<div className="mb-4 space-y-1">
							<h2 className="text-xl font-semibold text-slate-950">Built-in presets</h2>
							<p className="text-sm text-slate-600">
								Loaded from the current runtime dataset for {runtimeData.language.toUpperCase()}.
							</p>
						</div>
						<div className="space-y-3">
							{builtinLinks.map(({ preset, builderHref, previewHref }) => (
								<div
									key={preset.id}
									className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
								>
									<div className="space-y-1">
										<h3 className="text-base font-semibold text-slate-900">{preset.id}</h3>
										<p className="text-sm text-slate-600">
											{preset.title_line ?? preset.role_track}
										</p>
									</div>
									<div className="mt-3 flex flex-wrap gap-2">
										<ActionLink href={builderHref} size="sm">
											Open in builder
										</ActionLink>
										<ActionLink href={previewHref} size="sm" variant="secondary">
											Preview
										</ActionLink>
									</div>
								</div>
							))}
						</div>
					</div>
					<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
						<div className="mb-4 space-y-1">
							<h2 className="text-xl font-semibold text-slate-950">Saved presets</h2>
							<p className="text-sm text-slate-600">
								Stored locally in your browser with wrapper metadata and section visibility state.
							</p>
						</div>
						{savedPresets.length === 0 ? (
							<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
								No local presets saved yet.
							</div>
						) : (
							<div className="space-y-3">
								{savedPresets.map((record) => {
									const savedSearch = createSearchFromSavedPreset(record);

									return (
										<div
											key={record.id}
											className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
										>
											<div className="space-y-1">
												<h3 className="text-base font-semibold text-slate-900">{record.name}</h3>
												<p className="text-sm text-slate-600">
													Based on {record.source_preset_id ?? record.preset.id}
												</p>
											</div>
											<div className="mt-3 flex flex-wrap gap-2">
												<ActionLink href={buildResumeHref('/', savedSearch)} size="sm">
													Open in builder
												</ActionLink>
												<ActionLink
													href={buildResumeHref('/preview', savedSearch)}
													size="sm"
													variant="secondary"
												>
													Preview
												</ActionLink>
												<Button
													size="sm"
													variant="ghost"
													onClick={() => setSavedPresets(deleteSavedPreset(record.id))}
												>
													Delete
												</Button>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</section>
			</div>
		</div>
	);
}
