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
                LinearGradient(colors: [.nyaayNavyDark, .nyaayNavy], startPoint: .top, endPoint: .bottom)
                    .ignoresSafeArea()
                
                VStack {
                    VStack {
                        Text("⚖️")
                            .font(.system(size: 100))
                        Text("NyaayDesk")
                            .font(.system(size: 40, weight: .bold, design: .serif))
                            .foregroundColor(.nyaayGold)
                        Text("न्याय your way")
                            .font(.headline)
                            .foregroundColor(.white.opacity(0.7))
                    }
                    .scaleEffect(size)
                    .opacity(opacity)
                    .onAppear {
                        withAnimation(.easeIn(duration: 1.2)) {
                            self.size = 1.0
                            self.opacity = 1.0
                        }
                    }
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
