import Foundation
import Supabase

// MARK: - Domain Models (mirror Supabase schema exactly)

struct NyaayCase: Codable, Identifiable, Hashable {
    var id: String
    var caseNumber: String
    var cnrNumber: String? = nil
    var caseTitle: String
    var status: String
    var litigantId: String
    var advocateId: String? = nil
    var courtId: String? = nil
    var judgeName: String? = nil
    var filingDate: String? = nil
    var nextHearingDate: String? = nil
    var caseType: String? = nil
    var description: String? = nil
    var documentUrls: [String]? = nil
    var courtName: String? = nil // Added for UI

    enum CodingKeys: String, CodingKey {
        case id
        case caseNumber = "case_number"
        case cnrNumber = "cnr_number"
        case caseTitle = "case_title"
        case status
        case litigantId = "litigant_id"
        case advocateId = "advocate_id"
        case courtId = "court_id"
        case judgeName = "judge_name"
        case filingDate = "filing_date"
        case nextHearingDate = "next_hearing_date"
        case caseType = "case_type"
        case description
        case documentUrls = "document_urls"
        case courtName = "court_name"
    }
}

struct NyaayHearing: Codable, Identifiable, Hashable {
    let id: String
    let caseId: String
    let hearingDate: String
    let nextHearingDate: String? = nil
    let orderText: String? = nil
    let attendanceMarked: Bool
    let judgeNotes: String? = nil
    let createdAt: String? = nil

    enum CodingKeys: String, CodingKey {
        case id
        case caseId = "case_id"
        case hearingDate = "hearing_date"
        case nextHearingDate = "next_hearing_date"
        case orderText = "order_text"
        case attendanceMarked = "attendance_marked"
        case judgeNotes = "judge_notes"
        case createdAt = "created_at"
    }
}

struct UserProfile: Codable, Hashable {
    let id: String
    let email: String
    let userType: String
    let fullName: String?
    let phone: String?
    let barCouncilId: String?
    let courtId: String?
    let isVerified: Bool
    let avatarUrl: String?

    enum CodingKeys: String, CodingKey {
        case id, email, phone
        case userType = "user_type"
        case fullName = "full_name"
        case barCouncilId = "bar_council_id"
        case courtId = "court_id"
        case isVerified = "is_verified"
        case avatarUrl = "avatar_url"
    }
    
    var userId: String { id } // Alias for UI compatibility
}

struct DashboardSummary: Codable, Hashable {
    let totalCases: Int
    let pendingCases: Int
    let activeCases: Int? = 0 // Added for UI
    let disposedCases: Int
    let todayHearings: Int
    let pendingNocRequests: Int

    enum CodingKeys: String, CodingKey {
        case totalCases = "total_cases"
        case pendingCases = "pending_cases"
        case activeCases = "active_cases"
        case disposedCases = "disposed_cases"
        case todayHearings = "today_hearings"
        case pendingNocRequests = "pending_noc_requests"
    }
}
