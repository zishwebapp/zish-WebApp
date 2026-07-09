"use client"

import { ZishCafeLogo } from "@/components/zish-cafe-logo"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LogoShowcase() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 p-8">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Zish Cafe Logo Showcase</h1>
          <p className="text-gray-600">Beautiful circular logo design with vintage aesthetics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Large Logo */}
          <Card className="col-span-full lg:col-span-2">
            <CardHeader>
              <CardTitle>Main Logo (Large)</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center p-12">
              <ZishCafeLogo size={400} />
            </CardContent>
          </Card>

          {/* Medium Logo */}
          <Card>
            <CardHeader>
              <CardTitle>Medium Size</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center p-8">
              <ZishCafeLogo size={250} />
            </CardContent>
          </Card>

          {/* Small Logo */}
          <Card>
            <CardHeader>
              <CardTitle>Small Size</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center p-6">
              <ZishCafeLogo size={150} />
            </CardContent>
          </Card>

          {/* Mini Logo */}
          <Card>
            <CardHeader>
              <CardTitle>Mini Size</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center p-4">
              <ZishCafeLogo size={100} />
            </CardContent>
          </Card>

          {/* Logo on Dark Background */}
          <Card className="bg-gray-800">
            <CardHeader>
              <CardTitle className="text-white">On Dark Background</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center p-8">
              <ZishCafeLogo size={200} />
            </CardContent>
          </Card>
        </div>

        {/* Usage Examples */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">Usage Examples</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Header Example */}
            <Card>
              <CardHeader>
                <CardTitle>Header Logo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-4 rounded-lg shadow-inner">
                  <div className="flex items-center justify-between">
                    <ZishCafeLogo size={60} />
                    <nav className="flex space-x-4">
                      <a href="#" className="text-gray-600 hover:text-purple-600">
                        Menu
                      </a>
                      <a href="#" className="text-gray-600 hover:text-purple-600">
                        About
                      </a>
                      <a href="#" className="text-gray-600 hover:text-purple-600">
                        Contact
                      </a>
                    </nav>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Card Example */}
            <Card>
              <CardHeader>
                <CardTitle>Business Card</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-lg text-white">
                  <div className="flex items-center space-x-4">
                    <ZishCafeLogo size={80} />
                    <div>
                      <h3 className="text-xl font-bold">Zish Cafe</h3>
                      <p className="text-purple-100">Mini England Since 2026</p>
                      <p className="text-sm text-purple-200 mt-2">
                        📍 123 Cafe Street
                        <br />📞 +91 98765 43210
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Color Variations */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">Logo Variations</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Original */}
            <Card>
              <CardContent className="p-6 text-center">
                <ZishCafeLogo size={120} />
                <p className="mt-2 text-sm text-gray-600">Original</p>
              </CardContent>
            </Card>

            {/* On White */}
            <Card className="bg-white">
              <CardContent className="p-6 text-center">
                <ZishCafeLogo size={120} />
                <p className="mt-2 text-sm text-gray-600">On White</p>
              </CardContent>
            </Card>

            {/* On Dark */}
            <Card className="bg-gray-900">
              <CardContent className="p-6 text-center">
                <ZishCafeLogo size={120} />
                <p className="mt-2 text-sm text-white">On Dark</p>
              </CardContent>
            </Card>

            {/* On Colored */}
            <Card className="bg-gradient-to-br from-blue-400 to-blue-600">
              <CardContent className="p-6 text-center">
                <ZishCafeLogo size={120} />
                <p className="mt-2 text-sm text-white">On Color</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="mt-16">
          <Card>
            <CardHeader>
              <CardTitle>Logo Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Design Elements:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Circular design with multiple border rings</li>
                    <li>• Gradient background (Pink to Purple)</li>
                    <li>• Golden yellow text with shadow effects</li>
                    <li>• Vintage/retro aesthetic</li>
                    <li>• Scalable vector-based design</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Usage Guidelines:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Minimum size: 60px diameter</li>
                    <li>• Recommended sizes: 100px, 150px, 200px</li>
                    <li>• Works on light and dark backgrounds</li>
                    <li>• Maintains quality at all sizes</li>
                    <li>• Responsive and mobile-friendly</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
