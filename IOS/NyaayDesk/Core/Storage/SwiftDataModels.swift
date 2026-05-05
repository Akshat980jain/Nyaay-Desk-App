import Foundation
import SwiftData
import Supabase

// MARK: - SwiftData Persistent Models (Offline Cache)

@Model
final class CachedCase {
    var id: String
    var caseNumber: String
    var cnrNumber: String?
    var caseTitle: String
    var status: String
    var litigantId: String
    var advocateId: String?
    var courtId: String?
    var judgeName: String?
    var filingDate: String?
    var nextHearingDate: String?
    var caseType: String?
    var caseDescription: String?
    var lastSyncedAt: Date

    init(from case_: NyaayCase) {
        self.id = case_.id
        self.caseNumber = case_.caseNumber
        self.cnrNumber = case_.cnrNumber
        self.caseTitle = case_.caseTitle
        self.status = case_.status
        self.litigantId = case_.litigantId
        self.advocateId = case_.advocateId
        self.courtId = case_.courtId
        self.judgeName = case_.judgeName
        self.filingDate = case_.filingDate
        self.nextHearingDate = case_.nextHearingDate
        self.caseType = case_.caseType
        self.caseDescription = case_.description
        self.lastSyncedAt = Date()
    }

    func toDomain() -> NyaayCase {
        return NyaayCase(
            id: id, caseNumber: caseNumber, cnrNumber: cnrNumber,
            caseTitle: caseTitle, status: status, litigantId: litigantId,
            advocateId: advocateId, courtId: courtId, judgeName: judgeName,
            filingDate: filingDate, nextHearingDate: nextHearingDate,
            caseType: caseType, description: caseDescription, documentUrls: nil
        )
    }
}

@Model
final class CachedHearing {
    var id: String
    var caseId: String
    var hearingDate: String
    var nextHearingDate: String?
    var orderText: String?
    var attendanceMarked: Bool

    init(from hearing: NyaayHearing) {
        self.id = hearing.id
        self.caseId = hearing.caseId
        self.hearingDate = hearing.hearingDate
        self.nextHearingDate = hearing.nextHearingDate
        self.orderText = hearing.orderText
        self.attendanceMarked = hearing.attendanceMarked
    }
}
