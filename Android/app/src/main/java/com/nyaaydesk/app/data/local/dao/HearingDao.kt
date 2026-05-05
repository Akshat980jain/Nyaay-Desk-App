package com.nyaaydesk.app.data.local.dao

import androidx.room.*
import com.nyaaydesk.app.data.local.entity.HearingEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface HearingDao {

    @Query("SELECT * FROM hearings WHERE caseId = :caseId ORDER BY hearingDate DESC")
    fun observeHearingsForCase(caseId: String): Flow<List<HearingEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(hearings: List<HearingEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHearing(hearing: HearingEntity)

    @Update
    suspend fun updateHearing(hearing: HearingEntity)

    @Query("DELETE FROM hearings WHERE caseId = :caseId")
    suspend fun clearHearingsForCase(caseId: String)
}
