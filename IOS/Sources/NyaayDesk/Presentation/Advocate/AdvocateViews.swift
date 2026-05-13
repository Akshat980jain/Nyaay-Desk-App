import SwiftUI

// MARK: - Advocate Dashboard (Stitch Design)
struct AdvocateDashboardView_Full: View {
    @Environment(AuthViewModel.self) private var auth
    @State private var vm = AdvocateViewModel()
    @State private var showNewCaseSheet = false
    @State private var selectedCase: NyaayCase? = nil
    @State private var searchText = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    // ── TOP NAV ───────────────────────────────────────────
                    NyaayTopBarView(onLogout: {})

                    // ── ERROR DISPLAY ─────────────────────────────────────
                    if let error = vm.errorMessage {
                        HStack(spacing: 12) {
                            Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.red)
                            Text(error).font(.system(size: 13)).foregroundStyle(.red)
                        }
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.red.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .padding(.horizontal, 16)
                        .padding(.top, 8)
                    }

                    // ── OVERVIEW HEADER ───────────────────────────────────
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Overview")
                            .font(.system(size: 26, weight: .bold))
                            .foregroundStyle(Color.appNavy)
                        Text("Manage your active dockets and hearings.")
                            .font(.system(size: 14))
                            .foregroundStyle(Color.appNavy.opacity(0.6))
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(16)

                    // ── NEW CASE BUTTON ───────────────────────────────────
                    Button(action: { showNewCaseSheet = true }) {
                        HStack(spacing: 6) {
                            Image(systemName: "plus").font(.system(size: 14, weight: .bold))
                            Text("NEW CASE").font(.system(size: 14, weight: .bold))
                        }
                        .foregroundStyle(Color.appNavy)
                        .padding(.horizontal, 20)
                        .frame(height: 44)
                        .background(Color.appGold)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 16)
                    .padding(.bottom, 8)

                    // ── STAT CARDS ────────────────────────────────────────
                    AdvStatTile(label: "Total Cases", value: "\(vm.summary?.totalCases ?? 15)",
                                icon: "folder.fill", valueColor: Color.appNavy, isDark: false)
                    AdvStatTile(label: "Pending Cases", value: "\(vm.summary?.pendingCases ?? 4)",
                                icon: "clock.fill", valueColor: Color.appNavy, isDark: false)

                    // Active Cases — navy dark tile
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            HStack(spacing: 6) {
                                Image(systemName: "scalemass.fill")
                                    .foregroundStyle(Color.appGold)
                                Text("Active Cases")
                                    .font(.system(size: 14))
                                    .foregroundStyle(Color.appGold)
                            }
                            Text("\(vm.summary?.activeCases ?? 11)")
                                .font(.system(size: 40, weight: .bold))
                                .foregroundStyle(.white)
                        }
                        Spacer()
                        Image(systemName: "scalemass.fill")
                            .font(.system(size: 48))
                            .foregroundStyle(.white.opacity(0.07))
                    }
                    .padding(16)
                    .background(Color.appNavy)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.appNavy, lineWidth: 1))
                    .padding(.horizontal, 16)
                    .padding(.vertical, 6)

                    // ── SEARCH ────────────────────────────────────────────
                    Spacer().frame(height: 8)

                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundStyle(Color.appNavy.opacity(0.4))
                        TextField("Search cases by number or client...", text: $searchText)
                            .font(.system(size: 15))
                            .foregroundStyle(Color.appNavy)
                    }
                    .padding(12)
                    .background(Color.white)
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "DEE2E6"), lineWidth: 1))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .padding(.horizontal, 16)
                    .padding(.bottom, 8)

                    Button(action: {}) {
                        HStack(spacing: 6) {
                            Image(systemName: "line.3.horizontal.decrease").foregroundStyle(Color.appNavy)
                            Text("Filters").foregroundStyle(Color.appNavy).font(.system(size: 15, weight: .medium))
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                        .background(Color.white)
                        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "DEE2E6"), lineWidth: 1))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 8)

                    // ── MY CASES HEADER ───────────────────────────────────
                    HStack {
                        Text("My Cases")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundStyle(Color.appNavy)
                        Spacer()
                        Button("View All") {}
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(Color.appGold)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)

                    if vm.allCases.isEmpty {
                        Text("No cases found.")
                            .font(.system(size: 14))
                            .foregroundStyle(Color.appNavy.opacity(0.4))
                            .padding(32)
                    } else {
                        ForEach(vm.allCases) { case_ in
                            CaseRowCard(case_: case_)
                                .onTapGesture { selectedCase = case_ }
                        }
                    }

                    Spacer().frame(height: 80)
                }
            }
            .background(Color.appBackground)
            .navigationBarHidden(true)
            .navigationDestination(item: $selectedCase) { CaseDetailView(case_: $0) }
            .sheet(isPresented: $showNewCaseSheet) { NewCaseSheetView(vm: vm) }
            .task(id: auth.currentUser?.id) {
                if let id = auth.currentUser?.id, !id.isEmpty {
                    vm.loadData(advocateId: id)
                }
            }
            .refreshable { 
                if let id = auth.currentUser?.id {
                    vm.loadData(advocateId: id)
                }
            }
        }
    }
}

// MARK: - Advocate Stat Tile
private struct AdvStatTile: View {
    let label: String
    let value: String
    let icon: String
    let valueColor: Color
    let isDark: Bool

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 4) {
                    Image(systemName: icon).font(.system(size: 14)).foregroundStyle(Color.appNavy.opacity(0.5))
                    Text(label).font(.system(size: 13)).foregroundStyle(Color.appNavy.opacity(0.6))
                }
                Text(value).font(.system(size: 36, weight: .bold)).foregroundStyle(valueColor)
            }
            Spacer()
            Image(systemName: icon)
                .font(.system(size: 40))
                .foregroundStyle(Color(hex: "DEE2E6"))
        }
        .padding(16)
        .background(Color.white)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(hex: "DEE2E6"), lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .padding(.horizontal, 16)
        .padding(.vertical, 6)
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
