# Version 5 - Contemporary Heritage Fusion

## 🚀 启动项目

从项目根目录启动本地服务器（可访问所有版本）：

```bash
cd /Users/ke/Documents/GitProjects/FoodICH
python3 -m http.server 8000
```

然后访问：
- v5: http://localhost:8000/v5/
- v4: http://localhost:8000/v4/
- 其他版本同理

## 🎨 Design Overview

Version 4 represents a complete redesign of the Food ICH website with a modern, sophisticated aesthetic that honors traditional Chinese culinary heritage while embracing contemporary web design principles.

### Design Philosophy: "Contemporary Heritage Fusion"

- **Typography**: Elegant Ma Shan Zheng for Chinese text paired with modern DM Sans for English, creating a harmonious East-meets-West aesthetic
- **Color Palette**: Warm earth tones inspired by traditional Chinese cooking
  - Cinnabar Red (#C73E1D) - Primary accent
  - Deep Vermillion (#8B2500) - Secondary accent
  - Warm Cream (#F4EDE4) - Background base
  - Soft Gold (#D4AF37) - Highlights
  - Charcoal (#1A1A1A) - Text
- **Visual Language**: Sophisticated editorial design with immersive storytelling, generous whitespace, and smooth animations

## 🚀 Key Features & Improvements

### 1. Modal-Based Dish Exploration
- **Replaced**: Individual dish pages (claypot.html, hakka-tofu.html, steam-buns.html)
- **With**: Integrated modal system on the homepage
- **Benefits**:
  - Seamless user experience without page reloads
  - Faster navigation between dishes
  - Maintains 3D scene context
  - Mobile-friendly fullscreen experience

### 2. Removed Food Directory Page
- **Deleted**: food.html listing page
- **Replaced with**: Direct dish access via 3D model interaction
- **Result**: Cleaner navigation flow and more immersive experience

### 3. Unified Visual System
All pages now share:
- Consistent typography hierarchy
- Unified color palette
- Standardized spacing system
- Coordinated animation timing
- Responsive grid layouts

### 4. Enhanced Typography
- **Chinese Text**: Ma Shan Zheng (cursive, elegant)
- **English Text**: DM Sans (modern, clean) + Cormorant Garamond (serif, refined)
- **Result**: Distinctive, memorable typography that avoids generic "AI" fonts

### 5. Modern Interactions
- Smooth modal transitions with backdrop blur
- Hover effects with color transitions
- Staggered entrance animations for content
- Touch-optimized for mobile devices

## 📁 File Structure

```
v4/
├── index.html          # Homepage with 3D scene and modal system
├── about.html          # Team information
├── exhibition.html     # Exhibition details and videos
├── css/
│   └── style.css      # Complete design system
├── js/
│   └── main.js        # Navigation, particles, and modal functionality
└── README.md          # This file
```

## 🎯 Implementation Highlights

### Modal System
The dish modal system is entirely self-contained in `index.html`:
- Clicking clickable 3D food models opens corresponding modals
- Each modal displays dish information and media gallery
- Floating media animations with videos prioritized
- Escape key and outside-click to close
- Prevents body scroll when open

### Responsive Design
- **Desktop**: Side-by-side modal layout (text + media)
- **Tablet**: Stacked vertical layout
- **Mobile**: Optimized padding and font sizes
- Breakpoints: 1024px, 768px

### Animation Strategy
- Page load: Staggered fade-in-up animations
- Modals: Slide-in with scale effect
- Hover: Subtle lift and color transitions
- 3D Scene: Continuous rotation and floating

## 🔧 Technical Notes

### Dependencies
All external dependencies loaded via CDN:
- Three.js r128 (3D rendering)
- OrbitControls (camera control)
- FBXLoader (model loading)
- Google Fonts (Ma Shan Zheng, DM Sans, Cormorant Garamond)

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript features
- CSS Grid and Flexbox
- CSS Custom Properties (CSS Variables)

### Performance Optimizations
- Reduced particle count (300 vs 500)
- Optimized animation frame rates
- Lazy video loading in modals
- Efficient event listeners

## 🎨 Color Reference

```css
--cinnabar-red: #C73E1D;      /* Primary accent, CTAs */
--deep-vermillion: #8B2500;   /* Secondary accent, headings */
--warm-cream: #F4EDE4;         /* Background gradient start */
--bamboo-beige: #DDD5C7;       /* Borders, subtle accents */
--charcoal: #1A1A1A;          /* Primary text */
--soft-gold: #D4AF37;         /* Highlights, special elements */
--muted-gold: #B8934A;        /* Secondary gold */
--rice-white: #FAF8F3;        /* Cards, panels, contrast bg */
```

## 📱 Responsive Breakpoints

- **Desktop**: > 1024px - Full side-by-side layouts
- **Tablet**: 768px - 1024px - Adjusted spacing, column stacking
- **Mobile**: < 768px - Single column, optimized touch targets

## ✨ What's Different from v3

1. **Modern Typography**: Custom font pairing vs generic system fonts
2. **Modal System**: Integrated dish details vs separate pages
3. **No Food Directory**: Direct model interaction vs intermediate listing
4. **Refined Colors**: Warm heritage palette vs previous color scheme
5. **Enhanced Animations**: Staggered, purposeful vs basic transitions
6. **Consistent Spacing**: Design token system vs ad-hoc spacing
7. **Better Hierarchy**: Clear visual hierarchy vs flat design

## 🚀 Future Enhancements (Optional)

- Add dish filtering/search in modal
- Implement smooth scroll transitions
- Add loading progress indicators
- Consider WebGL optimizations for lower-end devices
- Multi-language toggle for interface text

## 📝 Notes for Deployment

1. Ensure all asset paths are correct (models, images, videos)
2. Test on multiple devices and browsers
3. Optimize images and videos for web delivery
4. Consider CDN for static assets
5. Test with slow network conditions

---

**Version**: 4.0
**Created**: 2026-01-31
**Design**: Contemporary Heritage Fusion Aesthetic
**Framework**: Vanilla HTML/CSS/JS with Three.js
