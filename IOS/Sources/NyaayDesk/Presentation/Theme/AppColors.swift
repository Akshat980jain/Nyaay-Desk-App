import SwiftUI

/**
 * NyaayDesk Design System — Colors
 * Based on the Modern-Premium (Cream & Navy) Blueprint.
 */
extension Color {
    static let appNavy = Color(hex: "0D1B2A")
    static let appNavyDark = Color(hex: "060D14")
    static let appGold = Color(hex: "F5A623")
    static let appBackground = Color(hex: "F8F9FA")
    static let appSurface = Color.white
    
    // Semantic Status
    static let appApproved = Color(hex: "2E7D32")
    static let appPending = Color(hex: "F5A623")
    static let appUrgent = Color(hex: "BA1A1A")
    static let appDisposed = Color(hex: "74777D")

    
    // Hex helper
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
