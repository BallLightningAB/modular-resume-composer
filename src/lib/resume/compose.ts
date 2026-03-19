import type {
  BlockCollection,
  ComposeInput,
  ComposedResumeDocument,
  ComposedExperienceEntry,
  ExperienceEntry,
  ExperienceRule,
  RoleTrack,
} from "./types";

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

function hasAnyTag(tags: string[], wanted: string[]): boolean {
  if (wanted.length === 0) return true;
  const normalized = new Set(tags.map(normalizeTag));
  return wanted.some((tag) => normalized.has(normalizeTag(tag)));
}

function hasAllTags(tags: string[], required: string[]): boolean {
  if (required.length === 0) return true;
  const normalized = new Set(tags.map(normalizeTag));
  return required.every((tag) => normalized.has(normalizeTag(tag)));
}

function matchesLanguage<T extends { language: string }>(items: T[], language: string): T[] {
  return items.filter((item) => item.language === language);
}

function resolveSummaryText(params: {
  summaries: ComposeResumeInput["modules"]["summaries"];
  language: string;
  roleTrack: RoleTrack;
  summaryId?: string;
}): string | undefined {
  const { summaries, language, roleTrack, summaryId } = params;

  if (summaryId) {
    return summaries.items.find((item) => item.id === summaryId && item.language === language)?.text;
  }

  return summaries.items.find(
    (item) => item.language === language && item.role_track === roleTrack,
  )?.text;
}

function resolveBlock(params: {
  collection?: BlockCollection;
  language: string;
  roleTrack: RoleTrack;
  blockId?: string;
}) {
  const { collection, language, roleTrack, blockId } = params;
  if (!collection) return undefined;

  if (blockId) {
    return collection.items.find((item) => item.id === blockId && item.language === language);
  }

  const exactMatch = collection.items.find(
    (item) => item.language === language && item.role_track === roleTrack,
  );
  if (exactMatch) return exactMatch;

  return collection.items.find(
    (item) => item.language === language && item.role_track === undefined,
  );
}

function scoreBullet(params: {
  bulletTags: string[];
  rule: ExperienceRule;
  roleTrack: RoleTrack;
}): number {
  const { bulletTags, rule, roleTrack } = params;
  const normalized = bulletTags.map(normalizeTag);

  let score = 0;

  if (normalized.includes(normalizeTag(roleTrack))) score += 100;

  for (const tag of rule.prefer_tags) {
    if (normalized.includes(normalizeTag(tag))) score += 25;
  }

  for (const tag of rule.required_tags) {
    if (normalized.includes(normalizeTag(tag))) score += 10;
  }

  return score;
}

function selectBullets(entry: ExperienceEntry, rule: ExperienceRule, roleTrack: RoleTrack): string[] {
  const forced = entry.bullets.filter((bullet) => rule.force_bullet_ids.includes(bullet.id));

  const candidates = entry.bullets
    .filter((bullet) => !rule.force_bullet_ids.includes(bullet.id))
    .filter((bullet) => !hasAnyTag(bullet.tags, rule.exclude_tags))
    .filter((bullet) => hasAllTags(bullet.tags, rule.required_tags))
    .map((bullet) => ({
      bullet,
      score:
        scoreBullet({
          bulletTags: bullet.tags,
          rule,
          roleTrack,
        }) + bullet.priority,
    }))
    .sort((a, b) => b.score - a.score);

  const maxBullets = Math.max(rule.max_bullets - forced.length, 0);
  const selected = candidates.slice(0, maxBullets).map((item) => item.bullet);

  return [...forced, ...selected].map((bullet) => bullet.text);
}

function composeExperience(params: {
  entries: ExperienceEntry[];
  rules: ExperienceRule[];
  language: string;
  roleTrack: RoleTrack;
}): ComposedExperienceEntry[] {
  const { entries, rules, language, roleTrack } = params;
  const entriesForLanguage = matchesLanguage(entries, language);

  return rules
    .map((rule) => {
      const entry = entriesForLanguage.find((item) => item.id === rule.entry_id);
      if (!entry) return undefined;

      return {
        id: entry.id,
        company: entry.company,
        role: entry.role,
        dates: entry.dates,
        location: entry.location,
        subtitle: entry.subtitle,
        bullets: selectBullets(entry, rule, roleTrack),
      } satisfies ComposedExperienceEntry;
    })
    .filter((item): item is ComposedExperienceEntry => Boolean(item));
}

export function composeResumeDocument(input: ComposeResumeInput): ComposedResumeDocument {
  const { modules, preset } = input;
  const { profile, summaries, strengths, impacts, experience, overlays, education, certifications, stack } =
    modules;

  const summary = resolveSummaryText({
    summaries,
    language: preset.language,
    roleTrack: preset.role_track,
    summaryId: preset.summary_id,
  });

  const impactBlock = resolveBlock({
    collection: impacts,
    language: preset.language,
    roleTrack: preset.role_track,
    blockId: preset.impacts_id,
  });

  const strengthsBlock = resolveBlock({
    collection: strengths,
    language: preset.language,
    roleTrack: preset.role_track,
    blockId: preset.strengths_id,
  });

  const educationBlock = resolveBlock({
    collection: education,
    language: preset.language,
    roleTrack: preset.role_track,
    blockId: preset.education_id,
  });

  const certificationsBlock = resolveBlock({
    collection: certifications,
    language: preset.language,
    roleTrack: preset.role_track,
    blockId: preset.certifications_id,
  });

  const stackBlock = resolveBlock({
    collection: stack,
    language: preset.language,
    roleTrack: preset.role_track,
    blockId: preset.stack_id,
  });

  const overlaySections =
    overlays?.items
      .filter(
        (item) =>
          item.language === preset.language &&
          preset.overlay_ids.includes(item.id),
      )
      .map((item) => ({
        id: item.id,
        title: item.title,
        items: item.items,
      })) ?? [];

  const composedExperience = composeExperience({
    entries: experience.entries,
    rules: preset.experience,
    language: preset.language,
    roleTrack: preset.role_track,
  });

  const titleLine =
    preset.title_line ?? profile.title_lines[preset.role_track];

  return {
    metadata: {
      preset_id: preset.id,
      language: preset.language,
      role_track: preset.role_track,
    },
    header: {
      name: profile.person.name,
      location: profile.person.contact.location,
      email: profile.person.contact.email,
      phone: profile.person.contact.phone,
      linkedin: profile.person.contact.linkedin,
      portfolio: profile.person.contact.portfolio,
    },
    title_line: titleLine,
    section_order: preset.section_order,
    summary,
    selected_impact: impactBlock
      ? {
          id: impactBlock.id,
          title: impactBlock.title,
          items: impactBlock.items,
        }
      : undefined,
    strengths: strengthsBlock
      ? {
          id: strengthsBlock.id,
          title: strengthsBlock.title,
          items: strengthsBlock.items,
        }
      : undefined,
    experience: composedExperience,
    overlays: overlaySections,
    education: educationBlock
      ? {
          id: educationBlock.id,
          title: educationBlock.title,
          items: educationBlock.items,
        }
      : undefined,
    certifications: certificationsBlock
      ? {
          id: certificationsBlock.id,
          title: certificationsBlock.title,
          items: certificationsBlock.items,
        }
      : undefined,
    stack: stackBlock
      ? {
          id: stackBlock.id,
          title: stackBlock.title,
          items: stackBlock.items,
        }
      : undefined,
    languages: profile.languages.map(
      (language) => `${language.name} — ${language.proficiency}`,
    ),
  };
}