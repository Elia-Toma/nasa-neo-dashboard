// Backend-calculated approach and dimension fields
export interface ProcessedAsteroidData {
    close_approach_date: string;
    miss_distance_km: number;
    max_diameter_km: number;
}

export interface EstimatedDiameterUnit {
    estimated_diameter_min: number;
    estimated_diameter_max: number;
}

export interface EstimatedDiameter {
    kilometers?: EstimatedDiameterUnit;
    meters?: EstimatedDiameterUnit;
}

export interface RelativeVelocity {
    kilometers_per_second?: string;
    kilometers_per_hour?: string;
    miles_per_hour?: string;
}

export interface MissDistance {
    astronomical?: string;
    lunar?: string;
    kilometers?: string;
    miles?: string;
}

export interface CloseApproachData {
    close_approach_date: string;
    close_approach_date_full?: string;
    epoch_date_close_approach?: number;
    relative_velocity?: RelativeVelocity;
    miss_distance?: MissDistance;
    orbiting_body?: string;
}

export interface OrbitalData {
    orbit_id?: string;
    orbit_determination_date?: string;
    first_observation_date?: string;
    last_observation_date?: string;
    data_arc_in_days?: number;
    observations_used?: number;
    orbit_uncertainty?: string;
    minimum_orbit_intersection?: string;
    jupiter_tisserand_invariant?: string;
    epoch_osculation?: string;
    eccentricity?: string;
    semi_major_axis?: string;
    inclination?: string;
    ascending_node_longitude?: string;
    orbital_period?: string;
    perihelion_distance?: string;
    perihelion_argument?: string;
    aphelion_distance?: string;
    perihelion_time?: string;
    mean_anomaly?: string;
    mean_motion?: string;
    equinox?: string;
    orbit_class?: {
        orbit_class_type?: string;
        orbit_class_description?: string;
        orbit_class_range?: string;
    };
}

// Combined asteroid schema returned by list endpoint
export interface Asteroid {
    id: string;
    name: string;
    designation?: string;
    absolute_magnitude_h: number;
    is_potentially_hazardous_asteroid: boolean;
    is_sentry_object: boolean;
    nasa_jpl_url: string;
    estimated_diameter?: EstimatedDiameter;
    close_approach_data?: CloseApproachData[];
    orbital_data?: OrbitalData;
    // Standard subset of JPL NeoWs response attributes
    _processed: ProcessedAsteroidData;
}

export type AsteroidDetails = Omit<Asteroid, "_processed"> & {
    _processed?: ProcessedAsteroidData;
};

// GET /api/asteroids response schema
export interface AsteroidsResponse {
    count: number;
    results: Asteroid[];
    upstream_errors: string[];
}

// Recharts scatter/bar data metrics representation
export interface ChartDataPoint {
    date: string;
    name: string;
    distance_km: number;
    size_km: number;
    is_hazardous: boolean;
}

// GET /api/asteroids/charts response schema
export interface ChartResponse {
    chart_data: ChartDataPoint[];
}
