package com.nyaaydesk.app.di

import com.nyaaydesk.app.data.repository.AuthRepository
import com.nyaaydesk.app.data.repository.CaseRepository
import com.nyaaydesk.app.data.repository.HearingRepository
import dagger.hilt.EntryPoint
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

/**
 * Hilt EntryPoint exposing repositories for injection into non-Hilt classes.
 * All repositories are bound as singletons via constructor injection.
 * ViewModels obtain them via @Inject in their constructors automatically.
 */
@EntryPoint
@InstallIn(SingletonComponent::class)
interface RepositoryEntryPoint {
    fun authRepository(): AuthRepository
    fun caseRepository(): CaseRepository
    fun hearingRepository(): HearingRepository
}
