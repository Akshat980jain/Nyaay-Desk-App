import Foundation
import Security

/**
 * KeychainHelper — secure storage for Supabase session tokens on iOS.
 *
 * Replaces localStorage (web) or SharedPreferences (Android) with the iOS Keychain,
 * which is hardware-backed and protected by the Secure Enclave.
 * Session survives app reinstalls when using iCloud Keychain sync.
 */
final class KeychainHelper {

    private static let service = "com.nyaaydesk.app"
    private static let sessionKey = "supabase_session"

    // MARK: - Save
    static func saveSession(_ data: Data) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: sessionKey,
            kSecValueData as String: data
        ]
        SecItemDelete(query as CFDictionary) // Delete existing before saving
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.saveFailed(status)
        }
    }

    // MARK: - Read
    static func loadSession() throws -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: sessionKey,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess else {
            throw KeychainError.readFailed(status)
        }
        return result as? Data
    }

    // MARK: - Delete
    static func deleteSession() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: sessionKey
        ]
        SecItemDelete(query as CFDictionary)
    }

    // MARK: - Error
    enum KeychainError: LocalizedError {
        case saveFailed(OSStatus)
        case readFailed(OSStatus)

        var errorDescription: String? {
            switch self {
            case .saveFailed(let status): return "Keychain save failed: \(status)"
            case .readFailed(let status): return "Keychain read failed: \(status)"
            }
        }
    }
}
