import { createServerFn } from '@tanstack/react-start';
import { parse } from 'yaml';
import { z } from 'zod';
import {
	BlockCollectionSchema,
	ExperienceFileSchema,
	LanguageCodeSchema,
	LoadedResumeModulesSchema,
	PresetFileSchema,
	ProfileFileSchema,
	SummariesFileSchema,
} from './schema';
import type { LanguageCode, LoadedResumeModules, PresetFile } from './types';

type ContentSource = 'private' | 'examples';

type RequiredModuleKey = 'profile' | 'summaries' | 'strengths' | 'impacts' | 'experience';

type OptionalModuleKey = 'overlays' | 'references' | 'education' | 'certifications' | 'stack';

type ModuleSourceMap = Partial<Record<RequiredModuleKey | OptionalModuleKey, ContentSource>>;

export interface ResumeRuntimeData {
	language: LanguageCode;
	modules: LoadedResumeModules;
	presetCatalog: Array<PresetFile>;
	activePresetId: string;
	sources: {
		dataset: 'private' | 'examples' | 'mixed';
		modules: ModuleSourceMap;
		presets: Record<string, ContentSource>;
	};
}

const ResumeLoadRequestSchema = z.object({
	language: LanguageCodeSchema,
	preferredPresetId: z.string().optional(),
});

async function getFs() {
	const module = await import('node:fs');
	return module.promises;
}

async function getPathModule() {
	return import('node:path');
}

async function getDataRoots(): Promise<Array<{ kind: ContentSource; root: string }>> {
	const path = await getPathModule();
	return [
		{ kind: 'private', root: path.join(process.cwd(), 'data', 'private') },
		{ kind: 'examples', root: path.join(process.cwd(), 'data', 'examples') },
	];
}

const requiredModulePaths: Record<RequiredModuleKey, (language: LanguageCode) => string> = {
	profile: (language) => `profile/profile.${language}.yaml`,
	summaries: (language) => `modules/summaries.${language}.yaml`,
	strengths: (language) => `modules/strengths.${language}.yaml`,
	impacts: (language) => `modules/impacts.${language}.yaml`,
	experience: (language) => `modules/experience.${language}.yaml`,
};

const optionalModulePaths: Record<OptionalModuleKey, (language: LanguageCode) => string> = {
	overlays: (language) => `modules/overlays.${language}.yaml`,
	references: (language) => `modules/references.${language}.yaml`,
	education: (language) => `modules/education.${language}.yaml`,
	certifications: (language) => `modules/certifications.${language}.yaml`,
	stack: (language) => `modules/stack.${language}.yaml`,
};

const requiredModuleSchemas: Record<RequiredModuleKey, z.ZodTypeAny> = {
	profile: ProfileFileSchema,
	summaries: SummariesFileSchema,
	strengths: BlockCollectionSchema,
	impacts: BlockCollectionSchema,
	experience: ExperienceFileSchema,
};

const optionalModuleSchemas: Record<OptionalModuleKey, z.ZodTypeAny> = {
	overlays: BlockCollectionSchema,
	references: BlockCollectionSchema,
	education: BlockCollectionSchema,
	certifications: BlockCollectionSchema,
	stack: BlockCollectionSchema,
};

async function fileExists(filePath: string): Promise<boolean> {
	try {
		const fs = await getFs();
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

async function readYamlFromSources<T>(params: {
	relativePath: string;
	schema: z.ZodType<T>;
	optional?: boolean;
}): Promise<{ value: T | undefined; source?: ContentSource }> {
	const fs = await getFs();
	const path = await getPathModule();
	const dataRoots = await getDataRoots();
	let lastError: unknown;

	for (const root of dataRoots) {
		const absolutePath = path.join(root.root, params.relativePath);
		if (!(await fileExists(absolutePath))) {
			continue;
		}

		try {
			const raw = await fs.readFile(absolutePath, 'utf8');
			const parsed = parse(raw);
			return {
				value: params.schema.parse(parsed),
				source: root.kind,
			};
		} catch (error) {
			lastError = error;
		}
	}

	if (params.optional) {
		return { value: undefined };
	}

	if (lastError instanceof Error) {
		throw new Error(`Unable to load valid resume data file: ${params.relativePath}`, {
			cause: lastError,
		});
	}

	throw new Error(`Missing required resume data file: ${params.relativePath}`);
}

async function loadModules(language: LanguageCode): Promise<{
	modules: LoadedResumeModules;
	sources: ModuleSourceMap;
}> {
	const requiredEntries = await Promise.all(
		Object.entries(requiredModulePaths).map(async ([key, toRelativePath]) => {
			const loaded = await readYamlFromSources({
				relativePath: toRelativePath(language),
				schema: requiredModuleSchemas[key as RequiredModuleKey],
			});

			return [key, loaded] as const;
		})
	);

	const optionalEntries = await Promise.all(
		Object.entries(optionalModulePaths).map(async ([key, toRelativePath]) => {
			const loaded = await readYamlFromSources({
				relativePath: toRelativePath(language),
				schema: optionalModuleSchemas[key as OptionalModuleKey],
				optional: true,
			});

			return [key, loaded] as const;
		})
	);

	const sourceMap: ModuleSourceMap = {};
	const assembledModules: Record<string, unknown> = {};

	for (const [key, loaded] of [...requiredEntries, ...optionalEntries]) {
		if (loaded.source) {
			sourceMap[key as keyof ModuleSourceMap] = loaded.source;
		}
		if (loaded.value !== undefined) {
			assembledModules[key] = loaded.value;
		}
	}

	return {
		modules: LoadedResumeModulesSchema.parse(assembledModules),
		sources: sourceMap,
	};
}

async function loadPresetCatalog(language: LanguageCode): Promise<{
	presets: Array<PresetFile>;
	sources: Record<string, ContentSource>;
}> {
	const catalog = new Map<string, { preset: PresetFile; source: ContentSource }>();
	const fs = await getFs();
	const path = await getPathModule();
	const dataRoots = await getDataRoots();

	for (const root of [...dataRoots].reverse()) {
		const presetDirectory = path.join(root.root, 'presets');
		const entries = await fs.readdir(presetDirectory, { withFileTypes: true }).catch(() => []);

		for (const entry of entries) {
			if (!entry.isFile() || !entry.name.endsWith(`.${language}.yaml`)) {
				continue;
			}

			const raw = await fs.readFile(path.join(presetDirectory, entry.name), 'utf8');
			const preset = PresetFileSchema.parse(parse(raw));
			catalog.set(preset.id, { preset, source: root.kind });
		}
	}

	const presets = Array.from(catalog.values())
		.map((item) => item.preset)
		.sort((left, right) => left.id.localeCompare(right.id));

	if (presets.length === 0) {
		throw new Error(`No resume presets were found for language ${language}.`);
	}

	return {
		presets,
		sources: Object.fromEntries(
			Array.from(catalog.entries()).map(([id, item]) => [id, item.source])
		),
	};
}

function resolveDatasetSource(params: {
	modules: ModuleSourceMap;
	presets: Record<string, ContentSource>;
}): 'private' | 'examples' | 'mixed' {
	const seen = new Set<ContentSource>();

	for (const value of Object.values(params.modules)) {
		if (value) {
			seen.add(value);
		}
	}

	for (const value of Object.values(params.presets)) {
		seen.add(value);
	}

	if (seen.size === 0 || seen.size > 1) {
		return seen.size <= 1 ? 'examples' : 'mixed';
	}

	return Array.from(seen)[0];
}

async function loadRuntimeForLanguage(params: {
	language: LanguageCode;
	preferredPresetId?: string;
}): Promise<ResumeRuntimeData> {
	const [modulesResult, presetResult] = await Promise.all([
		loadModules(params.language),
		loadPresetCatalog(params.language),
	]);

	const activePresetId =
		params.preferredPresetId &&
		presetResult.presets.some((preset) => preset.id === params.preferredPresetId)
			? params.preferredPresetId
			: presetResult.presets[0].id;

	return {
		language: params.language,
		modules: modulesResult.modules,
		presetCatalog: presetResult.presets,
		activePresetId,
		sources: {
			dataset: resolveDatasetSource({
				modules: modulesResult.sources,
				presets: presetResult.sources,
			}),
			modules: modulesResult.sources,
			presets: presetResult.sources,
		},
	};
}

export async function loadResumeRuntimeDataImplementation(
	input: z.infer<typeof ResumeLoadRequestSchema>
): Promise<ResumeRuntimeData> {
	try {
		return await loadRuntimeForLanguage({
			language: input.language,
			preferredPresetId: input.preferredPresetId,
		});
	} catch (error) {
		if (input.language === 'en') {
			throw error;
		}

		return loadRuntimeForLanguage({
			language: 'en',
			preferredPresetId: input.preferredPresetId,
		});
	}
}

export const loadResumeRuntimeData = createServerFn({ method: 'GET' })
	.inputValidator((input: unknown) => ResumeLoadRequestSchema.parse(input))
	.handler(async ({ data }) => loadResumeRuntimeDataImplementation(data));
