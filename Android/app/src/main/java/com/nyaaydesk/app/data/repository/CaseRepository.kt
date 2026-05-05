package com.nyaaydesk.app.data.repository

import com.nyaaydesk.app.data.local.dao.CaseDao
import com.nyaaydesk.app.data.local.entity.CaseEntity
import com.nyaaydesk.app.data.remote.dto.CaseDto
import com.nyaaydesk.app.domain.model.Resource
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Order
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.realtime.postgresChangeFlow
import io.github.jan.supabase.realtime.realtime
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

/**
 * CaseRepository — the single source of truth for all case data.
 *
 * Offline-First Strategy:
 * 1. Always emits from local Room DB immediately (instant UI display).
 * 2. Fetches fresh data from Supabase in background.
 * 3. Overwrites local DB on success — Room Flow emits new data automatically.
 *
 * Realtime Strategy:
 * Subscribes to Supabase Realtime channel. On INSERT/UPDATE from the DB,
 * the repository refreshes the local cache automatically.
 */
@Singleton
class CaseRepository @Inject constructor(
    private val supabase: SupabaseClient,
    private val caseDao: CaseDao
) {

    /** Get all cases for the currently authenticated litigant. */
    fun getCasesForLitigant(litigantId: String): Flow<Resource<List<CaseEntity>>> = networkBoundFlow(
        localSource = { caseDao.observeCasesForLitigant(litigantId) },
        remoteFetch = {
            supabase.postgrest["cases"]
                .select {
                    filter { eq("litigant_id", litigantId) }
                    order("next_hearing_date", Order.ASCENDING)
                }
                .decodeList<CaseDto>()
        },
        saveResult = { dtos ->
            caseDao.insertAll(dtos.map { it.toEntity() })
        }
    )

    /** Get all cases for the currently authenticated advocate. */
    fun getCasesForAdvocate(advocateId: String): Flow<Resource<List<CaseEntity>>> = networkBoundFlow(
        localSource = { caseDao.observeCasesForAdvocate(advocateId) },
        remoteFetch = {
            supabase.postgrest["cases"]
                .select {
                    filter { eq("advocate_id", advocateId) }
                    order("next_hearing_date", Order.ASCENDING)
                }
                .decodeList<CaseDto>()
        },
        saveResult = { dtos -> caseDao.insertAll(dtos.map { it.toEntity() }) }
    )

    /** Subscribe to Supabase Realtime for live case updates. */
    fun subscribeToRealtimeUpdates(userId: String) {
        CoroutineScope(Dispatchers.IO).launch {
            val channel = supabase.realtime.channel("cases-channel")
            val changes = channel.postgresChangeFlow<io.github.jan.supabase.realtime.PostgresAction>(schema = "public") {
                table = "cases"
            }
            channel.subscribe()
            changes.collect { action ->
                when (action) {
                    is io.github.jan.supabase.realtime.PostgresAction.Insert -> {
                        val dto = action.decodeRecord<CaseDto>()
                        caseDao.insertCase(dto.toEntity())
                    }
                    is io.github.jan.supabase.realtime.PostgresAction.Update -> {
                        val dto = action.decodeRecord<CaseDto>()
                        caseDao.insertCase(dto.toEntity())
                    }
                    else -> {}
                }
            }
        }
    }

    /** Insert a new case filing into Supabase. */
    suspend fun fileNewCase(dto: CaseDto): Result<Unit> = runCatching {
        supabase.postgrest["cases"].insert(dto)
        caseDao.insertCase(dto.toEntity())
    }

    // Helper: Network-Bound Resource pattern
    private fun <T> networkBoundFlow(
        localSource: () -> Flow<T>,
        remoteFetch: suspend () -> List<CaseDto>,
        saveResult: suspend (List<CaseDto>) -> Unit
    ): Flow<Resource<T>> = flow {
        emit(Resource.Loading())
        emitAll(localSource().map { Resource.Success(it) })
        try {
            val remote = remoteFetch()
            saveResult(remote)
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Network error"))
        }
    }
}

// Extension: DTO -> Room Entity mapping
fun CaseDto.toEntity() = CaseEntity(
    id = id,
    caseNumber = caseNumber,
    cnrNumber = cnrNumber,
    caseTitle = caseTitle,
    status = status,
    litigantId = litigantId,
    advocateId = advocateId,
    courtId = courtId,
    judgeName = judgeName,
    filingDate = filingDate,
    nextHearingDate = nextHearingDate,
    caseType = caseType,
    description = description,
    documentUrls = documentUrls ?: emptyList()
)
