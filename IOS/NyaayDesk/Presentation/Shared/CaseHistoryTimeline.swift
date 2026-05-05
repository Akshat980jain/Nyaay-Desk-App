import SwiftUI

/**
 * CaseHistoryTimeline (iOS) — Modern vertical timeline.
 * 
 * Uses a custom View for the timeline spine and cards for hearing details.
 */
struct CaseHistoryTimeline: View {
    let hearings: [NyaayHearing]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                ForEach(Array(hearings.enumerated()), id: \.element.id) { index, hearing in
                    HStack(alignment: .top, spacing: 0) {
                        // Spine & Dot
                        VStack(spacing: 0) {
                            if index == 0 {
                                Color.clear.frame(height: 10)
                            } else {
                                Rectangle()
                                    .fill(Color.nyaayNavy.opacity(0.2))
                                    .frame(width: 2)
                            }
                            
                            Circle()
                                .fill(index == 0 ? Color.nyaayGold : Color.nyaayNavy)
                                .frame(width: 14, height: 14)
                                .overlay(
                                    Circle()
                                        .stroke(Color.white, lineWidth: 2)
                                )
                                .padding(.vertical, 8)
                            
                            if index == hearings.count - 1 {
                                Color.clear.frame(height: 10)
                            } else {
                                Rectangle()
                                    .fill(Color.nyaayNavy.opacity(0.2))
                                    .frame(width: 2)
                            }
                        }
                        .frame(width: 40)
                        
                        // Content Card
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text(hearing.hearingDate)
                                    .font(.subheadline.bold())
                                    .foregroundStyle(.nyaayNavy)
                                Spacer()
                                if hearing.attendanceMarked {
                                    Text("HEARD")
                                        .font(.caption2.bold())
                                        .padding(.horizontal, 6)
                                        .padding(.vertical, 2)
                                        .background(.green.opacity(0.1))
                                        .foregroundStyle(.green)
                                        .clipShape(Capsule())
                                }
                            }
                            
                            Text(hearing.orderText ?? "Pending order update.")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                            
                            if let next = hearing.nextHearingDate {
                                Text("Next: \(next)")
                                    .font(.caption2.bold())
                                    .foregroundStyle(.nyaayGold)
                                    .padding(.top, 4)
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .shadow(color: .black.opacity(0.05), radius: 3, y: 1)
                        .padding(.vertical, 8)
                        .padding(.trailing, 16)
                    }
                }
            }
        }
    }
}

// Dummy model if not defined elsewhere
struct NyaayHearing: Codable, Identifiable {
    let id: String
    let caseId: String
    let hearingDate: String
    let nextHearingDate: String?
    let orderText: String?
    let attendanceMarked: Bool
    
    enum CodingKeys: String, CodingKey {
        case id, hearingDate = "hearing_date", nextHearingDate = "next_hearing_date", orderText = "order_text", attendanceMarked = "attendance_marked", caseId = "case_id"
    }
}
