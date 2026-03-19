import { z } from "zod";

export const LanguageCodeSchema = z.enum(["en", "sv"]);
export const RoleTrackSchema = z.enum([
  "technical_delivery",
  "technical_project_management",
  "integration",
]);

export const SectionKeySchema = z.enum([
  "summary",
  "selected_impact",
  "strengths",
  "experience",
  "ai_overlay",
  "education",
  "certifications",
  "stack",
  "languages",
]);

export const ContactSchema = z.object({
  location: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  linkedin: z.string().min(1),
  portfolio: z.string().min(1),
});

export const LanguageItemSchema = z.object({
  name: z.string().min(1),
  proficiency: z.string().min(1),
});

export const ProfileFileSchema = z.object({
  version: z.string().default("1"),
  person: z.object({
    name: z.string().min(1),
    contact: ContactSchema,
  }),
  title_lines: z.record(RoleTrackSchema, z.string()).partial().default({}),
  languages: z.array(LanguageItemSchema).default([]),
});

export const SummaryItemSchema = z.object({
  id: z.string().min(1),
  language: LanguageCodeSchema,
  role_track: RoleTrackSchema,
  text: z.string().min(1),
});

export const SummariesFileSchema = z.object({
  version: z.string().default("1"),
  items: z.array(SummaryItemSchema).min(1),
});

export const BlockItemSchema = z.object({
  id: z.string().min(1),
  language: LanguageCodeSchema,
  role_track: RoleTrackSchema.optional(),
  title: z.string().optional(),
  items: z.array(z.string().min(1)).min(1),
});

export const BlockCollectionSchema = z.object({
  version: z.string().default("1"),
  items: z.array(BlockItemSchema).min(1),
});

export const ExperienceBulletSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
  priority: z.number().int().min(0).max(100).default(0),
});

export const ExperienceEntrySchema = z.object({
  id: z.string().min(1),
  language: LanguageCodeSchema,
  company: z.string().min(1),
  role: z.string().min(1),
  dates: z.string().min(1),
  location: z.string().optional(),
  subtitle: z.string().optional(),
  bullets: z.array(ExperienceBulletSchema).min(1),
});

export const ExperienceFileSchema = z.object({
  version: z.string().default("1"),
  entries: z.array(ExperienceEntrySchema).min(1),
});

export const ExperienceRuleSchema = z.object({
  entry_id: z.string().min(1),
  max_bullets: z.number().int().min(1).max(10).default(4),
  prefer_tags: z.array(z.string().min(1)).default([]),
  required_tags: z.array(z.string().min(1)).default([]),
  exclude_tags: z.array(z.string().min(1)).default([]),
  force_bullet_ids: z.array(z.string().min(1)).default([]),
});

export const PresetFileSchema = z.object({
  id: z.string().min(1),
  language: LanguageCodeSchema,
  role_track: RoleTrackSchema,
  title_line: z.string().optional(),
  summary_id: z.string().optional(),
  impacts_id: z.string().optional(),
  strengths_id: z.string().optional(),
  education_id: z.string().optional(),
  certifications_id: z.string().optional(),
  stack_id: z.string().optional(),
  overlay_ids: z.array(z.string().min(1)).default([]),
  section_order: z.array(SectionKeySchema).min(1),
  experience: z.array(ExperienceRuleSchema).min(1),
});

export const LoadedResumeModulesSchema = z.object({
  profile: ProfileFileSchema,
  summaries: SummariesFileSchema,
  strengths: BlockCollectionSchema,
  impacts: BlockCollectionSchema,
  experience: ExperienceFileSchema,
  overlays: BlockCollectionSchema.optional(),
  education: BlockCollectionSchema.optional(),
  certifications: BlockCollectionSchema.optional(),
  stack: BlockCollectionSchema.optional(),
});