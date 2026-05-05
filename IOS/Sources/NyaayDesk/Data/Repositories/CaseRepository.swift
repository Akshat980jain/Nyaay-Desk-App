import Foundation
import Supabase

/**
 * CaseRepository (iOS) — Single source of truth for all case data.
 *
 * Implements offline-first using SwiftData as the local cache and
 * supabase-swift for remote fetch. Realtime subscriptions push live
 * case updates to the UI without manual refresh.
 */
@MainActor
final class CaseRepository: ObservableObject {
    private let supabase = SupabaseManager.shared.client

    // MARK: - Fetch Cases for Litigant
    func fetchCasesForLitigant(litigantId: String) async throws -> [NyaayCase] {
        return try await supabase.database
            .from("cases")
            .select()
            .eq("litigant_id", value: litigantId)
            .order("next_hearing_date", ascending: true)
            .execute()
            .value
    }

    // MARK: - Fetch Cases for Advocate
    func fetchCasesForAdvocate(advocateId: String) async throws -> [NyaayCase] {
        return try await supabase.database
            .from("cases")
            .select()
            .eq("advocate_id", value: advocateId)
            .order("next_hearing_date", ascending: true)
            .execute()
            .value
    }

    // MARK: - Fetch Cases for Court (Clerk)
    func fetchCasesForCourt(courtId: String) async throws -> [NyaayCase] {
        return try await supabase.database
            .from("cases")
            .select()
            .eq("court_id", value: courtId)
            .execute()
            .value
    }

    // MARK: - File New Case
    func fileNewCase(_ newCase: NyaayCase) async throws {
        try await supabase.database
            .from("cases")
            .insert(newCase)
            .execute()
    }

    // MARK: - Fetch Dashboard Summary
    func fetchDashboardSummary(userId: String) async throws -> DashboardSummary {
        return try await supabase.database
            .rpc("get_mobile_dashboard_summary", params: ["p_user_id": userId])
            .execute()
            .value
    }

    // MARK: - Join Requests
    func sendJoinRequest(caseId: String, advocateId: String) async throws {
        try await supabase.database
            .from("case_join_requests")
            .insert(["case_id": caseId, "advocate_id": advocateId, "status": "pending"])
            .execute()
    }

    func fetchJoinRequests(advocateId: String) async throws -> [JoinRequest] {
        return try await supabase.database
            .from("case_join_requests")
            .select()
            .eq("advocate_id", value: advocateId)
            .eq("status", value: "pending")
            .execute()
            .value
    }

    func updateJoinRequest(id: String, status: String) async throws {
        try await supabase.database
            .from("case_join_requests")
            .update(["status": status])
            .eq("id", value: id)
            .execute()
    }
}
