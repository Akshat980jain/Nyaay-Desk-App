import SwiftUI

// MARK: - Clerk Overview (Stitch Design - matches clerk_admin_overview)
struct ClerkCauseListView: View {
    @Environment(AuthViewModel.self) private var auth
    @State private var vm = ClerkViewModel()
    @State private var selectedCase: NyaayCase? = nil
    @State private var showHearingSheet = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    NyaayTopBarView()

                    // Overview Header
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Overview")
                            .font(.system(size: 26, weight: .bold))
                            .foregroundStyle(Color.appNavy)
                        Text("System statistics for today.")
                            .font(.system(size: 14))
                            .foregroundStyle(Color.appNavy.opacity(0.6))
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(16)

                    // 2x2 stat grid
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                        AdminStatTileSwift(label: "ACTIVE CASES", value: "\(vm.todaysList.count)", valueColor: Color.appNavy, icon: "scalemass.fill")
                        AdminStatTileSwift(label: "TODAY'S HEARINGS", value: "\(vm.todaysList.count)", valueColor: Color.appGold, icon: "calendar")
                        AdminStatTileSwift(label: "PENDING CASES", value: "45", valueColor: Color.appUrgent, icon: "hourglass")
                        AdminStatTileSwift(label: "DISPOSED CASES", value: "300", valueColor: Color.appNavy, icon: "checkmark.circle")
                    }
                    .padding(.horizontal, 16)

                    // Action Required
                    HStack(spacing: 8) {
                        Image(systemName: "exclamationmark.circle.fill").foregroundStyle(Color.appUrgent)
                        Text("Action Required").font(.system(size: 22, weight: .bold)).foregroundStyle(Color.appNavy)
                        Spacer()
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 24)
                    .padding(.bottom, 4)

                    Divider().padding(.horizontal, 16)

                    // Advocate Verifications
                    AdminActionTile(
                        iconName: "person.badge.shield.checkmark.fill",
                        iconBgColor: Color(hex: "E8EAF6"),
                        iconColor: Color(hex: "3F51B5"),
                        title: "Advocate Verifications",
                        subtitle: "Requires review",
                        pendingLabel: "2 Pending"
                    )

                    // NOC Review
                    AdminActionTile(
                        iconName: "checkmark.seal.fill",
                        iconBgColor: Color(hex: "FFF3E0"),
                        iconColor: Color.appGold,
                        title: "NOC Review",
                        subtitle: "No Objection Certificates",
                        pendingLabel: "1 Pending"
                    )

                    // Quick action buttons
                    HStack(spacing: 8) {
                        Button(action: {}) {
                            VStack(spacing: 8) {
                                Image(systemName: "plus.circle").font(.system(size: 26)).foregroundStyle(Color.appNavy)
                                Text("New Case Entry").font(.system(size: 14, weight: .semibold)).foregroundStyle(Color.appNavy)
                            }
                            .frame(maxWidth: .infinity).padding(16)
                            .background(Color.white)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "DEE2E6"), lineWidth: 1))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                        Button(action: {}) {
                            VStack(spacing: 8) {
                                Image(systemName: "arrow.up.doc").font(.system(size: 26)).foregroundStyle(Color.appNavy)
                                Text("Upload Order").font(.system(size: 14, weight: .semibold)).foregroundStyle(Color.appNavy)
                            }
                            .frame(maxWidth: .infinity).padding(16)
                            .background(Color.white)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "DEE2E6"), lineWidth: 1))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                    }
                    .padding(16)

                    Spacer().frame(height: 80)
                }
            }
            .background(Color.appBackground)
            .navigationBarHidden(true)
            .onAppear { vm.loadData(courtId: auth.currentUser?.courtId ?? "") }
        }
    }
}

// MARK: - Admin Dashboard (same design as Clerk Overview)
struct AdminDashboardView: View {
    @Environment(AuthViewModel.self) private var auth
    @State private var vm = AdminViewModel()

    var body: some View {
        ClerkCauseListView()
    }
}

// MARK: - Admin Stat Tile
private struct AdminStatTileSwift: View {
    let label: String
    let value: String
    let valueColor: Color
    let icon: String

    var body: some View {
        ZStack(alignment: .topTrailing) {
            VStack(alignment: .leading, spacing: 8) {
                Text(label)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(Color.appNavy.opacity(0.5))
                    .kerning(0.5)
                Spacer()
                Text(value)
                    .font(.system(size: 28, weight: .bold))
                    .foregroundStyle(valueColor)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .frame(height: 100)
            .background(Color.white)
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "DEE2E6"), lineWidth: 1))
            .clipShape(RoundedRectangle(cornerRadius: 8))

            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundStyle(Color(hex: "DEE2E6"))
                .padding(10)
        }
    }
}

// MARK: - Admin Action Tile
private struct AdminActionTile: View {
    let iconName: String
    let iconBgColor: Color
    let iconColor: Color
    let title: String
    let subtitle: String
    let pendingLabel: String

    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 8)
                .fill(iconBgColor)
                .frame(width: 44, height: 44)
                .overlay(Image(systemName: iconName).foregroundStyle(iconColor))

            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.system(size: 15, weight: .semibold)).foregroundStyle(Color.appNavy)
                Text(subtitle).font(.system(size: 12)).foregroundStyle(Color.appNavy.opacity(0.5))
            }

            Spacer()

            Text(pendingLabel)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(.white)
                .padding(.horizontal, 10).padding(.vertical, 4)
                .background(Color.appUrgent)
                .clipShape(Capsule())

            Button("Review") {}
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(Color.appNavy)
                .padding(.horizontal, 12).padding(.vertical, 6)
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.appNavy.opacity(0.3), lineWidth: 1))
        }
        .padding(16)
        .background(Color.white)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "DEE2E6"), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .padding(.horizontal, 16)
        .padding(.vertical, 6)
    }
}

// MARK: - Hearing Update Sheet
struct HearingUpdateSheet: View {
    let case_: NyaayCase
    let vm: ClerkViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var nextDate = ""
    @State private var orderText = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Case") {
                    LabeledContent("Case", value: case_.caseTitle)
                    LabeledContent("Number", value: case_.caseNumber)
                }
                Section("Hearing Update") {
                    TextField("Next Hearing Date (YYYY-MM-DD)", text: $nextDate)
                    TextField("Short Order", text: $orderText, axis: .vertical)
                        .lineLimit(3...)
                }
            }
            .navigationTitle("Update Hearing")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save & Notify") { dismiss() }
                        .disabled(nextDate.isEmpty)
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}
