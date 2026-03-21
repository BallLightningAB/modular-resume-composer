import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { SectionBudgetMetric } from '@/lib/resume/budget';
import { SECTION_KEYS } from '@/lib/resume/schema';
import type {
	BlockCollection,
	BlockItem,
	LoadedResumeModules,
	PresetFile,
	SectionKey,
} from '@/lib/resume/types';
import { cn } from '@/lib/utils';

type EditorTab = 'summary' | 'blocks' | 'experience' | 'preset';
type BlockField =
	| 'impacts_id'
	| 'strengths_id'
	| 'stack_id'
	| 'education_id'
	| 'certifications_id'
	| 'references_id';

type ModuleCollectionKey = Exclude<
	keyof LoadedResumeModules,
	'profile' | 'summaries' | 'experience'
>;

const EDITOR_TABS: Array<{ key: EditorTab; label: string }> = [
	{ key: 'summary', label: 'Summary' },
	{ key: 'blocks', label: 'Blocks' },
	{ key: 'experience', label: 'Experience' },
	{ key: 'preset', label: 'Preset' },
];

const BLOCK_FIELDS: Array<{
	field: BlockField;
	collectionKey: ModuleCollectionKey;
	label: string;
	sectionKey: SectionKey;
}> = [
	{
		field: 'strengths_id',
		collectionKey: 'strengths',
		label: 'Strengths',
		sectionKey: 'strengths',
	},
	{
		field: 'impacts_id',
		collectionKey: 'impacts',
		label: 'Selected impact',
		sectionKey: 'selected_impact',
	},
	{
		field: 'stack_id',
		collectionKey: 'stack',
		label: 'Stack',
		sectionKey: 'stack',
	},
	{
		field: 'education_id',
		collectionKey: 'education',
		label: 'Education',
		sectionKey: 'education',
	},
	{
		field: 'certifications_id',
		collectionKey: 'certifications',
		label: 'Certifications',
		sectionKey: 'certifications',
	},
	{
		field: 'references_id',
		collectionKey: 'references',
		label: 'References',
		sectionKey: 'references',
	},
];

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

const RULE_TAG_FIELDS: Array<{
	key: 'prefer_tags' | 'required_tags' | 'exclude_tags';
	label: string;
}> = [
	{ key: 'prefer_tags', label: 'Prefer tags' },
	{ key: 'required_tags', label: 'Required tags' },
	{ key: 'exclude_tags', label: 'Exclude tags' },
];

function parseLineList(value: string): Array<string> {
	return value
		.split('\n')
		.map((item) => item.trim())
		.filter(Boolean);
}

function parseTagList(value: string): Array<string> {
	return value
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);
}

function updateModuleCollection(
	modules: LoadedResumeModules,
	collectionKey: ModuleCollectionKey,
	itemId: string,
	updater: (item: BlockItem) => BlockItem
): LoadedResumeModules {
	const collection = modules[collectionKey] as BlockCollection | undefined;
	if (!collection) {
		return modules;
	}

	return {
		...modules,
		[collectionKey]: {
			...collection,
			items: collection.items.map((item) => (item.id === itemId ? updater(item) : item)),
		},
	};
}

export function ResumeEditorPanel(props: {
	activeSection: SectionKey | null;
	budgetMetrics: Partial<Record<SectionKey, SectionBudgetMetric>>;
	draftModules: LoadedResumeModules;
	draftPreset: PresetFile;
	onActiveSectionChange: (section: SectionKey | null) => void;
	onModulesChange: (modules: LoadedResumeModules) => void;
	onPresetChange: (preset: PresetFile) => void;
	validationMessages: Array<string>;
}) {
	const {
		activeSection,
		budgetMetrics,
		draftModules,
		draftPreset,
		onActiveSectionChange,
		onModulesChange,
		onPresetChange,
		validationMessages,
	} = props;
	const [editorTab, setEditorTab] = useState<EditorTab>('summary');
	const [blockField, setBlockField] = useState<BlockField>('strengths_id');
	const [selectedExperienceEntryId, setSelectedExperienceEntryId] = useState(
		draftPreset.experience[0]?.entry_id ?? draftModules.experience.entries[0]?.id ?? ''
	);

	const summaryOptions = useMemo(
		() => draftModules.summaries.items.filter((item) => item.language === draftPreset.language),
		[draftModules.summaries.items, draftPreset.language]
	);
	const selectedSummaryId =
		draftPreset.summary_id ??
		summaryOptions.find((item) => item.role_track === draftPreset.role_track)?.id ??
		summaryOptions[0]?.id ??
		'';
	const selectedSummary = summaryOptions.find((item) => item.id === selectedSummaryId);

	const activeBlockConfig =
		BLOCK_FIELDS.find((item) => item.field === blockField) ?? BLOCK_FIELDS[0];
	const activeCollection = draftModules[activeBlockConfig.collectionKey] as
		| BlockCollection
		| undefined;
	const activeBlockOptions =
		activeCollection?.items.filter((item) => item.language === draftPreset.language) ?? [];
	const selectedBlockId =
		draftPreset[activeBlockConfig.field] ??
		activeBlockOptions.find((item) => item.role_track === draftPreset.role_track)?.id ??
		activeBlockOptions[0]?.id ??
		'';
	const selectedBlock = activeBlockOptions.find((item) => item.id === selectedBlockId);

	const selectedOverlayBlocks =
		draftModules.overlays?.items.filter(
			(item) => item.language === draftPreset.language && draftPreset.overlay_ids.includes(item.id)
		) ?? [];

	const experienceEntries = useMemo(
		() =>
			draftModules.experience.entries.filter((entry) => entry.language === draftPreset.language),
		[draftModules.experience.entries, draftPreset.language]
	);
	const selectedExperienceEntry =
		experienceEntries.find((entry) => entry.id === selectedExperienceEntryId) ??
		experienceEntries[0];
	const selectedExperienceRule = draftPreset.experience.find(
		(rule) => rule.entry_id === selectedExperienceEntry?.id
	);

	useEffect(() => {
		if (!selectedExperienceEntry?.id) {
			return;
		}
		if (selectedExperienceEntryId !== selectedExperienceEntry.id) {
			setSelectedExperienceEntryId(selectedExperienceEntry.id);
		}
	}, [selectedExperienceEntry?.id, selectedExperienceEntryId]);

	useEffect(() => {
		if (editorTab === 'summary') {
			onActiveSectionChange('summary');
			return;
		}
		if (editorTab === 'blocks') {
			onActiveSectionChange(activeBlockConfig.sectionKey);
			return;
		}
		if (editorTab === 'experience') {
			onActiveSectionChange('experience');
			return;
		}
		onActiveSectionChange(activeSection);
	}, [activeBlockConfig.sectionKey, activeSection, editorTab, onActiveSectionChange]);

	function updatePreset<K extends keyof PresetFile>(field: K, value: PresetFile[K]) {
		onPresetChange({ ...draftPreset, [field]: value });
	}

	function updateExperienceRuleTags(
		entryId: string,
		field: (typeof RULE_TAG_FIELDS)[number]['key'],
		value: string
	) {
		updatePreset(
			'experience',
			draftPreset.experience.map((rule) =>
				rule.entry_id === entryId
					? {
							...rule,
							[field]: parseTagList(value),
						}
					: rule
			)
		);
	}

	function moveSection(sectionKey: SectionKey, direction: -1 | 1) {
		const currentIndex = draftPreset.section_order.indexOf(sectionKey);
		const nextIndex = currentIndex + direction;
		if (currentIndex < 0 || nextIndex < 0 || nextIndex >= draftPreset.section_order.length) {
			return;
		}

		const nextOrder = [...draftPreset.section_order];
		const [section] = nextOrder.splice(currentIndex, 1);
		nextOrder.splice(nextIndex, 0, section);
		updatePreset('section_order', nextOrder);
	}

	return (
		<div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 sm:p-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
						Edit content
					</p>
					<h2 className="mt-1 text-2xl font-semibold text-slate-950">In-app editor</h2>
					<p className="mt-1 text-sm text-slate-600">
						Change module content locally while keeping preset-driven composition and print-safe
						structure.
					</p>
				</div>
				<div className="grid grid-cols-2 gap-2 sm:min-w-[250px]">
					{draftPreset.section_order.map((sectionKey) => {
						const metric = budgetMetrics[sectionKey];
						return (
							<button
								key={sectionKey}
								type="button"
								onClick={() => onActiveSectionChange(sectionKey)}
								className={cn(
									'rounded-2xl border px-3 py-2 text-left text-xs transition-colors',
									activeSection === sectionKey
										? 'border-sky-300 bg-sky-50 text-sky-900'
										: 'border-slate-200 bg-slate-50 text-slate-700'
								)}
							>
								<div className="font-medium">{SECTION_LABELS[sectionKey]}</div>
								{metric ? (
									<div
										className={cn(
											'mt-1 tabular-nums',
											metric.status === 'over' && 'text-red-700',
											metric.status === 'warning' && 'text-amber-700'
										)}
									>
										{metric.used}/{metric.max}
									</div>
								) : null}
							</button>
						);
					})}
				</div>
			</div>

			{validationMessages.length > 0 ? (
				<div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
					<p className="font-medium">Validation checks</p>
					<ul className="mt-2 space-y-1">
						{validationMessages.map((message) => (
							<li key={message}>{message}</li>
						))}
					</ul>
				</div>
			) : (
				<div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
					All current draft checks pass.
				</div>
			)}

			<div className="mt-4 flex flex-wrap gap-2">
				{EDITOR_TABS.map((tab) => (
					<Button
						key={tab.key}
						variant={editorTab === tab.key ? 'default' : 'secondary'}
						onClick={() => setEditorTab(tab.key)}
					>
						{tab.label}
					</Button>
				))}
			</div>

			{editorTab === 'summary' ? (
				<div className="mt-6 space-y-4">
					<label className="block space-y-2 text-sm">
						<span className="font-medium text-slate-900">Selected summary</span>
						<select
							className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
							value={selectedSummaryId}
							onChange={(event) => updatePreset('summary_id', event.target.value || undefined)}
						>
							{summaryOptions.map((item) => (
								<option key={item.id} value={item.id}>
									{item.id}
								</option>
							))}
						</select>
					</label>
					<label className="block space-y-2 text-sm">
						<span className="font-medium text-slate-900">Summary text</span>
						<textarea
							className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
							value={selectedSummary?.text ?? ''}
							onChange={(event) => {
								if (!selectedSummaryId) {
									return;
								}
								onModulesChange({
									...draftModules,
									summaries: {
										...draftModules.summaries,
										items: draftModules.summaries.items.map((item) =>
											item.id === selectedSummaryId ? { ...item, text: event.target.value } : item
										),
									},
								});
							}}
						/>
					</label>
				</div>
			) : null}

			{editorTab === 'blocks' ? (
				<div className="mt-6 space-y-5">
					<div className="flex flex-wrap gap-2">
						{BLOCK_FIELDS.map((item) => (
							<Button
								key={item.field}
								variant={blockField === item.field ? 'default' : 'secondary'}
								size="sm"
								onClick={() => setBlockField(item.field)}
							>
								{item.label}
							</Button>
						))}
						<Button
							variant={
								blockField === 'strengths_id' && selectedOverlayBlocks.length > 0
									? 'secondary'
									: 'secondary'
							}
							size="sm"
							onClick={() => onActiveSectionChange('ai_overlay')}
						>
							Selected overlays
						</Button>
					</div>

					<label className="block space-y-2 text-sm">
						<span className="font-medium text-slate-900">
							Selected {activeBlockConfig.label.toLowerCase()} block
						</span>
						<select
							className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
							value={selectedBlockId}
							onChange={(event) =>
								updatePreset(activeBlockConfig.field, event.target.value || undefined)
							}
						>
							{activeBlockOptions.map((item) => (
								<option key={item.id} value={item.id}>
									{item.id}
								</option>
							))}
						</select>
					</label>

					{selectedBlock ? (
						<div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
							<label className="block space-y-2 text-sm">
								<span className="font-medium text-slate-900">Block title</span>
								<input
									className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
									value={selectedBlock.title ?? ''}
									onChange={(event) =>
										onModulesChange(
											updateModuleCollection(
												draftModules,
												activeBlockConfig.collectionKey,
												selectedBlock.id,
												(item) => ({ ...item, title: event.target.value || undefined })
											)
										)
									}
								/>
							</label>
							<label className="block space-y-2 text-sm">
								<span className="font-medium text-slate-900">Items</span>
								<textarea
									className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
									value={selectedBlock.items.join('\n')}
									onChange={(event) =>
										onModulesChange(
											updateModuleCollection(
												draftModules,
												activeBlockConfig.collectionKey,
												selectedBlock.id,
												(item) => ({ ...item, items: parseLineList(event.target.value) })
											)
										)
									}
								/>
							</label>
						</div>
					) : (
						<p className="text-sm text-slate-500">No block is available for this language.</p>
					)}

					{selectedOverlayBlocks.length > 0 ? (
						<div className="space-y-4 border-t border-slate-200 pt-5">
							<p className="text-sm font-medium text-slate-900">Selected overlays</p>
							{selectedOverlayBlocks.map((overlay) => (
								<div
									key={overlay.id}
									className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
								>
									<div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
										{overlay.id}
									</div>
									<label className="block space-y-2 text-sm">
										<span className="font-medium text-slate-900">Overlay title</span>
										<input
											className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
											value={overlay.title ?? ''}
											onChange={(event) =>
												onModulesChange(
													updateModuleCollection(draftModules, 'overlays', overlay.id, (item) => ({
														...item,
														title: event.target.value || undefined,
													}))
												)
											}
										/>
									</label>
									<label className="block space-y-2 text-sm">
										<span className="font-medium text-slate-900">Overlay items</span>
										<textarea
											className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
											value={overlay.items.join('\n')}
											onChange={(event) =>
												onModulesChange(
													updateModuleCollection(draftModules, 'overlays', overlay.id, (item) => ({
														...item,
														items: parseLineList(event.target.value),
													}))
												)
											}
										/>
									</label>
								</div>
							))}
						</div>
					) : null}
				</div>
			) : null}

			{editorTab === 'experience' ? (
				<div className="mt-6 space-y-4">
					<label className="block space-y-2 text-sm">
						<span className="font-medium text-slate-900">Experience entry</span>
						<select
							className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
							value={selectedExperienceEntry?.id ?? ''}
							onChange={(event) => setSelectedExperienceEntryId(event.target.value)}
						>
							{experienceEntries.map((entry) => (
								<option key={entry.id} value={entry.id}>
									{entry.company} — {entry.role}
								</option>
							))}
						</select>
					</label>

					{selectedExperienceEntry ? (
						<div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
							<div className="grid gap-4 sm:grid-cols-2">
								{[
									{ key: 'company', label: 'Company' },
									{ key: 'role', label: 'Role' },
									{ key: 'dates', label: 'Dates' },
									{ key: 'location', label: 'Location' },
									{ key: 'subtitle', label: 'Subtitle' },
								].map((field) => (
									<label key={field.key} className="block space-y-2 text-sm">
										<span className="font-medium text-slate-900">{field.label}</span>
										<input
											className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
											value={String(
												selectedExperienceEntry[
													field.key as keyof typeof selectedExperienceEntry
												] ?? ''
											)}
											onChange={(event) =>
												onModulesChange({
													...draftModules,
													experience: {
														...draftModules.experience,
														entries: draftModules.experience.entries.map((entry) =>
															entry.id === selectedExperienceEntry.id
																? { ...entry, [field.key]: event.target.value || undefined }
																: entry
														),
													},
												})
											}
										/>
									</label>
								))}
							</div>

							<div className="space-y-3 border-t border-slate-200 pt-4">
								<div className="flex items-center justify-between gap-3">
									<p className="text-sm font-medium text-slate-900">Bullets</p>
									<Button
										size="sm"
										variant="secondary"
										onClick={() =>
											onModulesChange({
												...draftModules,
												experience: {
													...draftModules.experience,
													entries: draftModules.experience.entries.map((entry) =>
														entry.id === selectedExperienceEntry.id
															? {
																	...entry,
																	bullets: [
																		...entry.bullets,
																		{
																			id: `${entry.id}-bullet-${entry.bullets.length + 1}`,
																			text: '',
																			tags: [],
																			priority: 0,
																		},
																	],
																}
															: entry
													),
												},
											})
										}
									>
										Add bullet
									</Button>
								</div>
								{selectedExperienceEntry.bullets.map((bullet) => {
									const isForced =
										selectedExperienceRule?.force_bullet_ids.includes(bullet.id) ?? false;
									return (
										<div
											key={bullet.id}
											className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4"
										>
											<div className="flex items-center justify-between gap-3">
												<div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
													{bullet.id}
												</div>
												<div className="flex flex-wrap gap-2">
													<Button
														size="sm"
														variant={isForced ? 'default' : 'secondary'}
														onClick={() => {
															if (!selectedExperienceRule) {
																return;
															}
															updatePreset(
																'experience',
																draftPreset.experience.map((rule) =>
																	rule.entry_id === selectedExperienceEntry.id
																		? {
																				...rule,
																				force_bullet_ids: isForced
																					? rule.force_bullet_ids.filter(
																							(item) => item !== bullet.id
																						)
																					: [...rule.force_bullet_ids, bullet.id],
																			}
																		: rule
																)
															);
														}}
													>
														{isForced ? 'Forced' : 'Pin'}
													</Button>
													<Button
														size="sm"
														variant="ghost"
														onClick={() =>
															onModulesChange({
																...draftModules,
																experience: {
																	...draftModules.experience,
																	entries: draftModules.experience.entries.map((entry) =>
																		entry.id === selectedExperienceEntry.id
																			? {
																					...entry,
																					bullets: entry.bullets.filter(
																						(item) => item.id !== bullet.id
																					),
																				}
																			: entry
																	),
																},
															})
														}
													>
														Remove
													</Button>
												</div>
											</div>
											<label className="block space-y-2 text-sm">
												<span className="font-medium text-slate-900">Bullet text</span>
												<textarea
													className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
													value={bullet.text}
													onChange={(event) =>
														onModulesChange({
															...draftModules,
															experience: {
																...draftModules.experience,
																entries: draftModules.experience.entries.map((entry) =>
																	entry.id === selectedExperienceEntry.id
																		? {
																				...entry,
																				bullets: entry.bullets.map((item) =>
																					item.id === bullet.id
																						? { ...item, text: event.target.value }
																						: item
																				),
																			}
																		: entry
																),
															},
														})
													}
												/>
											</label>
											<div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px]">
												<label className="block space-y-2 text-sm">
													<span className="font-medium text-slate-900">Tags</span>
													<input
														className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
														value={bullet.tags.join(', ')}
														onChange={(event) =>
															onModulesChange({
																...draftModules,
																experience: {
																	...draftModules.experience,
																	entries: draftModules.experience.entries.map((entry) =>
																		entry.id === selectedExperienceEntry.id
																			? {
																					...entry,
																					bullets: entry.bullets.map((item) =>
																						item.id === bullet.id
																							? { ...item, tags: parseTagList(event.target.value) }
																							: item
																					),
																				}
																			: entry
																	),
																},
															})
														}
													/>
												</label>
												<label className="block space-y-2 text-sm">
													<span className="font-medium text-slate-900">Priority</span>
													<input
														type="number"
														className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
														value={bullet.priority}
														onChange={(event) =>
															onModulesChange({
																...draftModules,
																experience: {
																	...draftModules.experience,
																	entries: draftModules.experience.entries.map((entry) =>
																		entry.id === selectedExperienceEntry.id
																			? {
																					...entry,
																					bullets: entry.bullets.map((item) =>
																						item.id === bullet.id
																							? {
																									...item,
																									priority: Number(event.target.value) || 0,
																								}
																							: item
																					),
																				}
																			: entry
																	),
																},
															})
														}
													/>
												</label>
											</div>
										</div>
									);
								})}
							</div>

							<div className="space-y-3 border-t border-slate-200 pt-4">
								<div className="flex items-center justify-between gap-3">
									<p className="text-sm font-medium text-slate-900">Rule controls</p>
									{selectedExperienceRule ? null : (
										<Button
											size="sm"
											variant="secondary"
											onClick={() =>
												updatePreset('experience', [
													...draftPreset.experience,
													{
														entry_id: selectedExperienceEntry.id,
														max_bullets: Math.min(selectedExperienceEntry.bullets.length || 1, 4),
														prefer_tags: [],
														required_tags: [],
														exclude_tags: [],
														force_bullet_ids: [],
													},
												])
											}
										>
											Add to preset
										</Button>
									)}
								</div>
								{selectedExperienceRule ? (
									<div className="grid gap-4 sm:grid-cols-2">
										<label className="block space-y-2 text-sm">
											<span className="font-medium text-slate-900">Max bullets</span>
											<input
												type="number"
												className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
												value={selectedExperienceRule.max_bullets}
												onChange={(event) =>
													updatePreset(
														'experience',
														draftPreset.experience.map((rule) =>
															rule.entry_id === selectedExperienceEntry.id
																? {
																		...rule,
																		max_bullets: Math.max(1, Number(event.target.value) || 1),
																	}
																: rule
														)
													)
												}
											/>
										</label>
										{RULE_TAG_FIELDS.map((field) => (
											<label key={field.key} className="block space-y-2 text-sm sm:col-span-2">
												<span className="font-medium text-slate-900">{field.label}</span>
												<input
													className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
													value={(selectedExperienceRule[field.key] as Array<string>).join(', ')}
													onChange={(event) =>
														updateExperienceRuleTags(
															selectedExperienceEntry.id,
															field.key,
															event.target.value
														)
													}
												/>
											</label>
										))}
									</div>
								) : (
									<p className="text-sm text-slate-500">
										This entry is editable in the module data but is not currently part of the
										active preset.
									</p>
								)}
							</div>
						</div>
					) : (
						<p className="text-sm text-slate-500">
							No experience entries are available for this language.
						</p>
					)}
				</div>
			) : null}

			{editorTab === 'preset' ? (
				<div className="mt-6 space-y-4">
					<label className="block space-y-2 text-sm">
						<span className="font-medium text-slate-900">Title line override</span>
						<input
							className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
							value={draftPreset.title_line ?? ''}
							onChange={(event) => updatePreset('title_line', event.target.value || undefined)}
						/>
					</label>
					<div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
						<p className="text-sm font-medium text-slate-900">Section order</p>
						<div className="space-y-2">
							{draftPreset.section_order.map((sectionKey, index) => (
								<div
									key={sectionKey}
									className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm"
								>
									<span className="font-medium text-slate-900">{SECTION_LABELS[sectionKey]}</span>
									<div className="flex gap-2">
										<Button
											size="sm"
											variant="secondary"
											disabled={index === 0}
											onClick={() => moveSection(sectionKey, -1)}
										>
											Up
										</Button>
										<Button
											size="sm"
											variant="secondary"
											disabled={index === draftPreset.section_order.length - 1}
											onClick={() => moveSection(sectionKey, 1)}
										>
											Down
										</Button>
									</div>
								</div>
							))}
						</div>
					</div>
					<div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
						<p className="text-sm font-medium text-slate-900">Available sections</p>
						<div className="flex flex-wrap gap-2">
							{SECTION_KEYS.filter(
								(sectionKey) => !draftPreset.section_order.includes(sectionKey)
							).map((sectionKey) => (
								<Button
									key={sectionKey}
									size="sm"
									variant="secondary"
									onClick={() =>
										updatePreset('section_order', [...draftPreset.section_order, sectionKey])
									}
								>
									Add {SECTION_LABELS[sectionKey]}
								</Button>
							))}
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
