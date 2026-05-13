import SwiftUI

// MARK: - Brand Colors (Consolidated)
extension Color {
    // Colors are now primarily defined in AppColors.swift
    // These static properties serve as convenient accessors
    static let statusApprovedColor = Color.appApproved
    static let statusPendingColor  = Color.appPending
    static let statusUrgentColor   = Color.appUrgent
    static let statusActiveColor   = Color.appNavy
}

// MARK: - Shared Auth Background Modifier
struct NyaayAuthBackground: ViewModifier {
    func body(content: Content) -> some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            content
        }
    }
}

extension View {
    func nyaayAuthBackground() -> some View {
        modifier(NyaayAuthBackground())
    }
}

// MARK: - NyaayButton (iOS) — Gold/Amber background, Deep Navy text
struct NyaayButton: View {
    let title: String
    let isLoading: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.appGold)
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)

                if isLoading {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .tint(Color.appNavy)
                } else {
                    Text(title)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Color.appNavy)
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
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 12) {
                Image(systemName: systemImage)
                    .foregroundStyle(Color.appNavy.opacity(0.8))
                    .font(.system(size: 18))
                    .frame(width: 24)

                if isSecure && !isVisible {
                    SecureField(label, text: $text)
                        .font(.system(size: 16))
                } else {
                    TextField(label, text: $text)
                        .font(.system(size: 16))
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                }

                if isSecure {
                    Button(action: { isVisible.toggle() }) {
                        Image(systemName: isVisible ? "eye.slash" : "eye")
                            .foregroundStyle(Color.appNavy.opacity(0.5))
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 18)
            .background(
                RoundedRectangle(cornerRadius: 8) // Updated to 8px as per Stitch
                    .stroke(errorMessage != nil ? .red : Color.appNavy.opacity(0.1), lineWidth: 1)
                    .background(RoundedRectangle(cornerRadius: 8).fill(Color.white))
            )

            if let error = errorMessage {
                Text(error).font(.caption).foregroundStyle(.red).padding(.leading, 4)
            }
        }
    }
}

// MARK: - CaseStatusBadge (Stitch design)
struct CaseStatusBadge: View {
    let status: String

    private var badgeStyle: (bg: Color, fg: Color, label: String, outlined: Bool) {
        switch status.lowercased() {
        case "hearing", "scheduled", "hearing scheduled":
            return (Color.appGold, Color.appNavy, "HEARING", false)
        case "filed":
            return (Color.appNavy.opacity(0.1), Color.appNavy, "FILED", false)
        case "disposed":
            return (Color(hex: "F0F1F2"), Color(hex: "74777D"), "DISPOSED", false)
        case "urgent":
            return (Color.appUrgent.opacity(0.12), Color.appUrgent, "URGENT", false)
        case "pending":
            return (Color.clear, Color(hex: "74777D"), "PENDING", true)
        case "active":
            return (Color.appApproved.opacity(0.1), Color.appApproved, "ACTIVE", false)
        default:
            return (Color.appNavy.opacity(0.08), Color.appNavy, status.uppercased(), false)
        }
    }

    var body: some View {
        let style = badgeStyle
        Text(style.label)
            .font(.system(size: 10, weight: .bold))
            .foregroundStyle(style.fg)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(style.bg)
            .overlay(
                Capsule().stroke(
                    style.outlined ? Color(hex: "74777D").opacity(0.5) : Color.clear,
                    lineWidth: 1
                )
            )
            .clipShape(Capsule())
    }
}
