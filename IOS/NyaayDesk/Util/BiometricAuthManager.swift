import Foundation
import LocalAuthentication

/**
 * BiometricAuthManager (iOS) — Handles FaceID and TouchID.
 * 
 * Provides secondary authentication for Admin and Clerk roles.
 */
@MainActor
final class BiometricAuthManager: ObservableObject {
    @Published var isUnlocked = false
    @Published var errorMessage: String?

    func authenticate() {
        let context = LAContext()
        var error: NSError?

        if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
            let reason = "Authenticate to access NyaayDesk secure portal"

            context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason) { success, authenticationError in
                DispatchQueue.main.async {
                    if success {
                        self.isUnlocked = true
                    } else {
                        self.errorMessage = authenticationError?.localizedDescription ?? "Authentication failed"
                    }
                }
            }
        } else {
            self.errorMessage = "Biometrics not available"
        }
    }
}
