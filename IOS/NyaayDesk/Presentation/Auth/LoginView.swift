import SwiftUI

/**
 * Unified LoginView for all 4 roles (iOS).
 * The `expectedRole` parameter determines:
 *   1. The title and subtitle shown in the header.
 *   2. Which role is validated after successful Supabase auth.
 *
 * This single view replaces 4 separate screens — DRY principle.
 */
struct LoginView: View {
    let expectedRole: String

    @Environment(AuthViewModel.self) private var auth
    @State private var email = ""
    @State private var password = ""
    @State private var showForgotPassword = false
    @State private var resetEmail = ""
    @Environment(\.dismiss) private var dismiss

    private var title: String {
        switch expectedRole {
        case "litigant": return "Litigant Login"
        case "advocate": return "Advocate Login"
        case "clerk": return "Court Clerk Login"
        case "admin": return "Admin Portal"
        default: return "Login"
        }
    }

    private var subtitle: String {
        switch expectedRole {
        case "litigant": return "Access your case information"
        case "advocate": return "Access your legal practice dashboard"
        case "clerk": return "Court operations management portal"
        case "admin": return "Restricted — authorized personnel only"
        default: return ""
        }
    }

    var body: some View {
        ZStack {
            LinearGradient(colors: [.nyaayNavyDark, .nyaayNavy], startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                VStack(spacing: 6) {
                    Text("⚖️").font(.system(size: 44))
                    Text(title).font(.title2.bold()).foregroundStyle(.nyaayGold)
                    Text(subtitle).font(.subheadline).foregroundStyle(.white.opacity(0.7))
                }
                .padding(.vertical, 24)

                // Form Card
                ScrollView {
                    VStack(spacing: 16) {
                        // Admin Warning Banner
                        if expectedRole == "admin" {
                            HStack(spacing: 8) {
                                Image(systemName: "shield.fill").foregroundStyle(.red)
                                Text("Restricted Access: Unauthorized attempts are logged.")
                                    .font(.caption).foregroundStyle(.red)
                            }
                            .padding(12)
                            .background(.red.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                        }

                        // Error Banner
                        if let error = auth.errorMessage {
                            HStack(spacing: 8) {
                                Image(systemName: "exclamationmark.circle")
                                Text(error).font(.subheadline)
                            }
                            .foregroundStyle(.red)
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(.red.opacity(0.08))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                        }

                        // Email
                        NyaayTextField(label: "Email Address", text: $email, systemImage: "envelope")
                            .onChange(of: email) { _, _ in auth.clearError() }
                            .keyboardType(.emailAddress)

                        // Password
                        NyaayTextField(label: "Password", text: $password, isSecure: true, systemImage: "lock")
                            .onChange(of: password) { _, _ in auth.clearError() }

                        // Forgot Password
                        HStack {
                            Spacer()
                            Button("Forgot Password?") { showForgotPassword = true }
                                .font(.subheadline).foregroundStyle(.nyaayNavy)
                        }

                        // Login Button
                        NyaayButton(title: "Login", isLoading: auth.isLoading) {
                            auth.login(email: email, password: password, expectedRole: expectedRole)
                        }

                        // Clerk session note
                        if expectedRole == "clerk" {
                            Label("Sessions expire after 15 minutes of inactivity.", systemImage: "clock")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(24)
                }
                .background(Color(.systemBackground))
                .clipShape(RoundedCornerShape(radius: 28, corners: [.topLeft, .topRight]))
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(false)
        .sheet(isPresented: $showForgotPassword) {
            ForgotPasswordSheet(email: $resetEmail) {
                auth.resetPassword(email: resetEmail)
                showForgotPassword = false
            }
        }
    }
}

// Custom shape for top-only rounded corners
struct RoundedCornerShape: Shape {
    var radius: CGFloat
    var corners: UIRectCorner

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(roundedRect: rect, byRoundingCorners: corners,
                                cornerRadii: CGSize(width: radius, height: radius))
        return Path(path.cgPath)
    }
}

// Forgot Password Bottom Sheet
struct ForgotPasswordSheet: View {
    @Binding var email: String
    let onSubmit: () -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Text("Enter your email address and we'll send you a password reset link.")
                    .font(.subheadline).foregroundStyle(.secondary)
                NyaayTextField(label: "Email Address", text: $email, systemImage: "envelope")
                NyaayButton(title: "Send Reset Link", isLoading: false, action: onSubmit)
            }
            .padding(24)
            .navigationTitle("Reset Password")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium])
    }
}
