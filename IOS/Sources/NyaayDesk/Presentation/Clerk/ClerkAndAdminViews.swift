import SwiftUI

// MARK: - Clerk Cause List View
struct ClerkCauseListView: View {
    @Environment(AuthViewModel.self) private var auth
    @State private var vm = ClerkViewModel()
    @State private var selectedCase: NyaayCase? = nil
    @State private var showHearingSheet = false

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack(spacing: 12) {
                        Image(systemName: "list.bullet.clipboard.fill").foregroundStyle(.nyaayNavy)
                        VStack(alignment: .leading) {
                            Text("Daily Cause List").font(.headline)
                            Text(Date().formatted(date: .complete, time: .omitted))
                                .font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text("\(vm.todaysList.count)").font(.caption.bold())
                            .padding(.horizontal, 10).padding(.vertical, 4)
                            .background(Color.nyaayNavy).foregroundStyle(.white)
                            .clipShape(Capsule())
                    }
                    .padding(.vertical, 4)
                }

                if vm.todaysList.isEmpty {
                    ContentUnavailableView("No Hearings Today",
                        systemImage: "calendar.badge.exclamationmark",
                        description: Text("All clear for today!"))
                } else {
                    Section("Scheduled Cases") {
                        ForEach(Array(vm.todaysList.enumerated()), id: \.element.id) { index, case_ in
                            ClerkCauseRow(srNo: index + 1, case_: case_) {
                                selectedCase = case_
                                showHearingSheet = true
                            }
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Cause List")
            .refreshable { vm.loadData(courtId: auth.currentUser?.courtId ?? "") }
            .sheet(isPresented: $showHearingSheet) {
                if let case_ = selectedCase {
                    HearingUpdateSheet(case_: case_, vm: vm)
                }
            }
            .onAppear { vm.loadData(courtId: auth.currentUser?.courtId ?? "") }
        }
    }
}

private struct ClerkCauseRow: View {
    let srNo: Int
    let case_: NyaayCase
    let onUpdate: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle().fill(Color.nyaayNavy).frame(width: 28, height: 28)
                Text("\(srNo)").font(.caption.bold()).foregroundStyle(.white)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(case_.caseTitle).font(.subheadline.bold()).lineLimit(1)
                Text(case_.caseNumber).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            CaseStatusBadge(status: case_.status)
        }
        .swipeActions(edge: .trailing) {
            Button("Update", systemImage: "pencil") { onUpdate() }
                .tint(.nyaayNavy)
        }
    }
}

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

// MARK: - Admin Dashboard View
struct AdminDashboardView: View {
    @Environment(AuthViewModel.self) private var auth
    @State private var vm = AdminViewModel()

    var body: some View {
        NavigationStack {
            List {
                // Stats Grid
                Section {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        StatCard2(label: "Total Cases", value: "\(vm.summary?.totalCases ?? 0)", icon: "folder.fill", color: .nyaayNavy)
                        StatCard2(label: "Pending", value: "\(vm.summary?.pendingCases ?? 0)", icon: "clock.fill", color: .orange)
                        StatCard2(label: "Disposed", value: "\(vm.summary?.disposedCases ?? 0)", icon: "checkmark.seal.fill", color: .green)
                        StatCard2(label: "NOC Req.", value: "\(vm.summary?.pendingNocRequests ?? 0)", icon: "arrow.left.arrow.right", color: .purple)
                    }
                }

                // Advocate Approval Queue
                Section("Advocate Approval Queue (\(vm.pendingAdvocates.count))") {
                    if vm.pendingAdvocates.isEmpty {
                        Label("All verifications complete!", systemImage: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                    } else {
                        ForEach(vm.pendingAdvocates, id: \.id) { advocate in
                            AdvocateApprovalRow(advocate: advocate,
                                onApprove: { vm.approveAdvocate(advocate.id) },
                                onReject: {})
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Admin Overview")
            .refreshable { vm.loadData(adminId: auth.currentUser?.id ?? "") }
            .onAppear { vm.loadData(adminId: auth.currentUser?.id ?? "") }
        }
    }
}

private struct StatCard2: View {
    let label: String; let value: String; let icon: String; let color: Color
    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon).font(.title3).foregroundStyle(color)
            VStack(alignment: .leading) {
                Text(value).font(.title2.bold())
                Text(label).font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(color.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

private struct AdvocateApprovalRow: View {
    let advocate: UserProfile
    let onApprove: () -> Void
    let onReject: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Circle().fill(Color.nyaayNavy).frame(width: 36, height: 36)
                    .overlay(Text(String(advocate.fullName?.first ?? "A")).foregroundStyle(.nyaayGold).font(.headline))
                VStack(alignment: .leading) {
                    Text(advocate.fullName ?? "Unknown").font(.subheadline.bold())
                    Text(advocate.email).font(.caption).foregroundStyle(.secondary)
                    if let barId = advocate.barCouncilId {
                        Text("Bar ID: \(barId)").font(.caption2).foregroundStyle(.nyaayNavy)
                    }
                }
            }
            HStack(spacing: 12) {
                Button("Reject", role: .destructive) { onReject() }
                    .frame(maxWidth: .infinity).buttonStyle(.bordered)
                Button("Approve") { onApprove() }
                    .frame(maxWidth: .infinity).buttonStyle(.borderedProminent)
                    .tint(.green)
            }
        }
        .padding(.vertical, 4)
    }
}
