import { useMemo } from "react";
import { geoMercator, geoPath, geoNaturalEarth1 } from "d3-geo";
import { feature } from "topojson-client";
import type { GeoProjection } from "d3-geo";
// World atlas at 110m resolution (~100KB). Vite imports JSON as a static
// JS object at build time, so this gets inlined into the single-file bundle.
import worldAtlasRaw from "world-atlas/countries-110m.json";

// Pre-decode the TopoJSON once at module load so we don't pay for it on
// every render or scene transition.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const worldAtlas: any = worldAtlasRaw;
const countriesFC = feature(
  worldAtlas,
  worldAtlas.objects.countries
) as unknown as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  features: Array<{ id: string | number; properties?: any; geometry: any }>;
};

const COUNTRY_FEATURES = countriesFC.features;

export interface WorldMapProps {
  /** ISO 3166-1 numeric code as a string (matches world-atlas `id`). */
  highlightCountryId: string;
  /** Coordinates of the city marker in [longitude, latitude] order. */
  cityCoords: [number, number];
  /** Width of the SVG viewBox in pixels. */
  width?: number;
  /** Height of the SVG viewBox in pixels. */
  height?: number;
  /**
   * Zoom mode:
   *   "country" — fit the highlighted country to the frame (cable-news feel)
   *   "world"   — show the whole world with the country highlighted
   */
  mode?: "country" | "world";
}

/**
 * Renders a stylised SVG world map with one country highlighted and a
 * pulsing dot on a city. Designed for the video scenes — large, readable,
 * minimal labels, dark theme.
 */
export function WorldMap({
  highlightCountryId,
  cityCoords,
  width = 1080,
  height = 960,
  mode = "country",
}: WorldMapProps) {
  const { paths, highlightPath, cityPixel } = useMemo(() => {
    const highlight = COUNTRY_FEATURES.find(
      (f) => String(f.id) === highlightCountryId
    );

    let projection: GeoProjection;
    if (mode === "world" || !highlight) {
      projection = geoNaturalEarth1()
        .scale(width / 6)
        .translate([width / 2, height / 2]);
    } else {
      // Pad so the country isn't flush against the edges.
      const PAD = 80;
      projection = geoMercator().fitExtent(
        [
          [PAD, PAD],
          [width - PAD, height - PAD],
        ],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        highlight as any
      );
    }
    const path = geoPath(projection);

    const paths = COUNTRY_FEATURES.map((f) => ({
      id: String(f.id),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      d: path(f as any) ?? "",
    }));
    const highlightPath = highlight
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        path(highlight as any) ?? null
      : null;
    const cityPixel = projection(cityCoords) ?? null;

    return { paths, highlightPath, cityPixel };
  }, [highlightCountryId, cityCoords, width, height, mode]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
    >
      {/* Ocean / background */}
      <rect width={width} height={height} fill="#0a0e1a" />

      {/* Latitude/longitude grid for a "globe" feel — faint */}
      <g stroke="#1e293b" strokeWidth={0.5} fill="none" opacity={0.5}>
        {[-60, -30, 0, 30, 60].map((lat) => {
          // Approximate a graticule line by sampling longitude
          const pts = Array.from({ length: 73 }, (_, i) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const p = (geoMercator() as any).translate([width / 2, height / 2]);
            return p([i * 5 - 180, lat]);
          }).filter(Boolean);
          if (pts.length < 2) return null;
          // We don't really use this — replaced below by simpler approach.
          return null;
        })}
      </g>

      {/* Base countries */}
      {paths.map((p) => (
        <path
          key={p.id}
          d={p.d}
          fill={p.id === highlightCountryId ? "transparent" : "#1e293b"}
          stroke="#0f172a"
          strokeWidth={0.75}
        />
      ))}

      {/* Highlighted country on top, with a glow underlay */}
      {highlightPath && (
        <>
          <path
            d={highlightPath}
            fill="none"
            stroke="#60a5fa"
            strokeWidth={4}
            opacity={0.35}
            style={{ filter: "blur(4px)" }}
          />
          <path
            d={highlightPath}
            fill="#1e3a8a"
            stroke="#60a5fa"
            strokeWidth={2}
          />
        </>
      )}

      {/* Pulsing city marker */}
      {cityPixel && (
        <g transform={`translate(${cityPixel[0]}, ${cityPixel[1]})`}>
          <circle r="0" fill="#fbbf24" opacity="0.6">
            <animate
              attributeName="r"
              values="6;48"
              dur="1.6s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.6;0"
              dur="1.6s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="0" fill="#fbbf24" opacity="0.4">
            <animate
              attributeName="r"
              values="6;48"
              dur="1.6s"
              begin="0.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.4;0"
              dur="1.6s"
              begin="0.5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="10" fill="#fbbf24" stroke="#fff" strokeWidth="3" />
        </g>
      )}
    </svg>
  );
}

/**
 * Like WorldMap but plots multiple markers (used by the hook and closer).
 */
export function WorldMapMulti({
  markers,
  width = 1080,
  height = 960,
}: {
  markers: Array<{ coords: [number, number]; id: string; highlight?: boolean }>;
  width?: number;
  height?: number;
}) {
  const { paths, pixels } = useMemo(() => {
    const projection = geoNaturalEarth1()
      .scale(width / 5.5)
      .translate([width / 2, height / 2]);
    const path = geoPath(projection);
    const paths = COUNTRY_FEATURES.map((f) => ({
      id: String(f.id),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      d: path(f as any) ?? "",
    }));
    const pixels = markers.map((m) => ({
      ...m,
      pixel: projection(m.coords),
    }));
    return { paths, pixels };
  }, [markers, width, height]);

  const highlightSet = new Set(
    markers.filter((m) => m.highlight).map((m) => m.id)
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
    >
      <rect width={width} height={height} fill="#0a0e1a" />
      {paths.map((p) => (
        <path
          key={p.id}
          d={p.d}
          fill={highlightSet.has(p.id) ? "#1e3a8a" : "#1e293b"}
          stroke={highlightSet.has(p.id) ? "#60a5fa" : "#0f172a"}
          strokeWidth={highlightSet.has(p.id) ? 1.5 : 0.5}
        />
      ))}
      {pixels.map((m, i) =>
        m.pixel ? (
          <g
            key={`${m.id}-${i}`}
            transform={`translate(${m.pixel[0]}, ${m.pixel[1]})`}
          >
            <circle r="0" fill="#fbbf24" opacity="0.5">
              <animate
                attributeName="r"
                values="4;28"
                dur="1.8s"
                begin={`${(i * 0.15).toFixed(2)}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.6;0"
                dur="1.8s"
                begin={`${(i * 0.15).toFixed(2)}s`}
                repeatCount="indefinite"
              />
            </circle>
            <circle r="7" fill="#fbbf24" stroke="#fff" strokeWidth="2" />
          </g>
        ) : null
      )}
    </svg>
  );
}
