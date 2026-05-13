import SwiftUI

/** Litigant Main View (iOS) — TabView with real dashboard */
struct LitigantMainView: View {
    @Environment(AuthViewModel.self) private var auth
    @State private var showAIChat = false

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            TabView {
                LitigantDashboardView()
                    .tabItem { Label("Dashboard", systemImage: "house.fill") }

                NavigationStack {
                    LitigantCaseListView()
                }
                .tabItem { Label("My Cases", systemImage: "folder.fill") }

                NavigationStack {
                    VStack(spacing: 0) {
                        DatePicker("Hearing Date", selection: .constant(Date()), displayedComponents: .date)
                            .datePickerStyle(.graphical)
                            .tint(Color.appNavy)
                            .padding(20)
                            .background(Color.white)
                            .clipShape(RoundedRectangle(cornerRadius: 30))
                            .shadow(color: .black.opacity(0.04), radius: 10, y: 5)
                            .padding(24)

                        VStack(alignment: .leading, spacing: 16) {
                            Text("Scheduled Hearings")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundStyle(Color.appNavy)
                            
                            HStack(spacing: 16) {
                                ZStack {
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(Color.appNavy.opacity(0.05))
                                        .frame(width: 44, height: 44)
                                    Image(systemName: "calendar.badge.clock").foregroundStyle(Color.appNavy)
                                }
                                
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Evidence Submission").font(.system(size: 16, weight: .bold)).foregroundStyle(Color.appNavy)
                                    Text("Case DL-1002 • 10:30 AM").font(.system(size: 13)).foregroundStyle(Color.appNavy.opacity(0.5))
                                }
                            }
                            .padding(20)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.white)
                            .clipShape(RoundedRectangle(cornerRadius: 24))
                            .shadow(color: .black.opacity(0.03), radius: 8, y: 4)
                        }
                        .padding(.horizontal, 24)
                        Spacer()
                    }
                    .background(Color.appBackground)
                    .navigationTitle("Calendar")
                    .navigationBarTitleDisplayMode(.inline)
                }
                .tabItem { Label("Calendar", systemImage: "calendar") }

                NavigationStack {
                    ProfileView()
                }
                .tabItem { Label("Profile", systemImage: "person.fill") }
            }

            .tint(Color.appNavy)

            // AI FAB
            Button(action: { showAIChat = true }) {
                HStack(spacing: 8) {
                    Image(systemName: "sparkles")
                    Text("Nyaa AI")
                }
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(Color.appNavy)
                .clipShape(Capsule())
                .shadow(color: Color.appNavy.opacity(0.3), radius: 10, y: 5)
            }
            .padding(.trailing, 20)
            .padding(.bottom, 60) // Above TabBar
        }
        .fullScreenCover(isPresented: $showAIChat) {
            NyaaChatView()
        }

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
                VStack(spacing: 0) {
                    DatePicker("Hearing Schedule", selection: .constant(Date()), displayedComponents: .date)
                        .datePickerStyle(.graphical)
                        .tint(Color.appNavy)
                        .padding(20)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 30))
                        .shadow(color: .black.opacity(0.04), radius: 10, y: 5)
                        .padding(24)

                    VStack(alignment: .leading, spacing: 16) {
                        Text("My Hearings")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundStyle(Color.appNavy)
                        
                        HStack(spacing: 16) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(Color.appNavy.opacity(0.05))
                                    .frame(width: 44, height: 44)
                                Image(systemName: "gavel.fill").foregroundStyle(Color.appNavy)
                            }
                            
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Cross Examination").font(.system(size: 16, weight: .bold)).foregroundStyle(Color.appNavy)
                                Text("Session Court Room 4 • 11:00 AM").font(.system(size: 13)).foregroundStyle(Color.appNavy.opacity(0.5))
                            }
                        }
                        .padding(20)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 24))
                        .shadow(color: .black.opacity(0.03), radius: 8, y: 4)
                    }
                    .padding(.horizontal, 24)
                    Spacer()
                }
                .background(Color.appBackground)
                .navigationTitle("Calendar")
                .navigationBarTitleDisplayMode(.inline)
            }
            .tabItem { Label("Calendar", systemImage: "calendar") }

            NavigationStack {
                ContentUnavailableView("NOC Requests", systemImage: "arrow.left.arrow.right",
                    description: Text("Pending Change-of-Advocate requests."))
                    .navigationTitle("NOC")
            }
            .tabItem { Label("NOC", systemImage: "arrow.left.arrow.right") }

            NavigationStack { ProfileView() }
                .tabItem { Label("Profile", systemImage: "person.fill") }
        }
        .tint(Color.appNavy)
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
    @State private var showDeleteConfirm = false

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Profile Card
                VStack(spacing: 16) {
                    Circle()
                        .fill(Color.appNavy.opacity(0.1))
                        .frame(width: 80, height: 80)
                        .overlay(
                            Text(auth.currentUser?.fullName?.first?.uppercased() ?? "U")
                                .font(.system(size: 32, weight: .bold)).foregroundStyle(Color.appNavy)
                        )
                    
                    VStack(spacing: 4) {
                        Text(auth.currentUser?.fullName ?? "User").font(.system(size: 20, weight: .bold)).foregroundStyle(Color.appNavy)
                        Text(auth.currentUser?.email ?? "").font(.system(size: 14)).foregroundStyle(Color.appNavy.opacity(0.5))
                    }
                    
                    Text((auth.userType ?? "unknown").uppercased())
                        .font(.system(size: 10, weight: .black))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 4)
                        .background(Color.appNavy)
                        .foregroundStyle(.white)
                        .clipShape(Capsule())
                }
                .padding(.top, 40)

                // Info Sections
                VStack(spacing: 20) {
                    ProfileRow(icon: "person.fill", label: "Full Name", value: auth.currentUser?.fullName ?? "N/A")
                    ProfileRow(icon: "envelope.fill", label: "Email Address", value: auth.currentUser?.email ?? "N/A")
                    ProfileRow(icon: "shield.fill", label: "Account Role", value: (auth.userType ?? "Unknown").capitalized)
                    if let barId = auth.currentUser?.barCouncilId {
                        ProfileRow(icon: "briefcase.fill", label: "Bar Council ID", value: barId)
                    }
                }
                .padding(24)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 30))
                .shadow(color: .black.opacity(0.03), radius: 10, y: 5)
                .padding(.horizontal, 24)

                Spacer(minLength: 40)

                VStack(spacing: 12) {
                    Button(action: { auth.signOut() }) {
                        HStack {
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                            Text("Sign Out")
                        }
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(.red)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color.red.opacity(0.05))
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                    }
                    
                    Button(action: { showDeleteConfirm = true }) {
                        Text("Delete Account")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(.red.opacity(0.6))
                    }
                }
                .padding(.horizontal, 24)
            }
        }
        .background(Color.appBackground)
        .navigationTitle("Profile")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Delete Account?", isPresented: $showDeleteConfirm) {
            Button("Cancel", role: .cancel) { }
            Button("Delete Forever", role: .destructive) { auth.signOut() }
        } message: {
            Text("This action is permanent and will wipe all your legal records from NyaayDesk. This cannot be undone.")
        }
    }
}

private struct ProfileRow: View {
    let icon: String
    let label: String
    let value: String
    
    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                Circle().fill(Color.appNavy.opacity(0.05)).frame(width: 36, height: 36)
                Image(systemName: icon).font(.system(size: 14)).foregroundStyle(Color.appNavy)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(label).font(.system(size: 11)).foregroundStyle(Color.appNavy.opacity(0.4))
                Text(value).font(.system(size: 15, weight: .semibold)).foregroundStyle(Color.appNavy)
            }
            Spacer()
        }
    }
}

