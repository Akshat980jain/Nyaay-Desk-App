package com.nyaaydesk.app.data.repository

import com.nyaaydesk.app.data.local.dao.HearingDao
import com.nyaaydesk.app.data.local.entity.HearingEntity
import com.nyaaydesk.app.data.remote.dto.HearingDto
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.map
import com.nyaaydesk.app.domain.model.Resource
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class HearingRepository @Inject constructor(
    private val supabase: SupabaseClient,
    private val hearingDao: HearingDao
) {
    fun getHearingsForCase(caseId: String): Flow<Resource<List<HearingEntity>>> = flow {
        emit(Resource.Loading())
        emitAll(hearingDao.observeHearingsForCase(caseId).map { Resource.Success(it) })
        try {
            val remote = supabase.postgrest["hearings"]
                .select {
                    filter { eq("case_id", caseId) }
                    order("hearing_date", Order.DESCENDING)
                }
                .decodeList<HearingDto>()
            hearingDao.insertAll(remote.map { it.toEntity() })
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Failed to fetch hearings"))
        }
    }

    suspend fun addHearing(hearingDto: HearingDto): Result<Unit> = runCatching {
        supabase.postgrest["hearings"].insert(hearingDto)
        hearingDao.insertHearing(hearingDto.toEntity())
    }

    suspend fun updateHearing(hearingDto: HearingDto): Result<Unit> = runCatching {
        supabase.postgrest["hearings"]
            .update(hearingDto) { filter { eq("id", hearingDto.id) } }
        hearingDao.insertHearing(hearingDto.toEntity())
    }
}

fun HearingDto.toEntity() = HearingEntity(
    id = id,
    caseId = caseId,
    hearingDate = hearingDate,
    nextHearingDate = nextHearingDate,
    orderText = orderText,
    attendanceMarked = attendanceMarked,
    judgeNotes = judgeNotes,
    createdAt = createdAt
)
