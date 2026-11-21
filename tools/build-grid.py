"""
Builds src/world/brooklynGrid.ts: the game map's grid laid over real Brooklyn.

Each map block covers about 1.0 km east-west by 0.82 km north-south (the block's
22 x 18 tile shape). A block's centre decides what it is:
  - Brooklyn land: the nearest neighborhood from NEIGHBORHOODS below (Voronoi),
    or a park / cemetery when the centre sits in one of the city's park NTAs
  - Manhattan or Queens land (shown across the water / past the border)
  - water

Source: NYC Neighborhood Tabulation Areas 2020, NYC Open Data (dataset 9nt8-h7nd):
  https://data.cityofnewyork.us/resource/9nt8-h7nd.geojson?$limit=400&boroname=Brooklyn
  (same for Manhattan, Queens). Download them, then:
  python3 tools/build-grid.py <dir with nta.geojson, nta-Manhattan.geojson, nta-Queens.geojson>
"""
import json, sys, math, os

LNG0, LNG1 = -74.045, -73.855   # west, east
LAT0, LAT1 = 40.566, 40.740     # south, north

def edges(a, b, n):
    return [a + (b - a) * i / n for i in range(n)]
# Like a subway map: the dense core (Downtown, Fort Greene, Park Slope, Prospect Heights, Crown Heights,
# Bed-Stuy) gets blocks of about 600 m; the outer neighborhoods about 1.1 km. Positions stay in true order.
LNG_EDGES = edges(-74.045, -74.005, 4) + edges(-74.005, -73.935, 10) + edges(-73.935, -73.855, 6) + [-73.855]   # west -> east
LAT_EDGES = edges(40.740, 40.700, 4) + edges(40.700, 40.655, 9) + edges(40.655, 40.566, 9) + [40.566]           # north -> south
COLS, ROWS = len(LNG_EDGES) - 1, len(LAT_EDGES) - 1

# Game neighborhoods: name, approximate centre (lat, lng), gameplay district (one of the 11 in core/types.ts)
NEIGHBORHOODS = [
    ('Greenpoint', 40.7295, -73.9515, 'waterfront'), ('Williamsburg', 40.7135, -73.9590, 'waterfront'),
    ('South Williamsburg', 40.7040, -73.9610, 'waterfront'), ('East Williamsburg', 40.7140, -73.9370, 'bushwick'),
    ('Bushwick', 40.6950, -73.9180, 'bushwick'), ('DUMBO', 40.7033, -73.9881, 'downtown'),
    ('Vinegar Hill', 40.7037, -73.9817, 'downtown'), ('Brooklyn Navy Yard', 40.7010, -73.9700, 'downtown'),
    ('Brooklyn Heights', 40.6960, -73.9950, 'downtown'), ('Downtown Brooklyn', 40.6930, -73.9850, 'downtown'),
    ('Fort Greene', 40.6890, -73.9740, 'downtown'), ('Clinton Hill', 40.6880, -73.9640, 'bedstuy'),
    ('Bedford-Stuyvesant', 40.6870, -73.9420, 'bedstuy'), ('Ocean Hill', 40.6780, -73.9100, 'bedstuy'),
    ('Cobble Hill', 40.6860, -73.9960, 'downtown'), ('Boerum Hill', 40.6850, -73.9840, 'downtown'),
    ('Carroll Gardens', 40.6795, -73.9990, 'parkslope'), ('Columbia Waterfront', 40.6865, -74.0035, 'redhook'),
    ('Red Hook', 40.6750, -74.0100, 'redhook'), ('Gowanus', 40.6750, -73.9900, 'parkslope'),
    ('Park Slope', 40.6710, -73.9780, 'parkslope'), ('Prospect Heights', 40.6775, -73.9680, 'crownheights'),
    ('Crown Heights', 40.6700, -73.9440, 'crownheights'), ('Weeksville', 40.6740, -73.9260, 'crownheights'),
    ('Brownsville', 40.6620, -73.9100, 'flatbush'), ('East New York', 40.6660, -73.8820, 'flatbush'),
    ('Cypress Hills', 40.6830, -73.8760, 'bushwick'), ('City Line', 40.6780, -73.8670, 'flatbush'),
    ('Starrett City', 40.6480, -73.8820, 'flatbush'), ('Windsor Terrace', 40.6540, -73.9760, 'parkslope'),
    ('South Slope', 40.6600, -73.9870, 'parkslope'), ('Prospect Lefferts Gardens', 40.6590, -73.9520, 'plg'),
    ('Flatbush', 40.6410, -73.9590, 'flatbush'), ('Ditmas Park', 40.6380, -73.9640, 'flatbush'),
    ('Kensington', 40.6400, -73.9750, 'parkslope'), ('East Flatbush', 40.6450, -73.9300, 'plg'),
    ('Canarsie', 40.6400, -73.9000, 'flatbush'), ('Flatlands', 40.6250, -73.9300, 'flatbush'),
    ('Midwood', 40.6200, -73.9600, 'flatbush'), ('Borough Park', 40.6330, -73.9930, 'sunsetpark'),
    ('Sunset Park', 40.6480, -74.0100, 'sunsetpark'), ('Bay Ridge', 40.6250, -74.0300, 'sunsetpark'),
    ('Fort Hamilton', 40.6100, -74.0300, 'sunsetpark'), ('Dyker Heights', 40.6170, -74.0120, 'sunsetpark'),
    ('Bensonhurst', 40.6020, -73.9950, 'sunsetpark'), ('Bath Beach', 40.5990, -74.0080, 'sunsetpark'),
    ('Gravesend', 40.5970, -73.9720, 'coneyisland'), ('Homecrest', 40.6010, -73.9580, 'coneyisland'),
    ('Madison', 40.6080, -73.9480, 'flatbush'), ('Sheepshead Bay', 40.5900, -73.9450, 'coneyisland'),
    ('Manhattan Beach', 40.5780, -73.9430, 'coneyisland'), ('Brighton Beach', 40.5780, -73.9600, 'coneyisland'),
    ('Coney Island', 40.5760, -73.9850, 'coneyisland'), ('Sea Gate', 40.5770, -74.0080, 'coneyisland'),
    ('Gerritsen Beach', 40.5900, -73.9220, 'coneyisland'), ('Marine Park', 40.6030, -73.9220, 'flatbush'),
    ('Mill Basin', 40.6100, -73.9100, 'flatbush'), ('Bergen Beach', 40.6200, -73.9050, 'flatbush'),
]
PARK_NTAS = {'Prospect Park', 'Dyker Beach Park', 'Marine Park-Plumb Island', 'Calvert Vaux Park', 'McGuire Fields',
             'Lincoln Terrace Park', 'Canarsie Park & Pier', 'Shirley Chisholm State Park', 'Barren Island-Floyd Bennett Field'}
CEMETERY_NTAS = {'Green-Wood Cemetery', 'Holy Cross Cemetery', 'The Evergreens Cemetery', 'Highland Park-Cypress Hills Cemeteries (South)'}
WATER_NTAS = {'Jamaica Bay (West)'}


def frac(E, v):
    """Fractional grid index of a coordinate along monotonic edges E."""
    for i in range(len(E) - 1):
        a, b = E[i], E[i + 1]
        if min(a, b) <= v <= max(a, b): return i + (v - a) / (b - a)
    return 0 if abs(v - E[0]) < abs(v - E[-1]) else len(E) - 1


def rings(geom):
    polys = geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']]
    return polys


def inside(lng, lat, poly):
    """poly = [outer, hole, hole...] rings of [lng, lat]"""
    def ray(ring):
        c = False
        for i in range(len(ring)):
            x1, y1 = ring[i - 1][0], ring[i - 1][1]; x2, y2 = ring[i][0], ring[i][1]
            if (y1 > lat) != (y2 > lat) and lng < (x2 - x1) * (lat - y1) / (y2 - y1) + x1: c = not c
        return c
    return ray(poly[0]) and not any(ray(h) for h in poly[1:])


def load(path):
    out = []
    for f in json.load(open(path))['features']:
        out.append((f['properties']['ntaname'], rings(f['geometry'])))
    return out


def main(src):
    bk, mn, qn = load(os.path.join(src, 'nta.geojson')), load(os.path.join(src, 'nta-Manhattan.geojson')), load(os.path.join(src, 'nta-Queens.geojson'))
    def which(lng, lat):
        for name, polys in bk:
            if any(inside(lng, lat, p) for p in polys): return ('bk', name)
        for tag, src_ in (('mn', mn), ('qn', qn)):
            for name, polys in src_:
                if any(inside(lng, lat, p) for p in polys): return (tag, name)
        return ('water', None)
    kx = math.cos(math.radians((LAT0 + LAT1) / 2))
    cells, kinds, parknames = [], [], {}
    PRETTY = {'Marine Park-Plumb Island': 'Marine Park', 'Barren Island-Floyd Bennett Field': 'Floyd Bennett Field',
              'Highland Park-Cypress Hills Cemeteries (South)': 'Cypress Hills Cemetery', 'Canarsie Park & Pier': 'Canarsie Park',
              'Shirley Chisholm State Park': 'Shirley Chisholm State Park'}
    for r in range(ROWS):
        row, krow = [], []
        for c in range(COLS):
            lng = (LNG_EDGES[c] + LNG_EDGES[c + 1]) / 2
            lat = (LAT_EDGES[r] + LAT_EDGES[r + 1]) / 2
            tag, nta = which(lng, lat)
            if tag == 'water' or nta in WATER_NTAS: row.append(-1); krow.append('w'); continue
            if tag == 'mn': row.append(-2); krow.append('m'); continue
            if tag == 'qn' and lng < -73.95: row.append(-1); krow.append('w'); continue  # a stray Queens island polygon in the Narrows
            if tag == 'qn': row.append(-3); krow.append('q'); continue
            best = min(range(len(NEIGHBORHOODS)), key=lambda i: ((NEIGHBORHOODS[i][2] - lng) * kx) ** 2 + (NEIGHBORHOODS[i][1] - lat) ** 2)
            row.append(best)
            krow.append('p' if nta in PARK_NTAS else 'c' if nta in CEMETERY_NTAS else 'l')
            if nta in PARK_NTAS or nta in CEMETERY_NTAS: parknames[f'{c},{r}'] = PRETTY.get(nta, nta)
        cells.append(row); kinds.append(''.join(krow))
    # The East River and Newtown Creek are narrower than a block: any Manhattan block touching Brooklyn, and any
    # Queens block touching Greenpoint from the north, becomes water, so Brooklyn always has its shoreline
    def bk(r, c): return 0 <= r < ROWS and 0 <= c < COLS and cells[r][c] >= 0
    for r in range(ROWS):
        for c in range(COLS):
            near = [(r + dr, c + dc) for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1))]
            if cells[r][c] == -2 and any(bk(a, b) for a, b in near): cells[r][c] = -1; kinds[r] = kinds[r][:c] + 'w' + kinds[r][c + 1:]
            if cells[r][c] == -3 and bk(r + 1, c) and r <= 2: cells[r][c] = -1; kinds[r] = kinds[r][:c] + 'w' + kinds[r][c + 1:]
    # Every neighborhood gets at least one block: a squeezed-out one takes the land block nearest its centre
    # from a neighbor that has more than one
    def centre(i):
        _, la, ln, _ = NEIGHBORHOODS[i]
        return (frac(LNG_EDGES, ln) - 0.5, frac(LAT_EDGES, la) - 0.5)
    for i in range(len(NEIGHBORHOODS)):
        if any(v == i for row in cells for v in row): continue
        cx, cy = centre(i)
        counts = {}
        for row in cells:
            for v in row: counts[v] = counts.get(v, 0) + 1
        cands = [(math.hypot(c - cx, r - cy), r, c) for r in range(ROWS) for c in range(COLS) if cells[r][c] >= 0 and kinds[r][c] == 'l' and counts[cells[r][c]] > 1]
        _, r, c = min(cands)
        cells[r][c] = i
    hoods = ',\n  '.join(json.dumps([n, d]) for n, _, _, d in NEIGHBORHOODS)
    ts = f"""// GENERATED by tools/build-grid.py from NYC Open Data Neighborhood Tabulation Areas (2020). Do not edit by hand.
import type {{ District }} from '../core/types';

/**
 * The map grid over real Brooklyn. Column c spans LNG_EDGES[c]..[c+1] (west to east), row r spans
 * LAT_EDGES[r]..[r+1] (north to south). The dense core gets narrower blocks, like a subway map.
 */
export const GRID = {{ cols: {COLS}, rows: {ROWS} }};
export const LNG_EDGES: number[] = {json.dumps([round(v, 5) for v in LNG_EDGES])};
export const LAT_EDGES: number[] = {json.dumps([round(v, 5) for v in LAT_EDGES])};

/** Neighborhood name and its gameplay district. */
export const NEIGHBORHOODS: [string, District][] = [
  {hoods},
];

/** Per block: index into NEIGHBORHOODS, or -1 water, -2 Manhattan, -3 Queens. */
export const CELLS: number[][] = {json.dumps(cells)};

/** Per block: l land, p park, c cemetery, w water, m Manhattan, q Queens. */
export const KINDS: string[] = {json.dumps(kinds, indent=1)};

/** Park and cemetery names by block "c,r". */
export const PARKNAMES: Record<string, string> = {json.dumps(parknames)};
"""
    open('src/world/brooklynGrid.ts', 'w').write(ts)
    # ASCII preview
    letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*'
    for r in range(ROWS):
        print(''.join('~' if v == -1 else 'M' if v == -2 else 'Q' if v == -3 else ('+' if kinds[r][c] == 'p' else '^' if kinds[r][c] == 'c' else letters[v]) for c, v in enumerate(cells[r])))
    used = sorted({v for row in cells for v in row if v >= 0})
    print('neighborhoods placed:', len(used), 'of', len(NEIGHBORHOODS), '| missing:', [NEIGHBORHOODS[i][0] for i in range(len(NEIGHBORHOODS)) if i not in used])
    land = sum(1 for k in kinds for ch in k if ch in 'lpc')
    print('Brooklyn blocks:', land)


if __name__ == '__main__':
    main(sys.argv[1])
