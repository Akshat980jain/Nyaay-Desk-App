import SwiftUI

/**
 * NyaayDesk iOS App Entry Point.
 * @Environment object injects the AuthViewModel globally.
 * The RootView decides to show Auth or Main content based on session state.
 */
@main
struct NyaayDeskApp: App {
    @State private var authViewModel = AuthViewModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(authViewModel)
        }
    }
}

/**
 * RootView — watches authentication state and routes accordingly.
 * No user session -> RoleSelectView (Auth flow)
 * Valid session found -> Role-specific MainView
 */
struct RootView: View {
    @Environment(AuthViewModel.self) private var auth

    var body: some View {
        Group {
            if auth.isAuthenticated {
                switch auth.userType?.lowercased() {
                case "litigant":
                    LitigantMainView()
                case "advocate":
                    AdvocateMainView()
                case "clerk":
                    ClerkMainView()
                case "admin":
                    AdminMainView()
                default:
                    RoleSelectView()
                }
            } else {
                RoleSelectView()
            }
        }
        .animation(.easeInOut(duration: 0.3), value: auth.isAuthenticated)
    }
}
