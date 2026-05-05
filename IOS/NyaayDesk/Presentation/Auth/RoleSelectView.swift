import SwiftUI

/**
 * Role Selection View — the first screen iOS users see.
 * A 2x2 grid of portal cards, each navigating to its login screen.
 */
struct RoleSelectView: View {
    @State private var selectedRole: String? = nil
    @State private var showLogin = false

    private let roles: [(title: String, subtitle: String, icon: String, role: String)] = [
        ("Litigant", "Citizen Portal", "person.fill", "litigant"),
        ("Advocate", "Lawyer Portal", "scale.3d", "advocate"),
        ("Clerk", "Court Operations", "gavel", "clerk"),
        ("Admin", "System Oversight", "shield.fill", "admin")
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(colors: [.nyaayNavyDark, .nyaayNavy], startPoint: .top, endPoint: .bottom)
                    .ignoresSafeArea()

                VStack(spacing: 32) {
                    // Header
                    VStack(spacing: 8) {
                        Text("⚖️").font(.system(size: 64))
                        Text("NyaayDesk")
                            .font(.largeTitle.bold())
                            .foregroundStyle(.nyaayGold)
                        Text("न्याय your way")
                            .font(.subheadline)
                            .foregroundStyle(.white.opacity(0.7))
                    }

                    // Role Grid
                    VStack(spacing: 12) {
                        Text("Select your portal to continue")
                            .font(.headline)
                            .foregroundStyle(.white)

                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                            ForEach(roles, id: \.role) { item in
                                RoleCard(title: item.title, subtitle: item.subtitle, icon: item.icon) {
                                    selectedRole = item.role
                                    showLogin = true
                                }
                            }
                        }
                    }
                    .padding(.horizontal)
                }
            }
            .navigationDestination(isPresented: $showLogin) {
                if let role = selectedRole {
                    LoginView(expectedRole: role)
                }
            }
        }
    }
}

private struct RoleCard: View {
    let title: String
    let subtitle: String
    let icon: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 10) {
                Image(systemName: icon)
                    .font(.system(size: 30))
                    .foregroundStyle(.nyaayGold)
                Text(title)
                    .font(.headline.bold())
                    .foregroundStyle(.white)
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.7))
            }
            .frame(maxWidth: .infinity)
            .padding(20)
            .background(.white.opacity(0.12))
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
    }
}
