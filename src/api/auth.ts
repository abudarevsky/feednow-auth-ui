import type { ApiClient, ApiResponse } from '@/api/client'
import type {
  AuthOutcome,
  LoginRequest,
  RegistrationRequest,
  ResendVerificationRequest,
  SessionResponse,
  VerifyEmailRequest,
} from '@/types/browser-api'

type ChallengeResponseRequest = { response: string }
type HandoffRequest = { client_id: string; state: string | null }
type HandoffResponse = { redirect_url: string }
type FederationRequest = { provider: string; client_id: string; state: string | null }
type FederationResponse = { authorization_url: string }
type ResetConfirmRequest = { challenge_id: string; code: string; new_password: string }

function createAuthApi(client: ApiClient) {
  return {
    getSession(signal?: AbortSignal): Promise<ApiResponse<SessionResponse>> {
      return client.request('/api/v1/session', { signal })
    },
    bootstrapCsrf(signal?: AbortSignal): Promise<ApiResponse<void>> {
      return client.request('/api/v1/csrf', { signal })
    },
    login(body: LoginRequest, signal?: AbortSignal): Promise<ApiResponse<AuthOutcome>> {
      return client.request('/api/v1/auth/login', { method: 'POST', body, signal })
    },
    completeChallenge(challengeId: string, body: ChallengeResponseRequest, signal?: AbortSignal): Promise<ApiResponse<AuthOutcome>> {
      return client.request(`/api/v1/auth/challenges/${encodeURIComponent(challengeId)}`, { method: 'POST', body, signal })
    },
    handoff(body: HandoffRequest, signal?: AbortSignal): Promise<ApiResponse<HandoffResponse>> {
      return client.request('/api/v1/auth/handoff', { method: 'POST', body, signal })
    },
    startFederation(body: FederationRequest, signal?: AbortSignal): Promise<ApiResponse<FederationResponse>> {
      return client.request('/api/v1/auth/federation', { method: 'POST', body, signal })
    },
    register(body: RegistrationRequest, signal?: AbortSignal): Promise<ApiResponse<{ status: 'verification_required'; challenge_id: string }>> {
      return client.request('/api/v1/auth/registrations', { method: 'POST', body, signal })
    },
    verifyEmail(body: VerifyEmailRequest, signal?: AbortSignal): Promise<ApiResponse<{ status: 'verified' }>> {
      return client.request('/api/v1/auth/email-verifications', { method: 'POST', body, signal })
    },
    resendVerification(body: ResendVerificationRequest, signal?: AbortSignal): Promise<ApiResponse<{ status: 'accepted' }>> {
      return client.request('/api/v1/auth/email-verifications/resend', { method: 'POST', body, signal })
    },
    requestPasswordReset(body: { email: string }, signal?: AbortSignal): Promise<ApiResponse<{ status: 'accepted' }>> {
      return client.request('/api/v1/auth/password-resets', { method: 'POST', body, signal })
    },
    confirmPasswordReset(body: ResetConfirmRequest, signal?: AbortSignal): Promise<ApiResponse<{ status: 'completed' }>> {
      return client.request('/api/v1/auth/password-resets/confirm', { method: 'POST', body, signal })
    },
    logout(signal?: AbortSignal): Promise<ApiResponse<void>> {
      return client.request('/api/v1/logout', { method: 'POST', body: {}, signal })
    },
  }
}

export { createAuthApi }
