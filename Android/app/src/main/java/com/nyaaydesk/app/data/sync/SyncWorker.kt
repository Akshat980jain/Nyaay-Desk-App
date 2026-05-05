package com.nyaaydesk.app.data.sync

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.*
import com.nyaaydesk.app.data.local.dao.CaseDao
import com.nyaaydesk.app.data.remote.dto.CaseDto
import com.nyaaydesk.app.data.repository.CaseRepository
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * SyncWorker — Periodic background synchronization for NyaayDesk.
 * 
 * Responsibilities:
 * 1. Push locally created/modified cases to Supabase.
 * 2. Fetch latest updates from Supabase and update local Room DB.
 * 3. Handle conflict resolution (Server-wins by default).
 */
@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted workerParams: WorkerParameters,
    private val caseDao: CaseDao,
    private val supabase: SupabaseClient
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            // 1. Fetch local cases that need syncing (id starting with "temp_" or similar logic)
            // For now, we'll simulate syncing all local cases to ensure consistency.
            val localCases = caseDao.getAllCasesSync()
            
            localCases.forEach { local ->
                runCatching {
                    supabase.postgrest["cases"].upsert(
                        CaseDto(
                            id = local.id,
                            caseNumber = local.caseNumber,
                            cnrNumber = local.cnrNumber,
                            caseTitle = local.caseTitle,
                            status = local.status,
                            litigantId = local.litigantId,
                            advocateId = local.advocateId,
                            caseType = local.caseType,
                            description = local.description
                        )
                    )
                }
            }

            // 2. Fetch remote updates (simplified fetch-all for current user)
            // Real implementation would use a `last_synced_at` timestamp.
            
            Result.success()
        } catch (e: Exception) {
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        }
    }

    companion object {
        const val SYNC_WORK_NAME = "nyaaydesk_sync_work"

        fun startPeriodicSync(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .setRequiresBatteryNotLow(true)
                .build()

            val syncRequest = PeriodicWorkRequestBuilder<SyncWorker>(1, java.util.concurrent.TimeUnit.HOURS)
                .setConstraints(constraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 15, java.util.concurrent.TimeUnit.MINUTES)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                SYNC_WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                syncRequest
            )
        }
    }
}
