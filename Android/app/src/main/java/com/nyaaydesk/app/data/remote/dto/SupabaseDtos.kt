package com.nyaaydesk.app.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class CaseDto(
    val id: String,
    @SerialName("case_number") val caseNumber: String,
    @SerialName("cnr_number") val cnrNumber: String? = null,
    @SerialName("case_title") val caseTitle: String,
    val status: String,
    @SerialName("litigant_id") val litigantId: String,
    @SerialName("advocate_id") val advocateId: String? = null,
    @SerialName("court_id") val courtId: String? = null,
    @SerialName("judge_name") val judgeName: String? = null,
    @SerialName("filing_date") val filingDate: String? = null,
    @SerialName("next_hearing_date") val nextHearingDate: String? = null,
    @SerialName("case_type") val caseType: String? = null,
    val description: String? = null,
    @SerialName("document_urls") val documentUrls: List<String>? = null,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class HearingDto(
    val id: String,
    @SerialName("case_id") val caseId: String,
    @SerialName("hearing_date") val hearingDate: String,
    @SerialName("next_hearing_date") val nextHearingDate: String? = null,
    @SerialName("order_text") val orderText: String? = null,
    @SerialName("attendance_marked") val attendanceMarked: Boolean = false,
    @SerialName("judge_notes") val judgeNotes: String? = null,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class UserProfileDto(
    val id: String,
    val email: String,
    @SerialName("user_type") val userType: String,
    @SerialName("full_name") val fullName: String? = null,
    val phone: String? = null,
    @SerialName("bar_council_id") val barCouncilId: String? = null,
    @SerialName("court_id") val courtId: String? = null,
    @SerialName("is_verified") val isVerified: Boolean = false,
    @SerialName("avatar_url") val avatarUrl: String? = null
)

@Serializable
data class DashboardSummaryDto(
    @SerialName("total_cases") val totalCases: Int = 0,
    @SerialName("pending_cases") val pendingCases: Int = 0,
    @SerialName("disposed_cases") val disposedCases: Int = 0,
    @SerialName("today_hearings") val todayHearings: Int = 0,
    @SerialName("pending_noc_requests") val pendingNocRequests: Int = 0
)

@Serializable
data class JoinRequestDto(
    val id: String,
    @SerialName("case_id") val caseId: String,
    @SerialName("advocate_id") val advocateId: String,
    val status: String,
    @SerialName("case_title") val caseTitle: String? = null,
    @SerialName("litigant_name") val litigantName: String? = null,
    @SerialName("created_at") val createdAt: String? = null
)
