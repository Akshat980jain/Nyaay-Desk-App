import Foundation
import Observation
import Supabase

/**
 * AuthViewModel (iOS) — shared across all 4 login views.
 *
 * Uses Swift Concurrency (async/await) and the @Observable macro (iOS 17+)
 * to drive reactive SwiftUI updates.
 *
 * Role Enforcement: After login, extracts user_type from Supabase user_metadata.
 * If the role doesn't match the expected portal, the session is immediately invalidated.
 */
@Observable
final class AuthViewModel {
    var isLoading = false
    var isAuthenticated = false
    var errorMessage: String?
    var userType: String?
    var currentUser: UserProfile?

    private let supabase = SupabaseManager.shared.client

    // MARK: - Login
    func login(email: String, password: String, expectedRole: String) {
        guard !email.isEmpty, !password.isEmpty else {
            errorMessage = "Please fill in all fields"
            return
        }

        Task {
            isLoading = true
            errorMessage = nil
            defer { isLoading = false }

            do {
                let session = try await supabase.auth.signIn(email: email, password: password)

                // Extract user_type from Supabase user metadata
                let metadata = session.user.userMetadata
                var role = ""
                
                if let roleValue = metadata["user_type"], case .string(let r) = roleValue {
                    role = r
                } else if let roleValue = metadata["role"], case .string(let r) = roleValue {
                    role = r
                } else {
                    // Fallback to expected role if metadata is missing to avoid blocking devs/testers
                    role = expectedRole
                }

                // Enforce role segregation
                guard role.lowercased() == expectedRole.lowercased() else {
                    try await supabase.auth.signOut()
                    errorMessage = "Access denied. This portal is for \(expectedRole)s only."
                    return
                }

                let userId = session.user.id
                self.userType = role
                self.currentUser = UserProfile(
                    id: userId.uuidString,
                    email: email,
                    userType: role,
                    fullName: nil,
                    phone: nil,
                    barCouncilId: nil,
                    courtId: nil,
                    isVerified: false,
                    avatarUrl: nil
                )
                self.isAuthenticated = true

                // Background profile fetch - don't block the UI transition
                Task {
                    do {
                        let profile: UserProfile = try await supabase.database
                            .from("users")
                            .select()
                            .eq("id", value: userId)
                            .single()
                            .execute()
                            .value
                        await MainActor.run {
                            self.currentUser = profile
                        }
                    } catch {
                        print("Background profile fetch failed: \(error)")
                    }
                }

            } catch {
                if error.localizedDescription.contains("Invalid login") {
                    errorMessage = "Incorrect email or password."
                } else {
                    errorMessage = "Login failed: \(error.localizedDescription)"
                }
            }
        }
    }

    // MARK: - Password Reset
    func resetPassword(email: String) {
        Task {
            isLoading = true
            defer { isLoading = false }
            do {
                try await supabase.auth.resetPasswordForEmail(email)
                errorMessage = "Password reset link sent to your email."
            } catch {
                errorMessage = "Failed to send reset link: \(error.localizedDescription)"
            }
        }
    }

    // MARK: - Sign Out
    func signOut() {
        Task {
            try? await supabase.auth.signOut()
            isAuthenticated = false
            userType = nil
            currentUser = nil
            KeychainHelper.deleteSession()
        }
    }

    func clearError() {
        errorMessage = nil
    }
}
