import SwiftUI

/**
 * RoleSelectView — Redesigned to match Stitch home_landing_screen.
 *
 * Layout:
 * - Dark navy top bar: "Nyaay Desk" logo
 * - Institution icon + "Nyaay Desk" heading + subtitle
 * - CNR search box + gold "Search Now →" button
 * - "Access Portals" with 4 vertical role cards
 * - "Judicial Resources" section: dark navy Court Statistics card + white Daily Orders + E-Filing
 * - Bottom nav bar: navy bg, gold Home tab active
 */
import SwiftUI

/**
 * RoleSelectView — Implemented to match Stitch login_modern_tile_selection.
 */
struct RoleSelectView: View {
    @Environment(AuthViewModel.self) private var auth
    @State private var selectedRole = "Advocate"
    @State private var identifier = ""
    @State private var password = ""
    @State private var isPasswordVisible = false
    @State private var showRegistration = false
    @State private var navigateToMain = false

    let roles = [
        RoleInfo(name: "Advocate", icon: "gavel.fill"),
        RoleInfo(name: "Litigant", icon: "person.fill"),
        RoleInfo(name: "Clerk", icon: "folder.fill.badge.person.crop"),
        RoleInfo(name: "Admin", icon: "shield.lefthalf.filled")
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                // Decorative Background Split
                VStack(spacing: 0) {
                    Color.appNavy.frame(maxHeight: UIScreen.main.bounds.height * 0.35)
                    Color.appBackground.frame(maxHeight: .infinity)
                }
                .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        // Header Section
                        VStack(spacing: 8) {
                            Text("Nyaay Desk")
                                .font(.system(size: 32, weight: .bold))
                                .foregroundStyle(.white)
                            Text("Secure Judicial Access Portal")
                                .font(.system(size: 16))
                                .foregroundStyle(.white.opacity(0.7))
                        }
                        .padding(.top, 40)

                        // Main Card
                        VStack(spacing: 0) {
                            VStack(spacing: 24) {
                                Text("SELECT ROLE TO CONTINUE")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(Color.appNavy.opacity(0.6))
                                    .tracking(1)

                                // Role Grid
                                HStack(spacing: 12) {
                                    ForEach(roles, id: \.name) { role in
                                        RoleTileView(
                                            role: role,
                                            isSelected: selectedRole == role.name
                                        ) {
                                            selectedRole = role.name
                                        }
                                    }
                                }

                                // Login Form
                                let identifierLabel = "Email Address"
                                let identifierPlaceholder = "Enter your registered email"

                                VStack(alignment: .leading, spacing: 16) {
                                    VStack(alignment: .leading, spacing: 8) {
                                        Text(identifierLabel)
                                            .font(.system(size: 14, weight: .semibold))
                                            .foregroundStyle(Color.appNavy)
                                        
                                        TextField(identifierPlaceholder, text: $identifier)
                                            .foregroundStyle(Color.appNavy)
                                            .padding()
                                            .background(Color.white)
                                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "C4C6CC"), lineWidth: 1))
                                            .clipShape(RoundedRectangle(cornerRadius: 8))
                                    }

                                    VStack(alignment: .leading, spacing: 8) {
                                        Text("Password")
                                            .font(.system(size: 14, weight: .semibold))
                                            .foregroundStyle(Color.appNavy)
                                        
                                        HStack {
                                            if isPasswordVisible {
                                                TextField("Enter your password", text: $password)
                                                    .foregroundStyle(Color.appNavy)
                                            } else {
                                                SecureField("Enter your password", text: $password)
                                                    .foregroundStyle(Color.appNavy)
                                            }
                                            
                                            Button(action: { isPasswordVisible.toggle() }) {
                                                Image(systemName: isPasswordVisible ? "eye.slash.fill" : "eye.fill")
                                                    .foregroundStyle(Color.appNavy.opacity(0.5))
                                            }
                                        }
                                        .padding()
                                        .background(Color.white)
                                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "C4C6CC"), lineWidth: 1))
                                        .clipShape(RoundedRectangle(cornerRadius: 8))
                                    }

                                    HStack {
                                        HStack(spacing: 8) {
                                            Image(systemName: "square")
                                                .foregroundStyle(Color.appNavy.opacity(0.4))
                                            Text("Remember me")
                                                .font(.system(size: 12))
                                                .foregroundStyle(Color.appNavy.opacity(0.6))
                                        }
                                        Spacer()
                                        Button("Forgot Password?") {
                                        }
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundStyle(Color.appNavy)
                                    }

                                    if let errorMessage = auth.errorMessage {
                                        Text(errorMessage)
                                            .font(.system(size: 12))
                                            .foregroundStyle(.red)
                                            .frame(maxWidth: .infinity)
                                            .multilineTextAlignment(.center)
                                    }

                                    Button(action: {
                                        auth.login(email: identifier, password: password, expectedRole: selectedRole.lowercased())
                                    }) {
                                        HStack {
                                            if auth.isLoading {
                                                ProgressView()
                                                    .tint(Color.appNavy)
                                            } else {
                                                Text("Secure Login")
                                                    .font(.system(size: 18, weight: .bold))
                                                Image(systemName: "arrow.right")
                                            }
                                        }
                                        .frame(maxWidth: .infinity)
                                        .frame(height: 50)
                                        .background(Color.appGold)
                                        .foregroundStyle(Color.appNavy)
                                        .clipShape(RoundedRectangle(cornerRadius: 8))
                                        .shadow(color: Color.appGold.opacity(0.3), radius: 8, x: 0, y: 4)
                                    }
                                    .disabled(auth.isLoading)
                                }
                            }
                            .padding(24)

                            // Footer Actions
                            HStack(spacing: 32) {
                                Button(action: {}) {
                                    HStack(spacing: 4) {
                                        Image(systemName: "questionmark.circle")
                                        Text("Support")
                                    }
                                }
                                .font(.system(size: 12))
                                .foregroundStyle(Color.appNavy.opacity(0.6))

                                Button(action: { showRegistration = true }) {
                                    HStack(spacing: 4) {
                                        Image(systemName: "person.badge.plus")
                                        Text("Register")
                                    }
                                }
                                .font(.system(size: 12))
                                .foregroundStyle(Color.appNavy.opacity(0.6))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 20)
                            .background(Color(hex: "F3F4F5"))
                        }
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .shadow(color: .black.opacity(0.05), radius: 24, x: 0, y: 4)
                        .padding(.horizontal, 16)

                        // Security Badge
                        HStack(spacing: 8) {
                            Image(systemName: "lock.fill")
                                .font(.system(size: 14))
                            Text("End-to-End Encrypted Connection")
                                .font(.system(size: 12))
                        }
                        .foregroundStyle(Color.appNavy.opacity(0.5))
                        .padding(.top, 16)
                    }
                    .padding(.bottom, 40)
                }
            }
            .navigationBarHidden(true)
            .navigationDestination(isPresented: $showRegistration) {
                RegistrationView()
            }
        }
    }
}

private struct RoleTileView: View {
    let role: RoleInfo
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: role.icon)
                    .font(.system(size: 24))
                    .foregroundStyle(isSelected ? Color.appGold : Color.appNavy.opacity(0.5))
                Text(role.name)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(isSelected ? Color.appNavy : Color.appNavy.opacity(0.6))
            }
            .frame(maxWidth: .infinity)
            .aspectRatio(1, contentMode: .fit)
            .background(isSelected ? Color.appGold.opacity(0.1) : Color(hex: "F8F9FA"))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(isSelected ? Color.appGold : Color(hex: "C4C6CC"), lineWidth: isSelected ? 2 : 1))
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
    }
}

private struct RoleInfo {
    let name: String
    let icon: String
}

