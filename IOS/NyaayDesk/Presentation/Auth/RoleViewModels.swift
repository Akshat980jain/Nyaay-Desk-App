import Foundation
import Observation

/**
 * LitigantViewModel (iOS) — drives the Litigant dashboard and case list.
 * Uses Swift Concurrency (async/await) with @Observable for reactive SwiftUI updates.
 */
@Observable
final class LitigantViewModel {
    var cases: [NyaayCase] = []
    var summary: DashboardSummary?
    var isLoading = false
    var errorMessage: String?

    var nextHearingCase: NyaayCase? {
        cases.first(where: { $0.nextHearingDate != nil })
    }

    private let repository = CaseRepository()
    private let supabase = SupabaseManager.shared.client

    func loadData(userId: String) {
        Task {
            isLoading = true
            defer { isLoading = false }
            do {
                async let casesResult = repository.fetchCasesForLitigant(litigantId: userId)
                async let summaryResult = repository.fetchDashboardSummary(userId: userId)
                (cases, summary) = try await (casesResult, summaryResult)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

/** AdvocateViewModel (iOS) */
@Observable
final class AdvocateViewModel {
    var allCases: [NyaayCase] = []
    var summary: DashboardSummary?
    var isLoading = false
    var errorMessage: String?
    var filingSuccess = false

    var todaysCases: [NyaayCase] {
        let today = ISO8601DateFormatter().string(from: Calendar.current.startOfDay(for: Date()))
            .prefix(10)
        return allCases.filter { $0.nextHearingDate?.hasPrefix(today) == true }
    }

    private let repository = CaseRepository()

    func loadData(advocateId: String) {
        Task {
            isLoading = true
            defer { isLoading = false }
            do {
                async let casesResult = repository.fetchCasesForAdvocate(advocateId: advocateId)
                async let summaryResult = repository.fetchDashboardSummary(userId: advocateId)
                (allCases, summary) = try await (casesResult, summaryResult)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    func fileCase(_ newCase: NyaayCase) {
        Task {
            isLoading = true
            defer { isLoading = false }
            do {
                try await repository.fileNewCase(newCase)
                filingSuccess = true
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

/** ClerkViewModel (iOS) */
@Observable
final class ClerkViewModel {
    var causeList: [NyaayCase] = []
    var isLoading = false
    var errorMessage: String?

    var todaysList: [NyaayCase] {
        let today = String(Date().ISO8601Format().prefix(10))
        return causeList.filter { $0.nextHearingDate?.hasPrefix(today) == true }
    }

    private let repository = CaseRepository()

    func loadData(courtId: String) {
        Task {
            isLoading = true
            defer { isLoading = false }
            do {
                causeList = try await repository.fetchCasesForCourt(courtId: courtId)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

/** AdminViewModel (iOS) */
@Observable
final class AdminViewModel {
    var summary: DashboardSummary?
    var pendingAdvocates: [UserProfile] = []
    var isLoading = false
    var errorMessage: String?

    private let supabase = SupabaseManager.shared.client

    func loadData(adminId: String) {
        Task {
            isLoading = true
            defer { isLoading = false }
            do {
                async let summaryResult = CaseRepository().fetchDashboardSummary(userId: adminId)
                async let advocatesResult: [UserProfile] = try supabase.database
                    .from("users")
                    .select()
                    .eq("user_type", value: "advocate")
                    .eq("is_verified", value: false)
                    .execute()
                    .value
                (summary, pendingAdvocates) = try await (summaryResult, advocatesResult)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    func approveAdvocate(_ id: String) {
        Task {
            do {
                try await supabase.database
                    .from("users")
                    .update(["is_verified": true])
                    .eq("id", value: id)
                    .execute()
                pendingAdvocates.removeAll { $0.id == id }
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}
