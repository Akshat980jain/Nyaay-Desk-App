import SwiftUI
import Charts

/**
 * AdminAnalyticsView (iOS) — Visual system metrics.
 * 
 * Uses the native Charts framework for high-performance data visualization.
 */
struct AdminAnalyticsView: View {
    let caseData: [CaseStat] = [
        .init(status: "Pending", count: 45, color: .orange),
        .init(status: "Disposed", count: 30, color: .green),
        .init(status: "Stayed", count: 15, color: .red)
    ]

    var body: some View {
        NavigationStack {
            List {
                // 1. Chart Section
                Section("Case Status Distribution") {
                    VStack {
                        Chart(caseData) { item in
                            SectorMark(
                                angle: .value("Count", item.count),
                                innerRadius: .ratio(0.6),
                                angularInset: 2
                            )
                            .foregroundStyle(item.color)
                            .cornerRadius(5)
                        }
                        .frame(height: 250)
                        .padding(.vertical)
                        
                        HStack(spacing: 20) {
                            ForEach(caseData) { item in
                                HStack(spacing: 4) {
                                    Circle().fill(item.color).frame(width: 8, height: 8)
                                    Text(item.status).font(.caption)
                                }
                            }
                        }
                    }
                }
                
                // 2. Metrics Section
                Section("System Throughput") {
                    HStack {
                        VStack(alignment: .leading) {
                            Text("Active Users").font(.caption).foregroundStyle(.secondary)
                            Text("1,240").font(.title2.bold())
                        }
                        Spacer()
                        VStack(alignment: .leading) {
                            Text("Filings Today").font(.caption).foregroundStyle(.secondary)
                            Text("84").font(.title2.bold())
                        }
                    }
                }
                
                // 3. Security Status
                Section {
                    HStack {
                        Image(systemName: "checkmark.shield.fill")
                            .foregroundStyle(.green)
                            .font(.title)
                        VStack(alignment: .leading) {
                            Text("Blockchain Integrity").font(.headline)
                            Text("Real-time verification active").font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text("100%")
                            .font(.title3.bold())
                            .foregroundStyle(.green)
                    }
                    .padding(.vertical, 8)
                }
            }
            .navigationTitle("Analytics")
        }
    }
}

struct CaseStat: Identifiable {
    let id = UUID()
    let status: String
    let count: Int
    let color: Color
}
