import SwiftUI

// MARK: - Brand Colors
extension Color {
    static let nyaayNavy       = Color(hex: "0F2C59")
    static let nyaayNavyDark   = Color(hex: "081D3B")
    static let nyaayNavyLight  = Color(hex: "1A3F7A")
    static let nyaayGold       = Color(hex: "DAC0A3")
    static let nyaayOffWhite   = Color(hex: "F8F0E5")
    static let statusPending   = Color(hex: "FFC107")
    static let statusDisposed  = Color(hex: "4CAF50")
    static let statusStayed    = Color(hex: "F44336")
    static let statusActive    = Color(hex: "2196F3")

    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8) & 0xFF) / 255
        let b = Double(int & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}

// MARK: - Shared Auth Background Modifier
struct NyaayAuthBackground: ViewModifier {
    func body(content: Content) -> some View {
        ZStack {
            LinearGradient(
                colors: [.nyaayNavyDark, .nyaayNavy],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
            content
        }
    }
}

extension View {
    func nyaayAuthBackground() -> some View {
        modifier(NyaayAuthBackground())
    }
}

// MARK: - NyaayButton (iOS)
struct NyaayButton: View {
    let title: String
    let isLoading: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack {
                RoundedRectangle(cornerRadius: 14)
                    .fill(Color.nyaayNavy)
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)

                if isLoading {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .tint(.nyaayGold)
                } else {
                    Text(title)
                        .font(.headline)
                        .foregroundStyle(.nyaayGold)
                }
            }
        }
        .disabled(isLoading)
    }
}

// MARK: - NyaayTextField (iOS)
struct NyaayTextField: View {
    let label: String
    @Binding var text: String
    var isSecure: Bool = false
    var systemImage: String = "envelope"
    var errorMessage: String? = nil

    @State private var isVisible = false

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Image(systemName: systemImage)
                    .foregroundStyle(.nyaayNavy.opacity(0.6))
                    .frame(width: 20)

                if isSecure && !isVisible {
                    SecureField(label, text: $text)
                } else {
                    TextField(label, text: $text)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                }

                if isSecure {
                    Button(action: { isVisible.toggle() }) {
                        Image(systemName: isVisible ? "eye.slash" : "eye")
                            .foregroundStyle(.nyaayNavy.opacity(0.5))
                    }
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(errorMessage != nil ? .red : Color.nyaayNavy.opacity(0.3), lineWidth: 1.5)
                    .background(RoundedRectangle(cornerRadius: 12).fill(Color.white))
            )

            if let error = errorMessage {
                Text(error).font(.caption).foregroundStyle(.red)
            }
        }
    }
}

// MARK: - CaseStatusBadge
struct CaseStatusBadge: View {
    let status: String

    private var color: Color {
        switch status.lowercased() {
        case "pending": return .statusPending
        case "disposed": return .statusDisposed
        case "stayed": return .statusStayed
        default: return .statusActive
        }
    }

    var body: some View {
        Text(status.capitalized)
            .font(.caption2.bold())
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.15))
            .foregroundStyle(color)
            .clipShape(Capsule())
            .overlay(Capsule().stroke(color.opacity(0.4), lineWidth: 1))
    }
}
