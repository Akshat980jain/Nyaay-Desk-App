import SwiftUI

// MARK: - Advocate Search View (iOS)
struct AdvocateSearchView: View {
    @Environment(AuthViewModel.self) private var auth
    @State private var vm = LitigantViewModel()
    @State private var searchText = ""
    @State private var availableAdvocates: [UserProfile] = []
    
    var filtered: [UserProfile] {
        searchText.isEmpty ? availableAdvocates : availableAdvocates.filter {
            $0.fullName?.localizedCaseInsensitiveContains(searchText) == true ||
            $0.barCouncilId?.localizedCaseInsensitiveContains(searchText) == true
        }
    }

    var body: some View {
        NavigationStack {
            List(filtered, id: \.id) { advocate in
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Circle().fill(Color.nyaayNavy).frame(width: 40, height: 40)
                            .overlay(Text(String(advocate.fullName?.first ?? "A")).foregroundStyle(.nyaayGold))
                        VStack(alignment: .leading) {
                            Text(advocate.fullName ?? "Advocate").font(.headline)
                            Text("Bar ID: \(advocate.barCouncilId ?? "Pending")").font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        if advocate.isVerified {
                            Image(systemName: "checkmark.seal.fill").foregroundStyle(.green)
                        }
                    }
                    Button("Request Representation") {
                        // Action to send join request
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.nyaayNavy)
                    .controlSize(.small)
                }
                .padding(.vertical, 4)
            }
            .navigationTitle("Find Advocate")
            .searchable(text: $searchText, prompt: "Name, Bar ID...")
            .onAppear {
                fetchAdvocates()
            }
        }
    }

    private func fetchAdvocates() {
        Task {
            do {
                let result: [UserProfile] = try await SupabaseManager.shared.client.database
                    .from("users")
                    .select()
                    .eq("user_type", value: "advocate")
                    .eq("is_verified", value: true)
                    .execute()
                    .value
                self.availableAdvocates = result
            } catch {
                print("Error: \(error)")
            }
        }
    }
}

// MARK: - Join Requests View (iOS)
struct JoinRequestsView: View {
    @Environment(AuthViewModel.self) private var auth
    @State private var requests: [JoinRequest] = []
    private let repo = CaseRepository()

    var body: some View {
        NavigationStack {
            List {
                if requests.isEmpty {
                    ContentUnavailableView("No Requests", systemImage: "tray", description: Text("Incoming representation requests will appear here."))
                } else {
                    ForEach(requests) { request in
                        VStack(alignment: .leading, spacing: 10) {
                            Text("New Representation Request").font(.caption.bold()).foregroundStyle(.nyaayNavy)
                            Text(request.caseTitle ?? "Case").font(.headline)
                            Text("Litigant: \(request.litigantName ?? "Unknown")").font(.subheadline).foregroundStyle(.secondary)
                            
                            HStack(spacing: 12) {
                                Button("Decline", role: .destructive) {
                                    updateRequest(id: request.id, status: "rejected")
                                }
                                .buttonStyle(.bordered)
                                
                                Button("Accept") {
                                    updateRequest(id: request.id, status: "accepted")
                                }
                                .buttonStyle(.borderedProminent)
                                .tint(.green)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }
            }
            .navigationTitle("Requests")
            .onAppear { loadRequests() }
        }
    }

    private func loadRequests() {
        Task {
            do {
                requests = try await repo.fetchJoinRequests(advocateId: auth.currentUser?.id ?? "")
            } catch {
                print("Error: \(error)")
            }
        }
    }

    private func updateRequest(id: String, status: String) {
        Task {
            do {
                try await repo.updateJoinRequest(id: id, status: status)
                requests.removeAll { $0.id == id }
            } catch {
                print("Error: \(error)")
            }
        }
    }
}

// MARK: - Join Request Model
struct JoinRequest: Codable, Identifiable {
    let id: String
    let caseId: String
    let advocateId: String
    let status: String
    let caseTitle: String?
    let litigantName: String?
    
    enum CodingKeys: String, CodingKey {
        case id, status
        case caseId = "case_id"
        case advocateId = "advocate_id"
        case caseTitle = "case_title"
        case litigantName = "litigant_name"
    }
}
