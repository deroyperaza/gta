/**
 * Painted landmarks placed by real coordinates (each painted in ChatGPT and keyed; see docs/FACTS-landmarks-jackie-whitman.md
 * for every fact and coordinate). A landmark shows up only once its sprite is `ready` (the render passed QC).
 * Layout finds open ground near the real spot (layout.ts → spots `lmk_<id>`); parks.ts draws it with a label and an E fact.
 */
export interface PaintedLandmark { id: string; name: string; at: [number, number]; file: string; scale?: number; fact: string; ready: boolean }

export const PAINTED: PaintedLandmark[] = [
  // Coney Island
  { id: 'cyclone', name: 'THE CYCLONE', at: [40.57417, -73.97778], file: 'cyclone', fact: 'SINCE 1927 THIS WOODEN COASTER HAS DROPPED RIDERS 85 FEET AT ABOUT 60 MPH. AN OFFICIAL NYC LANDMARK.', scale: 0.42, ready: true },
  { id: 'lunapark', name: 'LUNA PARK', at: [40.57397, -73.97848], file: 'lunapark', fact: 'NAMED FOR A 1903 CONEY PARK THAT GLOWED AT NIGHT WITH ABOUT 250,000 LIGHT BULBS.', scale: 0.72, ready: true },
  { id: 'wonderwheel', name: "DENO'S WONDER WHEEL", at: [40.57403, -73.97914], file: 'wonderwheel', fact: 'TURNING SINCE 1920: 16 OF ITS 24 CARS SLIDE ALONG CURVED TRACKS AS THE WHEEL SPINS.', scale: 0.75, ready: true },
  { id: 'ballpark', name: 'MAIMONIDES PARK', at: [40.57444, -73.98417], file: 'ballpark', fact: 'HOME OF THE BROOKLYN CYCLONES, BUILT WHERE STEEPLECHASE PARK ONCE STOOD.', scale: 0.72, ready: true },
  { id: 'aquarium', name: 'NEW YORK AQUARIUM', at: [40.57429, -73.97512], file: 'aquarium', fact: 'OPENED IN 1896, MOVED TO CONEY IN 1957: THE OLDEST AQUARIUM STILL RUNNING IN THE US.', scale: 0.85, ready: true },
  // The empty parts of the map
  { id: 'verrazzano', name: 'VERRAZZANO-NARROWS BRIDGE', at: [40.6086, -74.0385], file: 'verrazzano', fact: 'ITS TOWERS ARE 1⅝ INCHES FARTHER APART AT THE TOP THAN THE BOTTOM, BECAUSE THE EARTH CURVES.', ready: false },
  { id: 'dyker', name: 'DYKER HEIGHTS LIGHTS', at: [40.6215, -74.0130], file: 'dyker', fact: 'SINCE THE MID-1980S, NEIGHBORS HAVE COVERED THEIR HOMES IN HOLIDAY LIGHTS. SOME HIRE PROS!', ready: false },
  { id: 'domino', name: 'DOMINO SUGAR REFINERY', at: [40.71444, -73.9675], file: 'domino', fact: 'IN THE 1870S THIS REFINERY MADE MORE THAN HALF OF ALL THE SUGAR USED IN AMERICA.', ready: false },
  { id: 'mccarren', name: 'McCARREN PARK POOL', at: [40.7198, -73.9510], file: 'mccarren', fact: 'OPENED IN 1936 FOR 6,800 SWIMMERS. CLOSED IN 1984, REOPENED IN 2012.', ready: false },
  { id: 'sheepshead', name: 'SHEEPSHEAD BAY FOOTBRIDGE', at: [40.5836, -73.9504], file: 'sheepshead', fact: 'NAMED FOR THE SHEEPSHEAD, A FISH WITH TEETH THAT LOOK A LOT LIKE HUMAN TEETH.', ready: false },
  { id: 'canarsie', name: 'CANARSIE PIER', at: [40.6290, -73.8845], file: 'canarsie', fact: 'THIS PIER IS PART OF A NATIONAL PARK: GATEWAY NATIONAL RECREATION AREA.', ready: false },
  { id: 'floydbennett', name: 'FLOYD BENNETT FIELD', at: [40.5930, -73.8875], file: 'floydbennett', fact: "NYC'S FIRST CITY AIRPORT (1931). IN 1938 HOWARD HUGHES FLEW AROUND THE WORLD FROM HERE IN UNDER 4 DAYS.", ready: false },
  { id: 'armyterminal', name: 'BROOKLYN ARMY TERMINAL', at: [40.64472, -74.02778], file: 'armyterminal', fact: 'IN 1958 ELVIS PRESLEY BOARDED AN ARMY SHIP HERE, HEADED TO GERMANY AS A SOLDIER.', ready: false },
  // History and civic weight
  { id: 'weeksville', name: 'WEEKSVILLE HERITAGE CENTER', at: [40.67399, -73.92537], file: 'weeksville', fact: 'FREE BLACK FAMILIES FOUNDED WEEKSVILLE IN 1838. ITS HOUSES WERE REDISCOVERED IN 1968 FROM AN AIRPLANE.', ready: false },
  { id: 'prisonship', name: "PRISON SHIP MARTYRS' MONUMENT", at: [40.6918, -73.9756], file: 'prisonship', fact: 'IT HONORS MORE THAN 11,000 AMERICAN PRISONERS WHO DIED ON BRITISH SHIPS IN THE REVOLUTIONARY WAR.', ready: false },
  { id: 'navyyard', name: 'BROOKLYN NAVY YARD', at: [40.6995, -73.9800], file: 'navyyard', fact: 'THE BATTLESHIP USS MISSOURI WAS BUILT HERE. WORLD WAR II OFFICIALLY ENDED ON ITS DECK IN 1945.', ready: false },
  { id: 'erasmus', name: 'ERASMUS HALL HIGH SCHOOL', at: [40.64944, -73.95778], file: 'erasmus', fact: 'STARTED IN 1786. ITS ORIGINAL WOODEN SCHOOLHOUSE STILL STANDS IN THE COURTYARD.', ready: false },
];

export const PAINTED_AT: Record<string, [number, number]> = Object.fromEntries(PAINTED.filter((p) => p.ready).map((p) => [`lmk_${p.id}`, p.at]));
