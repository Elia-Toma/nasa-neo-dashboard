import createFetchClient from '../hooks/useFetch';
import { AsteroidDetails, AsteroidsResponse, ChartResponse } from '../models/Asteroid';

// API client instance
const fetchClient = createFetchClient();

export const nasaService = {
    /**
     * Fetch list of near-earth objects matching filters.
     */
    getAsteroids: async (
        startDate: string,
        endDate: string,
        hazardousOnly: boolean = false,
        sortBy?: string
    ): Promise<AsteroidsResponse> => {
        try {
            const params = new URLSearchParams({
                start_date: startDate,
                end_date: endDate,
                hazardous_only: String(hazardousOnly)
            });

            if (sortBy) {
                params.append('sort_by', sortBy);
            }

            const { data } = await fetchClient(`/asteroids?${params.toString()}`);
            return data as AsteroidsResponse;
        } catch (error) {
            console.error("nasaService.getAsteroids failed", error);
            throw error;
        }
    },

    /**
     * Fetch formatted charting metrics.
     */
    getAsteroidsChartData: async (
        startDate: string,
        endDate: string
    ): Promise<ChartResponse> => {
        try {
            const params = new URLSearchParams({
                start_date: startDate,
                end_date: endDate
            });

            const { data } = await fetchClient(`/asteroids/charts?${params.toString()}`);
            return data as ChartResponse;
        } catch (error) {
            console.error("nasaService.getAsteroidsChartData failed", error);
            throw error;
        }
    },

    /**
     * Fetch detailed lookup profile by asteroid ID.
     */
    getAsteroidDetails: async (asteroidId: string): Promise<AsteroidDetails> => {
        try {
            const { data } = await fetchClient(`/asteroids/${asteroidId}`);
            return data as AsteroidDetails;
        } catch (error) {
            console.error(`nasaService.getAsteroidDetails failed for ID: ${asteroidId}`, error);
            throw error;
        }
    }
};
