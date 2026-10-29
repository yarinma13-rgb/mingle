import type { ExternalSourceType } from "@/lib/supabase/types";
import { ashby, greenhouse, lever, smartrecruiters, workable } from "@/lib/external-jobs/connectors/ats";
import { jsonldSitemap } from "@/lib/external-jobs/connectors/jsonld";
import type { Connector } from "@/lib/external-jobs/connectors/common";

export const CONNECTORS: Record<ExternalSourceType, Connector> = {
  greenhouse,
  lever,
  ashby,
  workable,
  smartrecruiters,
  jsonld_sitemap: jsonldSitemap,
};

/** Hosts an ATS serves job and apply pages from; always valid apply targets. */
export const ATS_APPLY_HOSTS: Record<ExternalSourceType, string[]> = {
  greenhouse: ["greenhouse.io"],
  lever: ["lever.co"],
  ashby: ["ashbyhq.com"],
  workable: ["workable.com"],
  smartrecruiters: ["smartrecruiters.com"],
  jsonld_sitemap: [],
};

export type { Connector, ConnectorResult } from "@/lib/external-jobs/connectors/common";
