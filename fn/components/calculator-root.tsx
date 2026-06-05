"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  loadAssessmentSession,
} from "@/lib/assessment-session";
import { mapBookingSectorToScope1 } from "@/lib/assessment-mapper";

import { IronSteelWizard } from "@/components/ironsteel-wizard";
import { OilGasWizard } from "@/components/oilgas-wizard";
import PowerWizard from "@/components/power-wizard";
import { PulpPaperWizard } from "@/components/pulppaper-wizard";
import { Scope1Wizard } from "@/components/scope1-wizard";
import { useAppDialog } from "@/components/app-dialog-provider";
import {
  SECTOR_SWITCH_MESSAGE,
  sectorDraftLooksMeaningful,
  type CalculatorSector,
} from "@/lib/ui/draft-detect";

export type Sector = CalculatorSector;

/**
 * Top-level shell that picks which sector wizard to render. Each wizard's
 * Step 1 sector grid switches between sectors via the `onSwitchSector` prop;
 * switching remounts the other wizard (drafts persist per sector in localStorage).
 */
export function CalculatorRoot() {
  const searchParams = useSearchParams();
  const dialog = useAppDialog();
  const [sector, setSector] = useState<Sector>("cement");

  useEffect(() => {
    const session = loadAssessmentSession();
    const sectorText = session?.sector || searchParams.get("sector");
    const hint = mapBookingSectorToScope1(sectorText);
    if (hint) setSector(hint.route);
  }, [searchParams]);

  const switchSector = useCallback(
    async (next: Sector) => {
      if (next === sector) return;

      if (sectorDraftLooksMeaningful(sector)) {
        const ok = await dialog.confirm(SECTOR_SWITCH_MESSAGE, "Switch sector");
        if (!ok) return;
      }

      setSector(next);
    },
    [dialog, sector],
  );

  if (sector === "oil_gas") {
    return <OilGasWizard onSwitchSector={switchSector} />;
  }

  if (sector === "pulp_paper") {
    return <PulpPaperWizard onSwitchSector={switchSector} />;
  }

  if (sector === "iron_steel") {
    return <IronSteelWizard onSwitchSector={switchSector} />;
  }

  if (sector === "power") {
    return <PowerWizard onSwitchSector={switchSector} />;
  }

  return <Scope1Wizard onSwitchSector={switchSector} />;
}
