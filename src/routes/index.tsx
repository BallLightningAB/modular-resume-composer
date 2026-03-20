import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

import { ActionLink } from '@/components/resume/action-link';
import { ResumeDocument } from '@/components/resume/resume-document';
import { Button } from '@/components/ui/button';

import {
	createLastUsedState,
	createSavedPresetRecord,
	deriveBuilderState,
	deriveBuilderStateFromLastUsed,
	findBuiltinPreset,
} from '@/lib/resume/builder';
import { composeResumeDocument } from '@/lib/resume/compose';
import type { ResumeRuntimeData } from '@/lib/resume/load';
import { loadResumeRuntimeData } from '@/lib/resume/load';
import { ROLE_TRACKS, SECTION_KEYS } from '@/lib/resume/schema';
import type { BuilderSearch } from '@/lib/resume/search';
import {
	buildResumeHref,
	createSearchFromPreset,
	createSearchFromSavedPreset,
	hasMeaningfulBuilderSearch,
	validateBuilderSearch,
} from '@/lib/resume/search';
import {
	readLastUsedResumeState,
	readSavedPresetCollection,
	upsertSavedPreset,
	writeLastUsedResumeState,
} from '@/lib/resume/storage';
import type { RoleTrack, SavedPresetRecord, SavedPresetUi, SectionKey } from '@/lib/resume/types';

const SECTION_LABELS: Record<SectionKey, string> = {
	summary: 'Summary',
	selected_impact: 'Selected impact',
	strengths: 'Strengths',
	experience: 'Experience',
	stack: 'Stack',
	ai_overlay: 'Overlays',
	education: 'Education',
	certifications: 'Certifications',
	references: 'References',
	languages: 'Languages',
};

const ROLE_TRACK_LABELS: Record<RoleTrack, string> = {
	technical_delivery: 'Technical delivery',
	technical_project_management: 'Technical project management',
	integration: 'Integration',
};

export const Route = createFileRoute('/')({
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
	component: BuilderRouteComponent,
});

function BuilderRouteComponent() {
	const runtimeData = Route.useLoaderData() as ResumeRuntimeData;
	const rawSearch = Route.useSearch() as BuilderSearch;
	const navigate = Route.useNavigate();
	const [savedPresets, setSavedPresets] = useState<Array<SavedPresetRecord>>(() =>
		readSavedPresetCollection()
	);
	const [lastUsedState] = useState(() => readLastUsedResumeState());
	const [saveName, setSaveName] = useState('');

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

	const baseBuilderState = useMemo(() => {
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

	const [uiState, setUiState] = useState<SavedPresetUi>(baseBuilderState.ui);

	useEffect(() => {
		setUiState(baseBuilderState.ui);
	}, [baseBuilderState.ui]);

	const builderState = useMemo(
		() => ({ ...baseBuilderState, ui: uiState }),
		[baseBuilderState, uiState]
	);

	useEffect(() => {
		writeLastUsedResumeState(createLastUsedState(builderState));
	}, [builderState]);

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

	const builtInPreset = useMemo(
		() => findBuiltinPreset(runtimeData.presetCatalog, builderState.builtinPresetId),
		[builderState.builtinPresetId, runtimeData.presetCatalog]
	);

	const document = useMemo(
		() =>
			composeResumeDocument({
				modules: runtimeData.modules,
				preset: builderState.preset,
			}),
		[builderState.preset, runtimeData.modules]
	);

	const overlayOptions = runtimeData.modules.overlays?.items ?? [];
	const swFallbackNotice = rawSearch.language !== runtimeData.language;

	function getCharacterHint(items: Array<string>): string {
		const total = items.reduce((sum, item) => sum + item.length, 0);
		return `${items.length} items • ${total} characters`;
	}

	function updateSearch(next: BuilderSearch) {
		navigate({ search: next });
	}

	function toggleSectionVisibility(sectionKey: SectionKey) {
		setUiState((previous) => {
			const nextVisibility = { ...previous.section_visibility };
			if (nextVisibility[sectionKey] === false) {
				delete nextVisibility[sectionKey];
			} else {
				nextVisibility[sectionKey] = false;
			}

			return {
				section_visibility: nextVisibility,
			};
		});
	}

	function handleSavePreset() {
		const name = saveName.trim() || `${builderState.label} copy`;
		const record = createSavedPresetRecord({
			name,
			state: builderState,
		});
		const nextSavedPresets = upsertSavedPreset(record);
		setSavedPresets(nextSavedPresets);
		setSaveName('');
		updateSearch(createSearchFromSavedPreset(record));
	}

	return (
		<div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6">
			<div className="mx-auto grid max-w-[1500px] gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
				<aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
					<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
						<p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
							Modular Resume Composer
						</p>
						<h1 className="mt-2 text-3xl font-semibold text-slate-950">
							Build, tailor, and export resume variants
						</h1>
						<p className="mt-3 text-sm leading-6 text-slate-600">
							Use built-in presets or local saved variants, keep the top-level state in the URL, and
							print the current composition as a PDF.
						</p>
						<div className="mt-4 flex flex-wrap gap-2">
							<ActionLink href={buildResumeHref('/preview', activeSearch)}>
								Open print preview
							</ActionLink>
							<ActionLink href={buildResumeHref('/presets', search)} variant="secondary">
								Manage presets
							</ActionLink>
						</div>
						<div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
							<span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
								Source: {runtimeData.sources.dataset}
							</span>
							<span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
								Mode: {builderState.source}
							</span>
						</div>
						{swFallbackNotice ? (
							<div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
								Swedish data is not available yet, so the app loaded the English dataset as a
								fallback.
							</div>
						) : null}
					</div>

					<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
						<div className="space-y-4">
							<label className="block space-y-2 text-sm">
								<span className="font-medium text-slate-900">Built-in preset</span>
								<select
									className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
									value={builderState.builtinPresetId ?? runtimeData.activePresetId}
									onChange={(event) => {
										const preset = findBuiltinPreset(runtimeData.presetCatalog, event.target.value);
										updateSearch(
											createSearchFromPreset({
												presetId: preset.id,
												preset,
											})
										);
									}}
								>
									{runtimeData.presetCatalog.map((preset) => (
										<option key={preset.id} value={preset.id}>
											{preset.id}
										</option>
									))}
								</select>
							</label>

							<label className="block space-y-2 text-sm">
								<span className="font-medium text-slate-900">Saved preset</span>
								<select
									className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
									value={builderState.savedPresetId ?? ''}
									onChange={(event) => {
										const value = event.target.value;
										if (!value) {
											updateSearch(
												createSearchFromPreset({
													presetId: builtInPreset.id,
													preset: builtInPreset,
												})
											);
											return;
										}

										const record = savedPresets.find((item) => item.id === value);
										if (record) {
											updateSearch(createSearchFromSavedPreset(record));
										}
									}}
								>
									<option value="">None</option>
									{savedPresets.map((record) => (
										<option key={record.id} value={record.id}>
											{record.name}
										</option>
									))}
								</select>
							</label>

							<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
								<label className="block space-y-2 text-sm">
									<span className="font-medium text-slate-900">Language</span>
									<select
										className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
										value={activeSearch.language}
										onChange={(event) =>
											updateSearch({
												...activeSearch,
												language: event.target.value as BuilderSearch['language'],
											})
										}
									>
										<option value="en">English</option>
										<option value="sv">Swedish</option>
									</select>
								</label>

								<label className="block space-y-2 text-sm">
									<span className="font-medium text-slate-900">Role track</span>
									<select
										className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
										value={activeSearch.roleTrack}
										onChange={(event) =>
											updateSearch({
												...activeSearch,
												roleTrack: event.target.value as RoleTrack,
											})
										}
									>
										{ROLE_TRACKS.map((track) => (
											<option key={track} value={track}>
												{ROLE_TRACK_LABELS[track]}
											</option>
										))}
									</select>
								</label>
							</div>
						</div>

						<div className="mt-6 space-y-3 border-t border-slate-200 pt-6">
							<p className="text-sm font-medium text-slate-900">Overlays</p>
							{overlayOptions.length === 0 ? (
								<p className="text-sm text-slate-500">No overlays available for this dataset.</p>
							) : (
								<div className="space-y-2">
									{overlayOptions.map((overlay) => {
										const checked = activeSearch.overlays.includes(overlay.id);
										return (
											<label
												key={overlay.id}
												className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700"
												title={getCharacterHint(overlay.items)}
											>
												<input
													type="checkbox"
													checked={checked}
													onChange={() =>
														updateSearch({
															...activeSearch,
															overlays: checked
																? activeSearch.overlays.filter((item) => item !== overlay.id)
																: [...activeSearch.overlays, overlay.id],
														})
													}
												/>
												<span>
													<span className="block font-medium text-slate-900">
														{overlay.title ?? overlay.id}
													</span>
													<span className="block text-xs text-slate-500">{overlay.id}</span>
												</span>
											</label>
										);
									})}
								</div>
							)}
						</div>

						<div className="mt-6 space-y-3 border-t border-slate-200 pt-6">
							<p className="text-sm font-medium text-slate-900">Hidden sections</p>
							<div className="space-y-2">
								{SECTION_KEYS.map((sectionKey) => {
									const visible = builderState.ui.section_visibility[sectionKey] !== false;
									return (
										<label
											key={sectionKey}
											className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm"
										>
											<span className="font-medium text-slate-900">
												{SECTION_LABELS[sectionKey]}
											</span>
											<input
												type="checkbox"
												checked={visible}
												onChange={() => toggleSectionVisibility(sectionKey)}
											/>
										</label>
									);
								})}
							</div>
						</div>

						<div className="mt-6 space-y-3 border-t border-slate-200 pt-6">
							<label className="block space-y-2 text-sm">
								<span className="font-medium text-slate-900">Save current variant</span>
								<input
									className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
									placeholder={`${builderState.label} copy`}
									value={saveName}
									onChange={(event) => setSaveName(event.target.value)}
								/>
							</label>
							<div className="flex flex-wrap gap-2">
								<Button onClick={handleSavePreset}>Save locally</Button>
								<Button
									variant="secondary"
									onClick={() => {
										setSaveName('');
										setUiState({ section_visibility: {} });
										updateSearch(
											createSearchFromPreset({
												presetId: builtInPreset.id,
												preset: builtInPreset,
											})
										);
									}}
								>
									Reset to built-in
								</Button>
							</div>
						</div>
					</div>
				</aside>

				<section className="space-y-4">
					<div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 sm:p-6">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
									Current composition
								</p>
								<h2 className="text-2xl font-semibold text-slate-950">{builderState.label}</h2>
								<p className="mt-1 text-sm text-slate-600">
									{builderState.preset.title_line ??
										ROLE_TRACK_LABELS[builderState.preset.role_track]}
								</p>
							</div>
							<div className="text-sm text-slate-600">
								<div>Preset ID: {builderState.preset.id}</div>
								<div>Language: {runtimeData.language.toUpperCase()}</div>
							</div>
						</div>
					</div>
					<ResumeDocument document={document} ui={builderState.ui} />
				</section>
			</div>
		</div>
	);
}
