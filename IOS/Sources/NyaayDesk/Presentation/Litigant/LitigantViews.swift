import SwiftUI

// MARK: - Litigant Dashboard (Stitch Design)
struct LitigantDashboardView: View {
    @Environment(AuthViewModel.self) private var auth
    @State private var vm = LitigantViewModel()
    @State private var selectedCase: NyaayCase? = nil

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottomTrailing) {
                ScrollView {
                    VStack(spacing: 0) {
                        // ── TOP NAV BAR ──────────────────────────────────
                        NyaayTopBarView()

                        // ── WELCOME HEADER ───────────────────────────────
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Welcome back, \(auth.currentUser?.fullName?.components(separatedBy: " ").first ?? "Rahul")")
                                .font(.system(size: 26, weight: .bold))
                                .foregroundStyle(Color.appNavy)
                            Text(auth.currentUser?.userId ?? "L-2024-089")
                                .font(.system(size: 13).monospaced())
                                .foregroundStyle(Color.appNavy.opacity(0.5))
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 20)

                        // ── ADVOCATE CHANGE STATUS ───────────────────────
                        HStack(spacing: 8) {
                            Image(systemName: "arrow.2.squarepath")
                                .foregroundStyle(Color.appGold)
                            Text("Advocate Change Status")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundStyle(Color.appNavy)
                            Spacer()
                        }
                        .padding(.horizontal, 16)
                        .padding(.bottom, 8)

                        // NOC Signed Card
                        NocStatusCard(
                            caseNumber: "CL2026M874",
                            lawyer: "ADV-GZB-001",
                            date: "05/08/2026",
                            isSigned: true
                        )

                        // NOC Pending Card
                        NocStatusCard(
                            caseNumber: "CL2025K112",
                            lawyer: "ADV-DEL-402",
                            date: "12/08/2026",
                            isSigned: false
                        )

                        // ── STAT CARDS ───────────────────────────────────
                        LitigantStatRow(
                            label: "Active Cases",
                            value: "\(vm.summary?.totalCases ?? 3)",
                            icon: "folder.fill"
                        )
                        LitigantStatRow(
                            label: "Upcoming Hearings",
                            value: "\(vm.summary?.todayHearings ?? 1)",
                            icon: "calendar"
                        )

                        Spacer().frame(height: 80)
                    }
                }
                .background(Color.appBackground)

                // ── GOLD FAB ─────────────────────────────────────────────
                Button(action: {}) {
                    Image(systemName: "person.fill.questionmark")
                        .font(.system(size: 22))
                        .foregroundStyle(Color.appGold)
                        .frame(width: 56, height: 56)
                        .background(Color.appNavy)
                        .clipShape(Circle())
                        .shadow(color: .black.opacity(0.15), radius: 8, y: 4)
                }
                .padding(.trailing, 16)
                .padding(.bottom, 80)
            }
            .navigationBarHidden(true)
            .navigationDestination(item: $selectedCase) { CaseDetailView(case_: $0) }
            .onAppear { vm.loadData(userId: auth.currentUser?.id ?? "") }
        }
    }
}

// MARK: - NOC Status Card
private struct NocStatusCard: View {
    let caseNumber: String
    let lawyer: String
    let date: String
    let isSigned: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(caseNumber)
                    .font(.system(size: 14, weight: .bold).monospaced())
                    .foregroundStyle(Color.appNavy)
                Spacer()
                if isSigned {
                    HStack(spacing: 4) {
                        Image(systemName: "checkmark.circle.fill")
                        Text("NOC SIGNED")
                    }
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 10).padding(.vertical, 5)
                    .background(Color.appNavy)
                    .clipShape(Capsule())
                } else {
                    HStack(spacing: 4) {
                        Image(systemName: "clock")
                        Text("PENDING NOC")
                    }
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(Color(hex: "74777D"))
                    .padding(.horizontal, 10).padding(.vertical, 5)
                    .overlay(Capsule().stroke(Color(hex: "74777D").opacity(0.4), lineWidth: 1))
                }
            }

            HStack(spacing: 32) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Current Lawyer").font(.system(size: 11)).foregroundStyle(Color.appNavy.opacity(0.5))
                    Text(lawyer).font(.system(size: 14, weight: .semibold)).foregroundStyle(Color.appNavy)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("Request Date").font(.system(size: 11)).foregroundStyle(Color.appNavy.opacity(0.5))
                    Text(date).font(.system(size: 14, weight: .semibold)).foregroundStyle(Color.appNavy)
                }
            }

            Divider()

            if isSigned {
                Button(action: {}) {
                    HStack {
                        Text("Submit to Court")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(Color.appNavy)
                        Image(systemName: "arrow.right")
                            .foregroundStyle(Color.appNavy)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(Color.appGold)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }
            } else {
                Button(action: {}) {
                    Text("Remind")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(Color.appNavy)
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.appNavy.opacity(0.3), lineWidth: 1))
                }
            }
        }
        .padding(16)
        .background(Color.white)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(isSigned ? Color.appGold.opacity(0.5) : Color(hex: "DEE2E6"), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .padding(.horizontal, 16)
        .padding(.vertical, 6)
    }
}

// MARK: - Litigant Stat Row
private struct LitigantStatRow: View {
    let label: String
    let value: String
    let icon: String

    var body: some View {
        HStack(spacing: 16) {
            Circle()
                .fill(Color.appNavy)
                .frame(width: 44, height: 44)
                .overlay(Image(systemName: icon).foregroundStyle(Color.appGold))
            VStack(alignment: .leading, spacing: 2) {
                Text(label).font(.system(size: 15, weight: .semibold)).foregroundStyle(Color.appNavy)
                Text(value).font(.system(size: 24, weight: .bold)).foregroundStyle(Color.appNavy)
            }
            Spacer()
        }
        .padding(16)
        .background(Color.white)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "DEE2E6"), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .padding(.horizontal, 16)
        .padding(.vertical, 6)
    }
}

// MARK: - Stitch Top Bar
struct NyaayTopBarView: View {
    var onLogout: (() -> Void)? = nil

    var body: some View {
        HStack {
            HStack(spacing: 8) {
                Image(systemName: "scalemass.fill")
                    .foregroundStyle(Color.appGold)
                    .font(.system(size: 18))
                Text("Nyaay Desk")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(Color.appGold)
            }
            Spacer()
            Button(action: { onLogout?() }) {
                Text("Logout")
                    .font(.system(size: 14))
                    .foregroundStyle(.white.opacity(0.85))
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.appNavy)
    }
}

// MARK: - Case Row Card (Stitch-style)
struct CaseRowCard: View {
    let case_: NyaayCase

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(case_.cnrNumber ?? case_.caseNumber)
                    .font(.system(size: 14, weight: .bold).monospaced())
                    .foregroundStyle(Color.appNavy)
                Spacer()
                CaseStatusBadge(status: case_.status)
            }

            HStack(spacing: 16) {
                HStack(spacing: 4) {
                    Image(systemName: "person.fill").font(.system(size: 12)).foregroundStyle(Color.appNavy.opacity(0.5))
                    Text("Type: \(case_.caseType ?? "Civil")").font(.system(size: 13)).foregroundStyle(Color.appNavy.opacity(0.7))
                }
                HStack(spacing: 4) {
                    Image(systemName: "building.columns.fill").font(.system(size: 12)).foregroundStyle(Color.appNavy.opacity(0.5))
                    Text("Court: \(case_.courtName ?? "District")").font(.system(size: 13)).foregroundStyle(Color.appNavy.opacity(0.7))
                }
            }

            if case_.status.lowercased() != "disposed" {
                Divider()
                HStack(spacing: 8) {
                    Button(action: {}) {
                        HStack(spacing: 4) {
                            Image(systemName: "calendar").font(.system(size: 12))
                            Text("View Hearings").font(.system(size: 12, weight: .medium))
                        }
                        .foregroundStyle(Color.appNavy)
                        .frame(maxWidth: .infinity).frame(height: 34)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.appNavy.opacity(0.3), lineWidth: 1))
                    }
                    Button(action: {}) {
                        HStack(spacing: 4) {
                            Image(systemName: "folder").font(.system(size: 12))
                            Text("Manage Documents").font(.system(size: 12, weight: .medium))
                        }
                        .foregroundStyle(Color.appNavy)
                        .frame(maxWidth: .infinity).frame(height: 34)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.appNavy.opacity(0.3), lineWidth: 1))
                    }
                }
            } else {
                Divider()
                Button(action: {}) {
                    HStack(spacing: 4) {
                        Image(systemName: "eye").font(.system(size: 12))
                        Text("View Archive").font(.system(size: 13))
                    }
                    .foregroundStyle(Color.appNavy.opacity(0.5))
                }
            }
        }
        .padding(16)
        .background(Color.white)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "DEE2E6"), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .padding(.horizontal, 16)
        .padding(.vertical, 6)
    }
}

// MARK: - Case Detail View (Stitch-style)
struct CaseDetailView: View {
    let case_: NyaayCase
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                NyaayTopBarView(onLogout: { dismiss() })

                // ── CASE HEADER ──────────────────────────────────────────
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(case_.cnrNumber ?? case_.caseNumber)
                                .font(.system(size: 13, weight: .semibold).monospaced())
                                .foregroundStyle(Color.appNavy.opacity(0.6))
                            Text("Civil Suit").font(.system(size: 12)).foregroundStyle(Color.appNavy.opacity(0.5))
                                .padding(.horizontal, 8).padding(.vertical, 2)
                                .background(Color.appNavy.opacity(0.07))
                                .clipShape(Capsule())
                        }
                        Spacer()
                        Text("HEARING SCHEDULED")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(Color.appNavy)
                            .padding(.horizontal, 10).padding(.vertical, 5)
                            .background(Color.appGold)
                            .clipShape(Capsule())
                    }
                    Text(case_.caseTitle)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(Color.appNavy)
                    Text(case_.description ?? "Property dispute regarding the commercial development project...")
                        .font(.system(size: 14))
                        .foregroundStyle(Color.appNavy.opacity(0.6))
                        .lineLimit(2)
                }
                .padding(16)
                .background(Color.white)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "DEE2E6"), lineWidth: 1))
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .padding(16)

                // ── NEXT HEARING (DARK NAVY CARD) ────────────────────────
                VStack(alignment: .leading, spacing: 16) {
                    HStack(spacing: 8) {
                        Image(systemName: "calendar.badge.clock").foregroundStyle(Color.appGold)
                        Text("Next Hearing").font(.system(size: 16, weight: .bold)).foregroundStyle(Color.appGold)
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Date & Time").font(.system(size: 11)).foregroundStyle(.white.opacity(0.5))
                        Text(case_.nextHearingDate ?? "25 Aug 2026, 10:30 AM")
                            .font(.system(size: 18, weight: .bold)).foregroundStyle(.white)
                    }
                    HStack(spacing: 32) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Court Room").font(.system(size: 11)).foregroundStyle(.white.opacity(0.5))
                            Text("Court No. 4").font(.system(size: 15, weight: .semibold)).foregroundStyle(.white)
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Presiding Officer").font(.system(size: 11)).foregroundStyle(.white.opacity(0.5))
                            Text(case_.judgeName ?? "Hon. Justice A. Kumar")
                                .font(.system(size: 15, weight: .semibold)).foregroundStyle(.white)
                        }
                    }
                    Button(action: {}) {
                        HStack {
                            Image(systemName: "bell.badge").foregroundStyle(Color.appNavy)
                            Text("Set Reminder").font(.system(size: 15, weight: .bold)).foregroundStyle(Color.appNavy)
                        }
                        .frame(maxWidth: .infinity).frame(height: 48)
                        .background(Color.appGold).clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }
                .padding(16)
                .background(Color.appNavy)
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .padding(.horizontal, 16).padding(.bottom, 16)

                // ── QUICK ACTIONS ────────────────────────────────────────
                VStack(alignment: .leading, spacing: 12) {
                    Text("Quick Actions").font(.system(size: 18, weight: .bold)).foregroundStyle(Color.appNavy)
                    VStack(spacing: 8) {
                        ForEach(["View Documents", "Contact Advocate", "Fee Receipts"], id: \.self) { action in
                            HStack {
                                Text(action).font(.system(size: 15)).foregroundStyle(Color.appNavy)
                                Spacer()
                                Image(systemName: "chevron.right").foregroundStyle(Color.appNavy.opacity(0.3))
                            }
                            .padding(16)
                            .background(Color.white)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "DEE2E6"), lineWidth: 1))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                    }
                }
                .padding(16)

                Spacer().frame(height: 32)
            }
        }
        .background(Color.appBackground)
        .navigationBarHidden(true)
    }
}
