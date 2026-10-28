/**
 * Minimal robots.txt (RFC 9309) evaluation: groups by user-agent, longest
 * matching rule wins, Allow wins ties, `*` and `$` wildcards supported.
 */

type Rule = { allow: boolean; pattern: string };
type Group = { agents: string[]; rules: Rule[]; crawlDelay: number | null };

export type RobotsPolicy = {
  isAllowed(path: string): boolean;
  /** Seconds, if the matching group sets Crawl-delay. */
  crawlDelay: number | null;
  /**
   * Set when robots.txt could not be read (network error / 5xx). Nothing may
   * be fetched, but this is an outage, not the site forbidding us.
   */
  unreachable?: string;
};

export function parseRobots(body: string, userAgentToken: string): RobotsPolicy {
  const groups: Group[] = [];
  let current: Group | null = null;
  let lastWasAgent = false;

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (key === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [], crawlDelay: null };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!current) continue;
    if (key === "allow" || key === "disallow") {
      if (key === "disallow" && value === "") continue;
      current.rules.push({ allow: key === "allow", pattern: value });
    } else if (key === "crawl-delay") {
      const seconds = Number.parseFloat(value);
      if (Number.isFinite(seconds) && seconds >= 0) current.crawlDelay = seconds;
    }
  }

  const token = userAgentToken.toLowerCase();
  const specific = groups.filter((g) => g.agents.some((a) => a !== "*" && token.includes(a)));
  const chosen = specific.length ? specific : groups.filter((g) => g.agents.includes("*"));
  const rules = chosen.flatMap((g) => g.rules);
  const crawlDelay = chosen.find((g) => g.crawlDelay != null)?.crawlDelay ?? null;

  return {
    crawlDelay,
    isAllowed(path: string) {
      let best: Rule | null = null;
      for (const rule of rules) {
        if (!matches(rule.pattern, path)) continue;
        if (
          !best ||
          rule.pattern.length > best.pattern.length ||
          (rule.pattern.length === best.pattern.length && rule.allow)
        ) {
          best = rule;
        }
      }
      return best ? best.allow : true;
    },
  };
}

function matches(pattern: string, path: string): boolean {
  const anchored = pattern.endsWith("$");
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const regex = new RegExp(
    "^" +
      body
        .split("*")
        .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
        .join(".*") +
      (anchored ? "$" : ""),
  );
  return regex.test(path);
}

export const ALLOW_ALL: RobotsPolicy = { isAllowed: () => true, crawlDelay: null };
export function unreachableRobots(reason: string): RobotsPolicy {
  return { isAllowed: () => false, crawlDelay: null, unreachable: reason };
}
