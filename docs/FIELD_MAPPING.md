# Booking ? assessment form field mapping

Shared fields collected at booking (`assessments` / Step 1 + choose-time):

| Booking field | Scope 2 form | Scope 1 wizard |
|---------------|--------------|----------------|
| `name` | Contact / identity | `organization.contactName`, `auditMetadata.preparedBy` |
| `email` | `email` | `organization.contactEmail` |
| `mobile` | `mobile` | `organization.contactPhone` |
| `company` | `userCompany` | `organization.name` |
| `sector` | `sector` (marketing list) | See sector table below |
| `natureOfBusiness` | `natureOfBusiness` | Notes / boundary context |
| `country` | `country` | `organization.country` |
| `assignmentDate` / `assignmentTime` | Slot display | Reporting context hint |

## Sector mapping (booking text ? Scope 1 engine)

Booking uses **Scope 2 marketing sectors** (`SECTOR_OPTIONS` in `fn/app/data/sectorInitiatives.ts`).  
Scope 1 wizards use **engine sector codes**. Use this table for prefill and routing hints:

| Booking sector (contains / equals) | Scope 1 sector | Wizard route |
|----------------------------------|----------------|--------------|
| Cement | `CEMENT` | `/scope1` ? cement |
| Oil & Gas, Oil and Gas | `OIL_GAS` | oil & gas wizard |
| Pulp & Paper, Paper | `PULP_PAPER` | pulp & paper wizard |
| Power, Electricity, Utility | `POWER` | power wizard |
| Iron & Steel, Steel | `IRON_STEEL` | iron & steel wizard |
| Other / unmatched | � | User picks sector on Step 1 of wizard |

Implementation: `fn/lib/assessment-mapper.ts` ? `mapBookingSectorToScope1()`.

## Status guards

| `assessments.status` | User experience |
|----------------------|-----------------|
| `BOOKED` / `INVITED` | May open assessment link |
| `IN_PROGRESS` | Edit form / wizard |
| `SUBMITTED` | Read-only unless `?retry=true` |
| `APPROVED` | Dashboard OTP ? download |
| `REJECTED` | Retry link in email ? new or same booking |
