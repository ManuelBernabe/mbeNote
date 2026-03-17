import { RRule, rrulestr } from "rrule";

const freqLabels: Record<number, string> = {
  [RRule.DAILY]: "día",
  [RRule.WEEKLY]: "semana",
  [RRule.MONTHLY]: "mes",
  [RRule.YEARLY]: "año",
};

const dayLabels: Record<string, string> = {
  MO: "lunes",
  TU: "martes",
  WE: "miércoles",
  TH: "jueves",
  FR: "viernes",
  SA: "sábado",
  SU: "domingo",
};

/**
 * Convert an RRULE string to a human-readable Spanish description.
 */
export function describeRRule(rule: string): string {
  try {
    const parsed = rrulestr(rule);
    const options = parsed.origOptions;
    const freq = options.freq;
    const interval = options.interval ?? 1;

    if (freq === undefined) return rule;

    const label = freqLabels[freq] ?? "periodo";
    let base =
      interval === 1
        ? `Cada ${label}`
        : `Cada ${interval} ${label}${freq !== RRule.MONTHLY ? "s" : "es"}`;

    if (
      freq === RRule.WEEKLY &&
      options.byweekday &&
      Array.isArray(options.byweekday)
    ) {
      const days = options.byweekday.map((d) => {
        const key =
          typeof d === "number"
            ? ["MO", "TU", "WE", "TH", "FR", "SA", "SU"][d]
            : d.toString().slice(0, 2).toUpperCase();
        return dayLabels[key] ?? key;
      });
      base += ` los ${days.join(", ")}`;
    }

    if (options.count) {
      base += `, ${options.count} veces`;
    }

    if (options.until) {
      const until = options.until;
      base += ` hasta el ${until.getDate()}/${until.getMonth() + 1}/${until.getFullYear()}`;
    }

    return base;
  } catch {
    return rule;
  }
}

export interface BuildRRuleParams {
  freq: "daily" | "weekly" | "monthly" | "yearly";
  interval?: number;
  byweekday?: number[]; // 0=MO .. 6=SU
  count?: number;
  until?: Date;
}

/**
 * Build an RRULE string from UI-friendly parameters.
 */
export function buildRRule(params: BuildRRuleParams): string {
  const freqMap: Record<string, number> = {
    daily: RRule.DAILY,
    weekly: RRule.WEEKLY,
    monthly: RRule.MONTHLY,
    yearly: RRule.YEARLY,
  };

  const weekdayMap = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU];

  const options: Partial<InstanceType<typeof RRule>["origOptions"]> = {
    freq: freqMap[params.freq],
    interval: params.interval ?? 1,
  };

  if (params.byweekday?.length) {
    options.byweekday = params.byweekday.map((d) => weekdayMap[d]);
  }

  if (params.count) {
    options.count = params.count;
  }

  if (params.until) {
    options.until = params.until;
  }

  return new RRule(options).toString();
}

/**
 * Expand occurrences of an RRULE within a date range.
 */
export function expandOccurrences(
  rule: string,
  start: Date,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  try {
    const parsed = rrulestr(rule, { dtstart: start });
    return parsed.between(rangeStart, rangeEnd, true);
  } catch {
    return [];
  }
}
