import { apiRequest } from './api';
import { ApiError } from './api-error';

type ConsentResponse = {
  status: 'success';
  data: { granted: boolean };
};

/** Only a real boolean counts: anything else must never be read as consent. */
function readGranted(response: ConsentResponse | undefined): boolean {
  const granted = response?.data?.granted;
  if (typeof granted !== 'boolean') throw new ApiError(502, 'INVALID_RESPONSE');
  return granted;
}

/**
 * The user's choice about saving scan photos to improve the AI model. The backend is
 * the source of truth: it re-checks the latest saved choice before storing any photo.
 */
export const consentService = {
  /** Latest saved choice. The backend also answers `false` when the user was never asked. */
  async getAiTraining(): Promise<boolean> {
    return readGranted(await apiRequest<ConsentResponse>('/consents/ai-training'));
  },

  /** Saves the choice and returns what the backend confirmed. Throws if it could not be saved. */
  async setAiTraining(granted: boolean): Promise<boolean> {
    const confirmed = readGranted(
      await apiRequest<ConsentResponse>('/consents/ai-training', {
        method: 'PUT',
        body: JSON.stringify({ granted }),
      }),
    );
    // A confirmation that disagrees with the request is not a saved choice.
    if (confirmed !== granted) throw new ApiError(502, 'CONSENT_MISMATCH');
    return confirmed;
  },
};
