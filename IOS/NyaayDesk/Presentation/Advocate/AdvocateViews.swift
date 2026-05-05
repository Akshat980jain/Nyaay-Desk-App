import SwiftUI

// MARK: - Advocate Dashboard View

struct AdvocateDashboardView_Full: View {
    @Environment(AuthViewModel.self) private var auth
    @State private var vm = AdvocateViewModel()
    @State private var showNewCaseSheet = false
    @State private var selectedCase: NyaayCase? = nil

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    // Header
                    ZStack {
                        LinearGradient(colors: [.nyaayNavyDark, .nyaayNavy], startPoint: .top, endPoint: .bottom)
                            .frame(height: 200)
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Good morning,").font(.subheadline).foregroundStyle(.white.opacity(0.7))
                            Text("Adv. \(auth.currentUser?.fullName ?? "Advocate")")
                                .font(.title2.bold()).foregroundStyle(.nyaayGold)
                            Spacer(minLength: 12)
                            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                                AdminStat(label: "Total", value: "\(vm.summary?.totalCases ?? 0)")
                                AdminStat(label: "Pending", value: "\(vm.summary?.pendingCases ?? 0)")
                                AdminStat(label: "Today", value: "\(vm.todaysCases.count)")
                                AdminStat(label: "NOC", value: "\(vm.summary?.pendingNocRequests ?? 0)")
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(20)
                    }

                    // Today's Cause List
                    SectionHeader(title: "Today's Cause List", count: vm.todaysCases.count)

                    if vm.todaysCases.isEmpty {
                        HStack {
                            Image(systemName: "checkmark.circle.fill").foregroundStyle(.green)
                            Text("No hearings today!").foregroundStyle(.green)
                        }
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(.green.opacity(0.08))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .padding(.horizontal)
                    } else {
                        ForEach(vm.todaysCases) { case_ in
                            TodayCauseRow(case_: case_)
                                .onTapGesture { selectedCase = case_ }
                        }
                    }

                    // All Cases
                    SectionHeader(title: "All Cases", count: vm.allCases.count)
                    ForEach(vm.allCases) { case_ in
                        CaseRowCard(case_: case_).onTapGesture { selectedCase = case_ }
                    }
                    Spacer(minLength: 80)
                }
            }
            .refreshable { vm.loadData(advocateId: auth.currentUser?.id ?? "") }
            .navigationTitle("Advocate")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showNewCaseSheet = true } label: {
                        Image(systemName: "plus.circle.fill").font(.title2).foregroundStyle(.nyaayGold)
                    }
                }
            }
            .navigationDestination(item: $selectedCase) { case_ in CaseDetailView(case_: case_) }
            .sheet(isPresented: $showNewCaseSheet) { NewCaseSheetView(vm: vm) }
            .onAppear { vm.loadData(advocateId: auth.currentUser?.id ?? "") }
        }
    }
}

private struct TodayCauseRow: View {
    let case_: NyaayCase
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "gavel").font(.title3).foregroundStyle(.nyaayNavy)
            VStack(alignment: .leading) {
                Text(case_.caseTitle).font(.subheadline.bold()).lineLimit(1)
                Text(case_.caseNumber).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            CaseStatusBadge(status: case_.status)
        }
        .padding(12)
        .background(Color.nyaayNavy.opacity(0.05))
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .padding(.horizontal)
    }
}

private struct AdminStat: View {
    let label: String; let value: String
    var body: some View {
        VStack(spacing: 2) {
            Text(value).font(.title3.bold()).foregroundStyle(.white)
            Text(label).font(.caption2).foregroundStyle(.white.opacity(0.7))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(.white.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

private struct SectionHeader: View {
    let title: String; let count: Int
    var body: some View {
        HStack {
            Text(title).font(.headline.bold())
            Spacer()
            Text("\(count)").font(.caption).padding(.horizontal, 8).padding(.vertical, 4)
                .background(Color.nyaayNavy.opacity(0.1)).clipShape(Capsule())
        }
        .padding(.horizontal).padding(.top, 16).padding(.bottom, 4)
    }
}

// MARK: - New Case Sheet
struct NewCaseSheetView: View {
    let vm: AdvocateViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var step = 0
    @State private var caseTitle = ""
    @State private var caseType = ""
    @State private var caseNumber = ""
    @State private var description_ = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Step \(step + 1) of 2") {
                    if step == 0 {
                        TextField("Case Title", text: $caseTitle)
                        TextField("Case Type (Civil/Criminal...)", text: $caseType)
                    } else {
                        TextField("Case Number", text: $caseNumber)
                        TextField("Description", text: $description_, axis: .vertical)
                            .lineLimit(4...)
                    }
                }
            }
            .navigationTitle("File New Case")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button(step == 0 ? "Next" : "File") {
                        if step == 0 { step = 1 } else {
                            let newCase = NyaayCase(id: UUID().uuidString, caseNumber: caseNumber,
                                caseTitle: caseTitle, status: "pending", litigantId: "",
                                caseType: caseType, description: description_, documentUrls: nil)
                            vm.fileCase(newCase)
                            dismiss()
                        }
                    }
                    .disabled(caseTitle.isEmpty)
                }
            }
        }
    }
}
