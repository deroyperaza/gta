/**
 * Real Brooklyn nonprofits that Brooklyn Org has funded, tied to the missions whose issue they work on.
 * Shown on each mission's results screen ("In real life") and in the journal's Brooklyn Org Network page.
 * Every line restates docs/FACTS-brooklyn-org-grantees.md (sourced Nov 21 2026). Groups whose work we couldn't
 * describe from a source are left out on purpose.
 */
export interface Grantee { name: string; what: string; funded: string; missions: string[] }

export const GRANTEES: Grantee[] = [
  { name: 'Brooklyn Rescue Mission Urban Harvest Center', what: 'A grocery-style food pantry and urban farm in Bed-Stuy.', funded: 'Brooklyn Org grant, Dec 2025', missions: ['stock', 'food'] },
  { name: 'The Campaign Against Hunger', what: 'A pantry network, home grocery delivery and community farms.', funded: 'Spark Prize 2019; grant Dec 2025', missions: ['stock', 'food'] },
  { name: 'The Circle Keepers', what: 'Youth-run restorative justice circles in schools.', funded: 'Brooklyn Org grant, Dec 2025', missions: ['circle', 'common', 'medbike', 'medtri', 'medmosque', 'medchoir'] },
  { name: 'Neighbors in Action', what: 'Violence prevention and coalition-building in Crown Heights and Bed-Stuy.', funded: 'Spark Prize 2024', missions: ['common', 'circle', 'rj'] },
  { name: 'Good Call', what: 'A free 24/7 hotline that connects people who are arrested to a lawyer.', funded: 'Spark Prize 2025; grant Spring 2026', missions: ['march', 'reentry'] },
  { name: 'YVote', what: 'Youth-led democracy education for teens 14 to 18.', funded: 'Spark Prize 2026', missions: ['march', 'pbudget', 'rj'] },
  { name: 'UHAB', what: 'Organizes tenant associations and eviction defense in eastern Brooklyn.', funded: 'Brooklyn Org grant, Spring 2026', missions: ['rent', 'medchoir'] },
  { name: 'IMPACCT Brooklyn', what: 'Affordable housing and tenant associations in Central Brooklyn.', funded: 'Brooklyn Org grant, Spring 2026', missions: ['rent', 'medtri'] },
  { name: 'Churches United for Fair Housing', what: 'Housing justice organizing in immigrant communities.', funded: 'Brooklyn Org grant, Dec 2025', missions: ['rent', 'medtri'] },
  { name: 'UPROSE', what: 'Climate justice organizing in Sunset Park.', funded: 'Brooklyn Org grant, Dec 2025', missions: ['board', 'ej'] },
  { name: 'Drive Change', what: 'Hospitality careers for young people coming home from incarceration.', funded: 'Spark Prize 2024', missions: ['reentry'] },
  { name: 'Osborne Association', what: 'Reentry support: housing, jobs and bringing families back together.', funded: 'Brooklyn Backs Brooklyn, 2026', missions: ['reentry'] },
  { name: 'Youth Justice Network', what: 'Reentry, court support and mentorship for justice-involved youth.', funded: 'Brooklyn Org grant, Spring 2026', missions: ['reentry'] },
  { name: 'S.T.O.P. (Surveillance Technology Oversight Project)', what: 'Fights discriminatory surveillance technology.', funded: 'Spark Prize 2026', missions: ['robot', 'rj'] },
  { name: 'Brooklyn Book Bodega', what: 'Works to end book deserts; has given away more than 500,000 books.', funded: 'Spark Prize 2025', missions: ['culture'] },
  { name: 'Homecrest Community Services', what: 'Older adult centers in South Brooklyn: meals, wellness and advocacy.', funded: 'Brooklyn Org grant, Dec 2025', missions: ['heat', 'elders'] },
  { name: 'Naturally Occurring Cultural Districts NY', what: 'Neighborhood cultural councils and festivals.', funded: 'Brooklyn Org grant, Spring 2026', missions: ['blockparty'] },
  { name: 'Riders Alliance', what: 'Organizes riders for faster, more affordable transit and more reduced fares.', funded: 'Brooklyn Org grant, Spring 2026', missions: ['fares'] },
  { name: 'Global Trauma Research', what: 'Crisis intervention and harm reduction.', funded: 'Brooklyn Org grant, Dec 2025', missions: [] },
  { name: 'Sure We Can', what: 'Supports canners; runs the city\'s only nonprofit redemption center.', funded: 'Spark Prize 2024; grant Dec 2025', missions: [] },
  { name: 'South Brooklyn Sanctuary', what: 'Volunteer legal help and Know Your Rights sessions for immigrants.', funded: 'Brooklyn Org grant, Spring 2026', missions: [] },
  // Added Nov 22 2026 (docs/FACTS-older-adults-ej-racial-justice.md)
  { name: 'GRIOT Circle', what: 'Founded in Brooklyn in 1996; serves LGBTQ+ elders of color.', funded: 'Brooklyn Org grantee partner', missions: ['elders'] },
  { name: 'VOLS Senior Law Project', what: 'Free wills, powers of attorney and health care proxies for low-income New Yorkers 60+.', funded: 'Brooklyn Org grant, Dec 2025', missions: ['elders'] },
  { name: 'The B.R.O. Experience Foundation', what: 'Healing, mentorship, therapy and career services for young Black and Brown men in Brooklyn.', funded: 'Spark Prize 2026', missions: ['rj'] },
  { name: "Asiyah Women's Center", what: 'Emergency shelter and support for survivors of intimate partner violence from Arab, Middle Eastern, Muslim, South Asian and BIPOC communities.', funded: 'Spark Prize 2026', missions: ['rj'] },
  { name: 'Black Trans Femmes in the Arts', what: 'Resources, workshops and funding for Black trans femme artists.', funded: 'Spark Prize 2026', missions: ['rj'] },
];

/** Groups for one mission (the Bridge mission lists them all) */
export const granteesFor = (missionId: string) => (missionId === 'bridge' ? GRANTEES.slice(0, 6) : GRANTEES.filter((g) => g.missions.includes(missionId)));
