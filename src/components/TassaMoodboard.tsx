import React from 'react';

const TassaMoodboard = () => {
  const colors = {
    primary: { name: 'TASSA Red', hex: '#E31E24', rgb: '227, 30, 36' },
    secondary: { name: 'Industrial Black', hex: '#1A1A1A', rgb: '26, 26, 26' },
    accent: { name: 'Steel Gray', hex: '#6B6B6B', rgb: '107, 107, 107' },
    light: { name: 'Clean White', hex: '#FFFFFF', rgb: '255, 255, 255' },
    warmGray: { name: 'Rope Beige', hex: '#C4B8A5', rgb: '196, 184, 165' },
    productOrange: { name: 'Safety Orange', hex: '#E87722', rgb: '232, 119, 34' },
    productBlue: { name: 'Marine Blue', hex: '#2B5C9E', rgb: '43, 92, 158' },
  };

  const keywords = [
    'Industrial', 'Strength', 'Reliability', 'Quality', 'Durability',
    'South African', 'Manufacturing', 'Premium', 'Trust', 'Excellence'
  ];

  const brandValues = [
    { icon: '🏭', value: 'Local Manufacturing', desc: 'Proudly South African' },
    { icon: '💪', value: 'Boundless Strength', desc: 'Built to last' },
    { icon: '☀️', value: 'UV Resistant', desc: 'Climate tough' },
    { icon: '🎯', value: 'Customization', desc: 'Tailored solutions' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-gray-900 via-red-600 to-gray-900 rounded-2xl p-6 mb-6 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute h-full w-16 bg-black transform -skew-x-12"
              style={{ left: `${i * 14}%`, opacity: 0.3 }}
            />
          ))}
        </div>
        <div className="relative z-10 text-center">
          <h1 className="text-3xl font-bold text-white mb-1">TASSA Brand Moodboard</h1>
          <p className="text-gray-200">Twines and Straps SA (Pty) Ltd</p>
          <p className="text-red-200 mt-1 italic text-sm">&quot;Boundless Strength, Endless Solutions!&quot;</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Color Palette */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 bg-red-600 rounded-full"></span>
            Color Palette
          </h2>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
            {Object.entries(colors).map(([key, color]) => (
              <div key={key} className="group">
                <div
                  className="h-16 rounded-lg shadow-md transition-transform hover:scale-105 cursor-pointer"
                  style={{ backgroundColor: color.hex }}
                />
                <p className="mt-1 font-medium text-gray-800 text-xs">{color.name}</p>
                <p className="text-gray-500 text-xs">{color.hex}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Brand Keywords */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Brand Keywords</h2>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((word) => (
              <span
                key={word}
                className="px-2 py-1 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full text-xs font-medium"
              >
                {word}
              </span>
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Typography</h2>
          <div className="space-y-3">
            <div className="border-l-4 border-red-600 pl-3">
              <p className="text-2xl font-bold text-gray-900">Heading</p>
              <p className="text-gray-500 text-xs">Bold • Commanding</p>
            </div>
            <div className="border-l-4 border-gray-600 pl-3">
              <p className="text-lg font-semibold text-gray-800">Subheading</p>
              <p className="text-gray-500 text-xs">Semi-bold • Clear</p>
            </div>
            <div className="border-l-4 border-gray-400 pl-3">
              <p className="text-sm text-gray-700">Body text for readability</p>
              <p className="text-gray-500 text-xs">Regular • Professional</p>
            </div>
          </div>
        </div>

        {/* Pattern & Texture */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Patterns</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-20 rounded-lg overflow-hidden relative bg-gray-900">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute h-full w-3 transform -skew-x-12"
                  style={{
                    left: `${i * 20}%`,
                    backgroundColor: i % 2 === 0 ? '#E31E24' : '#6B6B6B',
                  }}
                />
              ))}
            </div>
            <div className="h-20 rounded-lg bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300" />
            <div className="h-20 rounded-lg bg-gray-800 relative overflow-hidden">
              <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                backgroundSize: '12px 12px'
              }} />
            </div>
            <div className="h-20 rounded-lg bg-gradient-to-br from-red-600 via-red-700 to-gray-900" />
          </div>
        </div>

        {/* Brand Values */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Brand Values</h2>
          <div className="space-y-2">
            {brandValues.map((item) => (
              <div key={item.value} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{item.value}</p>
                  <p className="text-gray-500 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Colors */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Product Range</h2>
          <div className="flex gap-3 items-end justify-center">
            {[
              { color: '#6B6B6B', height: 'h-24', label: 'Steel Cable' },
              { color: '#E87722', height: 'h-18', label: 'Safety Rope' },
              { color: '#2B5C9E', height: 'h-14', label: 'Marine Twine' },
              { color: '#C4B8A5', height: 'h-20', label: 'Natural Rope' },
              { color: '#1A1A1A', height: 'h-12', label: 'Heavy Duty' },
            ].map((product, i) => (
              <div key={i} className="text-center group">
                <div
                  className="w-12 rounded-t-full transition-transform hover:scale-110"
                  style={{ backgroundColor: product.color, height: parseInt(product.height.split('-')[1]) * 4 }}
                />
                <p className="text-xs text-gray-600 mt-1">{product.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Logo Concept */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Logo Elements</h2>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-4 border-red-600 flex items-center justify-center bg-white shadow-lg">
              <div className="text-center">
                <span className="text-2xl font-bold text-red-600">TA</span>
                <span className="text-2xl font-bold text-gray-400">S</span>
                <br />
                <span className="text-2xl font-bold text-gray-400">S</span>
                <span className="text-2xl font-bold text-red-600">A</span>
              </div>
            </div>
            <p className="mt-2 text-gray-600 text-xs text-center">Circular badge • Bold letters</p>
          </div>
        </div>

        {/* Visual Style Guide */}
        <div className="lg:col-span-3 bg-gradient-to-r from-gray-900 to-red-900 rounded-xl shadow-lg p-4 text-white">
          <h2 className="text-xl font-bold mb-3">Visual Style Summary</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <h3 className="font-semibold text-red-300 mb-1 text-sm">Mood</h3>
              <p className="text-gray-300 text-xs">Industrial strength meets South African pride. Professional and reliable.</p>
            </div>
            <div>
              <h3 className="font-semibold text-red-300 mb-1 text-sm">Imagery</h3>
              <p className="text-gray-300 text-xs">Product-focused photography, vibrant rope colors on neutral backgrounds.</p>
            </div>
            <div>
              <h3 className="font-semibold text-red-300 mb-1 text-sm">Layout</h3>
              <p className="text-gray-300 text-xs">Bold diagonal elements, clean sections, strong visual hierarchy.</p>
            </div>
            <div>
              <h3 className="font-semibold text-red-300 mb-1 text-sm">Tone</h3>
              <p className="text-gray-300 text-xs">Professional yet approachable. Emphasizes quality and trust.</p>
            </div>
          </div>
        </div>

        {/* Design Applications */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Design Applications</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-red-900 rounded-lg p-3 text-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold text-xs">TS</span>
                </div>
                <span className="font-bold text-sm">TASSA</span>
              </div>
              <p className="text-xs text-gray-300">Business Card</p>
            </div>
            <div className="relative overflow-hidden rounded-lg h-16 bg-red-600">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute h-full w-6 bg-black transform -skew-x-12 opacity-20"
                  style={{ left: `${i * 25}%` }}
                />
              ))}
              <p className="absolute bottom-2 left-3 text-white text-xs">Header Banner</p>
            </div>
            <div className="flex flex-col gap-2 justify-center">
              <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">
                Contact Us
              </button>
              <button className="border-2 border-gray-800 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-800 hover:text-white text-sm transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-gray-500 text-xs">
        <p>TASSA Brand Moodboard • Proudly South African • Est. 2016</p>
      </div>
    </div>
  );
};

export default TassaMoodboard;
