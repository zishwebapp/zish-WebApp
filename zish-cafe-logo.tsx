"use client"

interface ZishCafeLogoProps {
  size?: number
  className?: string
}

export function ZishCafeLogo({ size = 300, className = "" }: ZishCafeLogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Outer border rings */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "linear-gradient(45deg, #dc2626, #f59e0b)",
          padding: "8px",
        }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: "linear-gradient(45deg, #fbbf24, #f59e0b)",
            padding: "4px",
          }}
        >
          <div
            className="w-full h-full rounded-full relative overflow-hidden"
            style={{
              background: "linear-gradient(180deg, #ec4899 0%, #be185d 50%, #7c2d92 100%)",
            }}
          >
            {/* Content container */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
              {/* Top text - MINI ENGLAND */}
              <div
                className="text-yellow-300 font-bold tracking-wider mb-4"
                style={{
                  fontSize: `${size * 0.06}px`,
                  textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                  fontFamily: "serif",
                }}
              >
                MINI ENGLAND
              </div>

              {/* Main logo text - Zish Cafe */}
              <div
                className="text-yellow-300 font-bold italic mb-4"
                style={{
                  fontSize: `${size * 0.15}px`,
                  textShadow: "3px 3px 6px rgba(0,0,0,0.4)",
                  fontFamily: "cursive",
                  transform: "rotate(-2deg)",
                  letterSpacing: "2px",
                }}
              >
                Zish Cafe
              </div>

              {/* Bottom text - Since 2026 */}
              <div
                className="text-yellow-300 font-semibold tracking-wide"
                style={{
                  fontSize: `${size * 0.055}px`,
                  textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                  fontFamily: "serif",
                }}
              >
                Since 2026
              </div>
            </div>

            {/* Subtle inner glow effect */}
            <div
              className="absolute inset-4 rounded-full opacity-20"
              style={{
                background: "radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 70%)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
