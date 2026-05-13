import SwiftUI

/**
 * SplashScreen (iOS) — Modern SwiftUI splash screen.
 * 
 * Includes smooth transitions and brand-consistent design.
 */
struct SplashScreen: View {
    @State private var isActive = false
    @State private var size = 0.8
    @State private var opacity = 0.5
    
    var onFinished: () -> Void

    var body: some View {
        if isActive {
            EmptyView().onAppear { onFinished() }
        } else {
            ZStack {
                Color.appBackground
                    .ignoresSafeArea()
                
                VStack(spacing: 20) {
                    VStack(spacing: 12) {
                        Text("⚖️")
                            .font(.system(size: 110))
                        
                        Text("NyaayDesk")
                            .font(.system(size: 44, weight: .black, design: .rounded))
                            .foregroundColor(.appNavy)
                        
                        Text("Digital Justice Platform")
                            .font(.system(size: 18, weight: .medium))
                            .foregroundColor(.appNavy.opacity(0.8))
                    }
                    .scaleEffect(size)
                    .opacity(opacity)
                    .onAppear {
                        withAnimation(.spring(response: 1.0, dampingFraction: 0.7, blendDuration: 0)) {
                            self.size = 1.0
                            self.opacity = 1.0
                        }
                    }
                    
                    Text("न्याय your way")
                        .font(.system(size: 14, weight: .regular))
                        .foregroundColor(.appNavy.opacity(0.4))
                        .tracking(2)
                        .padding(.top, 40)
                        .opacity(opacity)
                }
            }

            .onAppear {
                DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
                    withAnimation {
                        self.isActive = true
                    }
                }
            }
        }
    }
}
