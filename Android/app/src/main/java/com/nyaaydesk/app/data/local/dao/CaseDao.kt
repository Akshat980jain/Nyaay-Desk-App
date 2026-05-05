package com.nyaaydesk.app.data.local.dao

import androidx.room.*
import com.nyaaydesk.app.data.local.entity.CaseEntity
import kotlinx.coroutines.flow.Flow

/** Data Access Object for all case-related database operations. */
@Dao
interface CaseDao {

    /** Returns a live Flow of all cached cases. Updates UI automatically when DB changes. */
    @Query("SELECT * FROM cases ORDER BY nextHearingDate ASC")
    fun observeAllCases(): Flow<List<CaseEntity>>

    /** Returns cases for a specific litigant. Matches Supabase RLS: cases WHERE litigant_id = uid */
    @Query("SELECT * FROM cases WHERE litigantId = :litigantId ORDER BY nextHearingDate ASC")
    fun observeCasesForLitigant(litigantId: String): Flow<List<CaseEntity>>

    /** Returns cases for a specific advocate. */
    @Query("SELECT * FROM cases WHERE advocateId = :advocateId ORDER BY nextHearingDate ASC")
    fun observeCasesForAdvocate(advocateId: String): Flow<List<CaseEntity>>

    /** Returns cases for a specific court. Used by Clerk's daily cause list. */
    @Query("SELECT * FROM cases WHERE courtId = :courtId ORDER BY caseNumber ASC")
    fun observeCasesForCourt(courtId: String): Flow<List<CaseEntity>>

    /** Gets today's cases for an advocate — powers the "Today's Cause List" dashboard widget. */
    @Query("SELECT * FROM cases WHERE advocateId = :advocateId AND nextHearingDate = :todayDate")
    fun observeTodaysCauseList(advocateId: String, todayDate: String): Flow<List<CaseEntity>>

    @Query("SELECT * FROM cases WHERE id = :caseId")
    suspend fun getCaseById(caseId: String): CaseEntity?

    @Query("SELECT * FROM cases WHERE caseNumber LIKE '%' || :query || '%' OR caseTitle LIKE '%' || :query || '%'")
    fun searchCases(query: String): Flow<List<CaseEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(cases: List<CaseEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCase(case: CaseEntity)

    @Update
    suspend fun updateCase(case: CaseEntity)

    @Delete
    suspend fun deleteCase(case: CaseEntity)

    @Query("DELETE FROM cases")
    suspend fun clearAll()
}
