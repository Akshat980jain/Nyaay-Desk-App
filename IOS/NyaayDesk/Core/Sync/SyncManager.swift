import Foundation
import BackgroundTasks
import SwiftData

/**
 * SyncManager (iOS) — Handles background synchronization.
 * 
 * Uses BackgroundTasks (BGTaskScheduler) to periodically fetch 
 * updates from Supabase and sync them to the local SwiftData store.
 */
@MainActor
final class SyncManager {
    static val shared = SyncManager()
    private let identifier = "com.nyaaydesk.app.sync"
    
    private let repo = CaseRepository()

    func registerTasks() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: identifier, using: nil) { task in
            self.handleAppRefresh(task: task as! BGAppRefreshTask)
        }
    }

    func scheduleSync() {
        let request = BGAppRefreshTaskRequest(identifier: identifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 mins
        
        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("Could not schedule app refresh: \(error)")
        }
    }

    private func handleAppRefresh(task: BGAppRefreshTask) {
        scheduleSync() // Schedule the next one
        
        task.expirationHandler = {
            // Cancel operations if needed
        }
        
        Task {
            do {
                // Fetch and sync logic
                // In a real app, we'd fetch for the current user and update SwiftData
                task.setTaskCompleted(success: true)
            } catch {
                task.setTaskCompleted(success: false)
            }
        }
    }
}
