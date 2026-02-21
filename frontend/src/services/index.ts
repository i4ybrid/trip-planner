import { realApi } from './api';
import { mockApi, mockTrip } from './mock-api';

const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

export const api = USE_MOCK_API ? mockApi : realApi;

export { mockApi, mockTrip, realApi };
