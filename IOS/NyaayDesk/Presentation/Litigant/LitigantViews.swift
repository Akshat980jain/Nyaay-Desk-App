import SwiftUI

// MARK: - Litigant Dashboard View

struct LitigantDashboardView: View {
    @Environment(AuthViewModel.self) private var auth
    @State private var vm = LitigantViewModel()
    @State private var selectedCase: NyaayCase? = nil

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    // Header
                    ZStack(alignment: .bottom) {
                        LinearGradient(colors: [.nyaayNavyDark, .nyaayNavy], startPoint: .top, endPoint: .bottom)
                            .frame(height: 220)
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Welcome back,").font(.subheadline).foregroundStyle(.white.opacity(0.7))
                            Text(auth.currentUser?.fullName ?? "Litigant")
                                .font(.title.bold()).foregroundStyle(.nyaayGold)
                            Spacer(minLength: 12)
                            HStack(spacing: 12) {
                                StatPill(label: "Total", value: "\(vm.summary?.totalCases ?? 0)")
                                StatPill(label: "Pending", value: "\(vm.summary?.pendingCases ?? 0)")
                                StatPill(label: "Today", value: "\(vm.summary?.todayHearings ?? 0)")
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(20)
                    }

                    // Next Hearing Banner
                    if let next = vm.nextHearingCase {
                        HStack(spacing: 12) {
                            Image(systemName: "bell.badge.fill").foregroundStyle(.orange)
                            VStack(alignment: .leading) {
                                Text("Next Hearing").font(.caption).foregroundStyle(.secondary)
                                Text(next.caseTitle).font(.subheadline.bold())
                                Text(next.nextHearingDate ?? "").font(.caption).foregroundStyle(.orange)
                            }
                            Spacer()
                        }
                        .padding()
                        .background(.orange.opacity(0.08))
                        .padding(.horizontal)
                        .padding(.top, 12)
                    }

                    // Cases List
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("My Cases (\(vm.cases.count))").font(.headline.bold())
                            Spacer()
                        }
                        .padding(.horizontal)
                        .padding(.top, 16)

                        if vm.isLoading {
                            ForEach(0..<3, id: \.self) { _ -> some View in
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(Color.gray.opacity(0.1))
                                    .frame(height: 90)
                                    .padding(.horizontal)
                            }
                        } else {
                            ForEach(vm.cases) { case_ in
                                CaseRowCard(case_: case_)
                                    .onTapGesture { selectedCase = case_ }
                            }
                        }
                    }
                    .padding(.bottom, 20)
                }
            }
            .refreshable { vm.loadData(userId: auth.currentUser?.id ?? "") }
            .navigationTitle("Dashboard")
            .navigationBarTitleDisplayMode(.inline)
            .navigationDestination(item: $selectedCase) { case_ in
                CaseDetailView(case_: case_)
            }
            .onAppear { vm.loadData(userId: auth.currentUser?.id ?? "") }
        }
    }
}

// MARK: - Case Row Card
struct CaseRowCard: View {
    let case_: NyaayCase

    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 10)
                .fill(Color.nyaayNavy.opacity(0.1))
                .frame(width: 44, height: 44)
                .overlay(Image(systemName: "gavel").foregroundStyle(.nyaayNavy))

            VStack(alignment: .leading, spacing: 4) {
                Text(case_.caseTitle).font(.subheadline.bold()).lineLimit(1)
                Text(case_.cnrNumber ?? case_.caseNumber)
                    .font(.caption).foregroundStyle(.secondary)
                HStack(spacing: 8) {
                    CaseStatusBadge(status: case_.status)
                    if let date = case_.nextHearingDate {
                        Label(date, systemImage: "calendar")
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }
            Spacer()
            Image(systemName: "chevron.right").foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.04), radius: 4, y: 2)
        .padding(.horizontal)
    }
}

// MARK: - Case Detail View
struct CaseDetailView: View {
    let case_: NyaayCase

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Header
                ZStack {
                    RoundedRectangle(cornerRadius: 20)
                        .fill(LinearGradient(colors: [.nyaayNavyDark, .nyaayNavy], startPoint: .topLeading, endPoint: .bottomTrailing))
                    VStack(alignment: .leading, spacing: 8) {
                        Text(case_.caseTitle).font(.title2.bold()).foregroundStyle(.nyaayGold)
                        HStack {
                            CaseStatusBadge(status: case_.status)
                            if let type_ = case_.caseType {
                                Text(type_).font(.caption).foregroundStyle(.white.opacity(0.7))
                                    .padding(.horizontal, 8).padding(.vertical, 3)
                                    .background(.white.opacity(0.15)).clipShape(Capsule())
                            }
                        }
                        Divider().background(.white.opacity(0.2))
                        InfoRow(label: "CNR", value: case_.cnrNumber ?? "N/A")
                        InfoRow(label: "Case No.", value: case_.caseNumber)
                        InfoRow(label: "Judge", value: case_.judgeName ?? "Not assigned")
                        InfoRow(label: "Next Hearing", value: case_.nextHearingDate ?? "TBD", valueColor: .nyaayGold)
                    }
                    .padding(20)
                }
                .padding(.horizontal)

                // Description
                if let desc = case_.description {
                    GroupBox("Description") {
                        Text(desc).font(.body).foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(.horizontal)
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Case Details")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct InfoRow: View {
    let label: String
    let value: String
    var valueColor: Color = .white

    var body: some View {
        HStack {
            Text("\(label): ").font(.caption).foregroundStyle(.white.opacity(0.6))
            Text(value).font(.caption.bold()).foregroundStyle(valueColor)
        }
    }
}

private struct StatPill: View {
    let label: String; let value: String
    var body: some View {
        VStack(spacing: 2) {
            Text(value).font(.headline.bold()).foregroundStyle(.white)
            Text(label).font(.caption2).foregroundStyle(.white.opacity(0.7))
        }
        .padding(.horizontal, 14).padding(.vertical, 8)
        .background(.white.opacity(0.15)).clipShape(RoundedRectangle(cornerRadius: 10))
    }
}
