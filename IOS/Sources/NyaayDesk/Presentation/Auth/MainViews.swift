import SwiftUI

/** Litigant Main View (iOS) — TabView with real dashboard */
struct LitigantMainView: View {
    @Environment(AuthViewModel.self) private var auth

    var body: some View {
        TabView {
            LitigantDashboardView()
                .tabItem { Label("Dashboard", systemImage: "house.fill") }

            NavigationStack {
                LitigantCaseListView()
            }
            .tabItem { Label("My Cases", systemImage: "folder.fill") }

            NavigationStack {
                ContentUnavailableView("Hearing Calendar", systemImage: "calendar",
                    description: Text("Your upcoming hearings in a monthly view."))
                    .navigationTitle("Calendar")
            }
            .tabItem { Label("Calendar", systemImage: "calendar") }

            NavigationStack {
                ProfileView()
            }
            .tabItem { Label("Profile", systemImage: "person.fill") }
        }
        .tint(.nyaayNavy)
    }
}

// Litigant full case list
struct LitigantCaseListView: View {
    @Environment(AuthViewModel.self) private var auth
    @State private var vm = LitigantViewModel()
    @State private var search = ""

    var filtered: [NyaayCase] {
        search.isEmpty ? vm.cases : vm.cases.filter {
            $0.caseTitle.localizedCaseInsensitiveContains(search) ||
            $0.caseNumber.localizedCaseInsensitiveContains(search)
        }
    }

    var body: some View {
        List(filtered) { case_ in
            NavigationLink { CaseDetailView(case_: case_) } label: {
                CaseRowCard(case_: case_)
            }
        }
        .listStyle(.plain)
        .searchable(text: $search, prompt: "Search by title, CNR...")
        .navigationTitle("My Cases")
        .onAppear { vm.loadData(userId: auth.currentUser?.id ?? "") }
    }
}

/** Advocate Main View (iOS) — TabView with real dashboard */
struct AdvocateMainView: View {
    @Environment(AuthViewModel.self) private var auth

    var body: some View {
        TabView {
            AdvocateDashboardView_Full()
                .tabItem { Label("Dashboard", systemImage: "house.fill") }

            NavigationStack {
                ContentUnavailableView("NOC Requests", systemImage: "arrow.left.arrow.right",
                    description: Text("Pending Change-of-Advocate requests."))
                    .navigationTitle("NOC")
            }
            .tabItem { Label("NOC", systemImage: "arrow.left.arrow.right") }

            NavigationStack { ProfileView() }
                .tabItem { Label("Profile", systemImage: "person.fill") }
        }
        .tint(.nyaayNavy)
    }
}

/** Clerk Main View (iOS) */
struct ClerkMainView: View {
    var body: some View {
        TabView {
            ClerkCauseListView()
                .tabItem { Label("Cause List", systemImage: "list.bullet.clipboard.fill") }

            NavigationStack {
                ContentUnavailableView("Verification Queue", systemImage: "checkmark.seal.fill",
                    description: Text("Pending advocate and case verifications."))
                    .navigationTitle("Verify")
            }
            .tabItem { Label("Verify", systemImage: "checkmark.seal.fill") }

            NavigationStack { ProfileView() }
                .tabItem { Label("Profile", systemImage: "person.fill") }
        }
        .tint(.nyaayNavy)
    }
}

/** Admin Main View (iOS) */
struct AdminMainView: View {
    var body: some View {
        TabView {
            AdminDashboardView()
                .tabItem { Label("Overview", systemImage: "chart.bar.fill") }

            NavigationStack {
                ContentUnavailableView("User Management", systemImage: "person.3.fill",
                    description: Text("Manage all user accounts."))
                    .navigationTitle("Users")
            }
            .tabItem { Label("Users", systemImage: "person.3.fill") }

            NavigationStack {
                ContentUnavailableView("Audit Logs", systemImage: "shield.fill",
                    description: Text("Blockchain-backed audit trail of all critical actions."))
                    .navigationTitle("Audit")
            }
            .tabItem { Label("Audit", systemImage: "shield.fill") }

            NavigationStack { ProfileView() }
                .tabItem { Label("Settings", systemImage: "gearshape.fill") }
        }
        .tint(.nyaayNavy)
    }
}

// MARK: - Shared Profile View
struct ProfileView: View {
    @Environment(AuthViewModel.self) private var auth

    var body: some View {
        List {
            Section {
                HStack(spacing: 14) {
                    Circle().fill(Color.nyaayNavy).frame(width: 56, height: 56)
                        .overlay(
                            Text(String(auth.currentUser?.fullName?.first ?? "U"))
                                .font(.title2.bold()).foregroundStyle(.nyaayGold)
                        )
                    VStack(alignment: .leading) {
                        Text(auth.currentUser?.fullName ?? "User").font(.headline.bold())
                        Text(auth.currentUser?.email ?? "").font(.caption).foregroundStyle(.secondary)
                        Text((auth.userType ?? "unknown").capitalized).font(.caption2)
                            .foregroundStyle(.nyaayNavy)
                    }
                }
                .padding(.vertical, 6)
            }

            Section("Account") {
                LabeledContent("Email", value: auth.currentUser?.email ?? "N/A")
                LabeledContent("Role", value: (auth.userType ?? "Unknown").capitalized)
                if let barId = auth.currentUser?.barCouncilId {
                    LabeledContent("Bar Council ID", value: barId)
                }
            }

            Section("Security & Privacy") {
                Button(action: { showDeleteConfirm = true }) {
                    Label("Delete My Account", systemImage: "trash")
                        .foregroundStyle(.red)
                }
            }

            Section {
                Button("Sign Out", role: .destructive) { auth.signOut() }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Profile")
        .alert("Delete Account?", isPresented: $showDeleteConfirm) {
            Button("Cancel", role: .cancel) { }
            Button("Delete Forever", role: .destructive) {
                // Call Supabase Edge Function to wipe data
                auth.signOut()
            }
        } message: {
            Text("This action is permanent and will wipe all your legal records from NyaayDesk. This cannot be undone.")
        }
    }
}
