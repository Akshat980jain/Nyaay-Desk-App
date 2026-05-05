import Foundation
import Supabase

// MARK: - Domain Models (mirror Supabase schema exactly)

struct NyaayCase: Codable, Identifiable {
    let id: String
    let caseNumber: String
    let cnrNumber: String?
    let caseTitle: String
    let status: String
    let litigantId: String
    let advocateId: String?
    let courtId: String?
    let judgeName: String?
    let filingDate: String?
    let nextHearingDate: String?
    let caseType: String?
    let description: String?
    let documentUrls: [String]?

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
    }
}

struct NyaayHearing: Codable, Identifiable {
    let id: String
    let caseId: String
    let hearingDate: String
    let nextHearingDate: String?
    let orderText: String?
    let attendanceMarked: Bool
    let judgeNotes: String?
    let createdAt: String?

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

struct UserProfile: Codable {
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
}

struct DashboardSummary: Codable {
    let totalCases: Int
    let pendingCases: Int
    let disposedCases: Int
    let todayHearings: Int
    let pendingNocRequests: Int

    enum CodingKeys: String, CodingKey {
        case totalCases = "total_cases"
        case pendingCases = "pending_cases"
        case disposedCases = "disposed_cases"
        case todayHearings = "today_hearings"
        case pendingNocRequests = "pending_noc_requests"
    }
}
