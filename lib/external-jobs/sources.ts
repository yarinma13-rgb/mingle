import { z } from "zod";
import { hostOf } from "@/lib/external-jobs/text";
import { UNAVAILABLE_SOURCE_TYPES } from "@/lib/external-jobs/types";
import { logEvent, type AdminDb } from "@/lib/external-jobs/store";

/**
 * Adding sources in bulk (operator endpoint). Same fields and rules as the
 * admin form; the legal basis and who reviewed the terms are required and
 * recorded on every source, exactly as the form's checkbox records them.
 */
export const sourceInputSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  careersUrl: z.string().trim().url().refine((v) => v.startsWith("https://"), "careersUrl must be https"),
  sourceType: z.enum(["greenhouse", "lever", "ashby", "workable", "smartrecruiters", "jsonld_sitemap"]),
  sourceKey: z.string().trim().min(1).max(500),
  collectionBasis: z.enum(["public_api", "public_feed", "structured_data", "written_permission"]),
  companyDomains: z.array(z.string().trim().toLowerCase().min(3)).max(10).default([]),
  permissionNotes: z.string().trim().max(4000).default(""),
});

export const bulkSourcesSchema = z.object({
  termsReviewedBy: z.string().trim().min(3).max(200),
  sources: z.array(sourceInputSchema).min(1).max(50),
});

export type BulkSourcesResult = {
  added: string[];
  skipped: Array<{ companyName: string; reason: string }>;
};

export async function addSources(
  db: AdminDb,
  input: z.infer<typeof bulkSourcesSchema>,
): Promise<BulkSourcesResult> {
  const result: BulkSourcesResult = { added: [], skipped: [] };
  const now = new Date().toISOString();
  for (const source of input.sources) {
    if (UNAVAILABLE_SOURCE_TYPES.includes(source.sourceType)) {
      result.skipped.push({ companyName: source.companyName, reason: "collection method unavailable (robots.txt)" });
      continue;
    }
    const { data: existing } = await db
      .from("external_job_sources")
      .select("id")
      .eq("source_type", source.sourceType)
      .eq("source_key", source.sourceKey)
      .maybeSingle();
    if (existing) {
      result.skipped.push({ companyName: source.companyName, reason: "already a source" });
      continue;
    }
    const careersHost = hostOf(source.careersUrl);
    const { data, error } = await db
      .from("external_job_sources")
      .insert({
        company_name: source.companyName,
        careers_url: source.careersUrl,
        source_type: source.sourceType,
        source_key: source.sourceKey,
        collection_basis: source.collectionBasis,
        permission_notes: source.permissionNotes || null,
        terms_reviewed_at: now,
        terms_reviewed_by: input.termsReviewedBy,
        company_domains: [...new Set([...(careersHost ? [careersHost] : []), ...source.companyDomains])],
        created_by: input.termsReviewedBy,
      })
      .select("id")
      .single();
    if (error || !data) {
      result.skipped.push({ companyName: source.companyName, reason: error?.message ?? "insert failed" });
      continue;
    }
    result.added.push(source.companyName);
    await logEvent(db, {
      kind: "source_added",
      sourceId: data.id,
      actor: input.termsReviewedBy,
      message: `${source.companyName} via ${source.sourceType} (${source.sourceKey}) — bulk`,
      detail: { basis: source.collectionBasis, notes: source.permissionNotes },
    });
  }
  return result;
}
