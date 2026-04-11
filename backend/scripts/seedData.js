import db from "../models/index.js";
import { Op } from "sequelize";

/**
 * Massive Seiding Script for Zapify Ecommerce
 * Targets: 100 Detailed Products, 8 Categories, 15+ Brands
 */

const SELLER_ID = "037cc1f4-c739-42c5-bd60-8fde180cf70d"; // Alpine Electronics

const categories = [
  { name: "Laptops" },
  { name: "Tablets" },
  { name: "Smart Watches" },
  { name: "Headphones & Audio" },
  { name: "Cameras" },
  { name: "Gaming Consoles" },
  { name: "Computer Accessories" },
];

const brands = [
  { name: "Samsung" },
  { name: "Sony" },
  { name: "Dell" },
  { name: "HP" },
  { name: "Lenovo" },
  { name: "Asus" },
  { name: "Acer" },
  { name: "Razer" },
  { name: "Logitech" },
  { name: "Bose" },
  { name: "Sennheiser" },
  { name: "Canon" },
  { name: "Nikon" },
  { name: "Nintendo" },
  { name: "Microsoft" },
  { name: "Google" },
  { name: "OnePlus" },
  { name: "Garmin" },
];

const productData = [
  // --- LAPTOPS (15) ---
  {
    name: "MacBook Pro 14 (M4 Pro)",
    brand: "Apple",
    category: "Laptops",
    model: "A2992 - 2024",
    price: 199900,
    description: "The most advanced MacBook Pro ever. Featuring the M4 Pro chip for staggering performance and amazing battery life.",
    specs: { "CPU": "M4 Pro 12-core", "RAM": "16GB Unified", "Storage": "512GB SSD", "Display": "14-inch Liquid Retina XDR" }
  },
  {
    name: "Dell XPS 13 OLED",
    brand: "Dell",
    category: "Laptops",
    model: "XPS 9340",
    price: 139999,
    description: "The world's first laptop with a bezel-less InfinityEdge display. Stunning OLED visuals in an ultra-portable design.",
    specs: { "CPU": "Intel Core Ultra 7", "RAM": "32GB LPDDR5x", "Storage": "1TB SSD", "Display": "13.4-inch 3K OLED Touch" }
  },
  {
    name: "HP Spectre x360 14",
    brand: "HP",
    category: "Laptops",
    model: "14-eu0000",
    price: 145000,
    description: "Premium 2-in-1 laptop with a high-resolution touch display and AI-enhanced features for crystal clear video calls.",
    specs: { "CPU": "Intel Core Ultra 5", "RAM": "16GB", "Storage": "512GB SSD", "Display": "14-inch 2.8K OLED 120Hz" }
  },
  {
    name: "MacBook Air 13 (M3)",
    brand: "Apple",
    category: "Laptops",
    model: "A3113",
    price: 114900,
    description: "Strikingly thin and fast, so you can work, play, or create anywhere. The M3 chip brings even greater capabilities.",
    specs: { "CPU": "Apple M3 8-core", "RAM": "8GB", "Storage": "256GB SSD", "Display": "13.6-inch Liquid Retina" }
  },
  {
    name: "ASUS ROG Zephyrus G16",
    brand: "Asus",
    category: "Laptops",
    model: "GU605",
    price: 189990,
    description: "Powerful gaming performance in a sleek, professional chassis. Featuring an OLED display and NVIDIA RTX 40 Series graphics.",
    specs: { "CPU": "Intel Core Ultra 9", "GPU": "RTX 4070 8GB", "RAM": "32GB", "Display": "16-inch 2.5K OLED 240Hz" }
  },
  {
    name: "Lenovo ThinkPad X1 Carbon Gen 12",
    brand: "Lenovo",
    category: "Laptops",
    model: "21KC",
    price: 155000,
    description: "The legendary business laptop. Durable, powerful, and incredibly light, now with AI optimizations.",
    specs: { "CPU": "Intel Core Ultra 7", "RAM": "16GB", "Storage": "1TB SSD", "Display": "14-inch WUXGA IPS" }
  },
  {
    name: "Razer Blade 14 (2024)",
    brand: "Razer",
    category: "Laptops",
    model: "RZ09-0508",
    price: 219900,
    description: "The ultimate 14-inch gaming laptop. Packs a punch with Ryzen 9 and incredible portability.",
    specs: { "CPU": "AMD Ryzen 9 8945HS", "GPU": "RTX 4070", "RAM": "32GB", "Display": "14-inch QHD+ 240Hz" }
  },
  {
    name: "Microsoft Surface Laptop 7",
    brand: "Microsoft",
    category: "Laptops",
    model: "Surface Laptop 7",
    price: 109900,
    description: "The next generation of Surface. Powered by Snapdragon X Elite for incredible AI speeds and multi-day battery life.",
    specs: { "CPU": "Snapdragon X Elite", "RAM": "16GB", "Storage": "512GB SSD", "Display": "13.8-inch PixelSense" }
  },
  {
    name: "Acer Swift Go 14",
    brand: "Acer",
    category: "Laptops",
    model: "SFG14-72",
    price: 79990,
    description: "Value-packed ultraportable with a brilliant OLED screen and the latest Intel Core Ultra processors.",
    specs: { "CPU": "Intel Core Ultra 5", "RAM": "16GB", "Storage": "512GB SSD", "Display": "14-inch 2.8K OLED" }
  },
  {
    name: "HP Envy x360 15",
    brand: "HP",
    category: "Laptops",
    model: "15-fe0000",
    price: 85000,
    description: "Versatile 2-in-1 design for creators on the go. Optimized for pen input and touch interactions.",
    specs: { "CPU": "AMD Ryzen 7 7730U", "RAM": "16GB", "Storage": "512GB SSD", "Display": "15.6-inch FHD Touch" }
  },
  {
    name: "Lenovo Legion Slim 5",
    brand: "Lenovo",
    category: "Laptops",
    model: "Gen 9",
    price: 115000,
    description: "Balance work and play. A slim gaming powerhouse that doesn't scream 'gamer' in the office.",
    specs: { "CPU": "AMD Ryzen 7 8845HS", "GPU": "RTX 4060", "RAM": "16GB", "Display": "16-inch WQXGA 165Hz" }
  },
  {
    name: "Apple MacBook Pro 16 (M4 Max)",
    brand: "Apple",
    category: "Laptops",
    model: "A2991",
    price: 349900,
    description: "The ultimate creative workstation. M4 Max chip delivers peak performance for professional-grade workflows.",
    specs: { "CPU": "M4 Max 16-core", "RAM": "48GB Unified", "Storage": "1TB SSD", "Display": "16.2-inch Liquid Retina XDR" }
  },
  {
    name: "Dell Inspiron 16 Plus",
    brand: "Dell",
    category: "Laptops",
    model: "7630",
    price: 98000,
    description: "Larger 16-inch display with 2.5K resolution, perfect for multi-tasking and productivity.",
    specs: { "CPU": "Intel Core i7-13620H", "RAM": "16GB", "Storage": "1TB SSD", "Display": "16-inch 2.5K 120Hz" }
  },
  {
    name: "ASUS Zenbook S 13 OLED",
    brand: "Asus",
    category: "Laptops",
    model: "UM5302",
    price: 105000,
    description: "The world's slimmest 13.3-inch OLED laptop. Weighs only 1kg and made from eco-friendly materials.",
    specs: { "CPU": "Ryzen 7 7840U", "RAM": "16GB", "Storage": "1TB SSD", "Display": "13.3-inch 2.8K OLED" }
  },
  {
    name: "Samsung Galaxy Book4 Pro",
    brand: "Samsung",
    category: "Laptops",
    model: "NP960XGK",
    price: 145000,
    description: "The standard for high-end Windows laptops with a stunning Dynamic AMOLED 2X touch screen.",
    specs: { "CPU": "Intel Core Ultra 7", "RAM": "16GB", "Storage": "512GB SSD", "Display": "16-inch 3K AMOLED" }
  },

  // --- TABLETS (10) ---
  {
    name: "iPad Pro 13 (M4)",
    brand: "Apple",
    category: "Tablets",
    model: "Wi-Fi + Cellular",
    price: 129900,
    description: "The thinnest Apple product ever. Powered by the M4 chip with an ultra-advanced Tandem OLED display.",
    specs: { "CPU": "Apple M4", "Storage": "256GB", "Display": "13-inch Ultra Retina XDR", "Connectivity": "5G Compatible" }
  },
  {
    name: "Samsung Galaxy Tab S10 Ultra",
    brand: "Samsung",
    category: "Tablets",
    model: "SM-X920",
    price: 119999,
    description: "The ultimate Android tablet with a massive 14.6-inch screen and AI-powered productivity tools.",
    specs: { "CPU": "Dimensity 9300+", "RAM": "12GB", "Display": "14.6-inch Dynamic AMOLED 2X", "S-Pen": "Included" }
  },
  {
    name: "iPad Air 13 (M2)",
    brand: "Apple",
    category: "Tablets",
    model: "6th Gen",
    price: 79900,
    description: "Incredible performance with the M2 chip. Now available in two sizes for the first time.",
    specs: { "CPU": "Apple M2", "RAM": "8GB", "Storage": "128GB", "Display": "13-inch Liquid Retina" }
  },
  {
    name: "Samsung Galaxy Tab S9 FE",
    brand: "Samsung",
    category: "Tablets",
    model: "Fan Edition",
    price: 36999,
    description: "Flagship-style features at a more accessible price point. Water and dust resistant (IP68).",
    specs: { "CPU": "Exynos 1380", "RAM": "6GB", "Display": "10.9-inch 90Hz LCD", "Battery": "8000 mAh" }
  },
  {
    name: "iPad (10th Gen)",
    brand: "Apple",
    category: "Tablets",
    model: "Wi-Fi",
    price: 34900,
    description: "The versatile iPad for everything you do. Redesigned with a 10.9-inch Liquid Retina display and USB-C.",
    specs: { "CPU": "A14 Bionic", "Storage": "64GB", "Display": "10.9-inch LED IPS", "Port": "USB-C" }
  },
  {
    name: "OnePlus Pad 2",
    brand: "OnePlus",
    category: "Tablets",
    model: "OPD2304",
    price: 44999,
    description: "Powerful performance with a high refresh rate display and seamless integration with OnePlus phones.",
    specs: { "CPU": "Snapdragon 8 Gen 3", "RAM": "12GB", "Display": "12.1-inch 144Hz 3K", "Charging": "67W SUPERVOOC" }
  },
  {
    name: "Microsoft Surface Pro 11",
    brand: "Microsoft",
    category: "Tablets",
    model: "Surface Pro 11",
    price: 115000,
    description: "The most powerful 2-in-1 tablet. Powered by Snapdragon X and designed for Windows AI features.",
    specs: { "CPU": "Snapdragon X Elite", "RAM": "16GB", "Storage": "256GB SSD", "Display": "13-inch OLED 120Hz" }
  },
  {
    name: "Lenovo Tab P12",
    brand: "Lenovo",
    category: "Tablets",
    model: "ZACH",
    price: 26999,
    description: "Stream your favorite shows on a spacious 12.7-inch 3K screen with immersive JBL quad speakers.",
    specs: { "CPU": "MediaTek Dimensity 7050", "RAM": "8GB", "Display": "12.7-inch 3K LTPS", "Speakers": "Quad JBL Atmos" }
  },
  {
    name: "Xiaomi Pad 6",
    brand: "Samsung", // Closest brand in current list
    category: "Tablets",
    model: "Graphite",
    price: 25999,
    description: "A productivity powerhouse with a premium metal unibody design and a super-smooth 144Hz display.",
    specs: { "CPU": "Snapdragon 870", "RAM": "6GB", "Display": "11-inch WQHD+ 144Hz", "Body": "Aluminum Alloy" }
  },
  {
    name: "Google Pixel Tablet",
    brand: "Google",
    category: "Tablets",
    model: "With Charging Speaker Dock",
    price: 59900,
    description: "The tablet that's also the heart of your smart home. Docks for charging and better sound.",
    specs: { "CPU": "Google Tensor G2", "RAM": "8GB", "Storage": "128GB", "LCD": "11-inch 2560x1600" }
  },

  // --- SMART WATCHES (10) ---
  {
    name: "Apple Watch Ultra 2",
    brand: "Apple",
    category: "Smart Watches",
    model: "49mm Titanium",
    price: 89900,
    description: "The ultimate sports and adventure watch. Incredible battery life, rugged design, and bright display.",
    specs: { "Case": "Aerospace Titanium", "Display": "3000 nits OLED", "Battery": "Up to 36 hours", "GPS": "Dual-frequency" }
  },
  {
    name: "Apple Watch Series 10",
    brand: "Apple",
    category: "Smart Watches",
    model: "Aluminum Case",
    price: 46900,
    description: "A total overhaul of the world's most popular watch. Thinner design with a larger, more advanced display.",
    specs: { "Sensor": "ECG, Blood Oxygen", "Charging": "Faster charging", "Display": "Always-on Retina", "Processor": "S10 SiP" }
  },
  {
    name: "Samsung Galaxy Watch 7",
    brand: "Samsung",
    category: "Smart Watches",
    model: "44mm BT",
    price: 32999,
    description: "Advanced health tracking with BioActive Sensor and AI wellness insights.",
    specs: { "Chip": "Exynos W1000 (3nm)", "Os": "Wear OS 5", "Health": "Sleep Apnea detection", "Durability": "Sapphire Crystal" }
  },
  {
    name: "Google Pixel Watch 3",
    brand: "Google",
    category: "Smart Watches",
    model: "45mm Matte Black",
    price: 39999,
    description: "The first Pixel Watch in two sizes. Deeply integrated with Fitbit and Google AI services.",
    specs: { "Display": "Actua AMOLED 2000 nits", "Tracking": "Loss of Pulse detection", "Battery": "24 hours (Always-on)", "Connectivity": "LTE Ready" }
  },
  {
    name: "Garmin epix Gen 2",
    brand: "Garmin",
    category: "Smart Watches",
    model: "Sapphire Edition",
    price: 95000,
    description: "Premium active smartwatch with a stunning AMOLED display and up to 16 days of battery life.",
    specs: { "Display": "1.3-inch AMOLED", "GPS": "Multi-band GNSS", "Maps": "TopoActive preloaded", "Lens": "Sapphire Crystal" }
  },
  {
    name: "Samsung Galaxy Watch Ultra",
    brand: "Samsung",
    category: "Smart Watches",
    model: "Titanium Silver",
    price: 59999,
    description: "Built for extreme conditions. Titanium grade casing and 10ATM water resistance.",
    specs: { "Material": "Grade 4 Titanium", "Water": "100m (10ATM)", "Battery": "100 hours in power save", "Health": "Advanced Glycation Index" }
  },
  {
    name: "Apple Watch SE (2nd Gen)",
    brand: "Apple",
    category: "Smart Watches",
    model: "40mm Midnight",
    price: 29900,
    description: "All the essentials to help you stay motivated, active, and connected. Great value for iPhone users.",
    specs: { "Processor": "S8 SiP", "Features": "Crash Detection", "Heart": "High/Low Notifications", "Swimproof": "Yes" }
  },
  {
    name: "Garmin Venu 3",
    brand: "Garmin",
    category: "Smart Watches",
    model: "Whitestone",
    price: 49990,
    description: "Know the real you with advanced health and fitness features. Includes a built-in speaker and microphone.",
    specs: { "Health": "Sleep Coach & Nap detection", "Battery": "Up to 14 days", "Screen": "AMOLED Touchscreen", "Payments": "Garmin Pay" }
  },
  {
    name: "OnePlus Watch 2",
    brand: "OnePlus",
    category: "Smart Watches",
    model: "Black Steel",
    price: 24999,
    description: "Dual-engine architecture for 100-hour battery life with full Wear OS apps and health tracking.",
    specs: { "Architecture": "Snapdragon W5 + BES2700", "Battery": "100 hours (Smart Mode)", "Precision": "Dual-frequency GPS", "Build": "Stainless Steel + Sapphire" }
  },
  {
    name: "Garmin Instinct 2",
    brand: "Garmin",
    category: "Smart Watches",
    model: "Solar - Graphite",
    price: 36000,
    description: "Rugged GPS watch with solar charging that gives you infinite battery life in certain conditions.",
    specs: { "Standards": "Thermal/Shock/Water", "Battery": "Unlimited (Solar)", "Activity": "Multi-sport tracking", "Notifications": "Smart Apps" }
  },

  // --- HEADPHONES & AUDIO (15) ---
  {
    name: "Sony WH-1000XM5",
    brand: "Sony",
    category: "Headphones & Audio",
    model: "WH-1000XM5 Black",
    price: 29990,
    description: "The best noise cancelling headphones on the market. Exceptional sound and crystal clear calls.",
    specs: { "ANC": "Industry-leading", "Battery": "30 hours", "Multipoint": "Yes", "Voice": "Built-in Alexa/Assistant" }
  },
  {
    name: "Bose QuietComfort Ultra",
    brand: "Bose",
    category: "Headphones & Audio",
    model: "Sandstone",
    price: 35900,
    description: "World-class noise cancelling and spatial audio for an immersive listening experience.",
    specs: { "Audio": "Immersive Spatial", "Modes": "Quiet, Aware, Immersion", "Comfort": "Proprietary Ear Cushions", "Battery": "24 hours" }
  },
  {
    name: "Apple AirPods Pro (2nd Gen)",
    brand: "Apple",
    category: "Headphones & Audio",
    model: "USB-C MagSafe",
    price: 24900,
    description: "Magical audio experience on Apple devices. 2x more Active Noise Cancellation than before.",
    specs: { "Chip": "Apple H2", "Spatial": "Personalized with Head Tracking", "Transparency": "Adaptive Mode", "Port": "USB-C" }
  },
  {
    name: "Sennheiser Momentum 4",
    brand: "Sennheiser",
    category: "Headphones & Audio",
    model: "Wireless Denim",
    price: 29990,
    description: "Superior sound quality with an incredible 60-hour battery life. Designed for audiophiles.",
    specs: { "Battery": "60 hours", "Audio": "AptX Adaptive", "EQ": "Customizable via App", "Design": "Premium Textile Finish" }
  },
  {
    name: "Sony WF-1000XM5",
    brand: "Sony",
    category: "Headphones & Audio",
    model: "Silver TWS",
    price: 21990,
    description: "Remarkable noise cancelling Earbuds. Smaller, lighter, and better sound than the predecessor.",
    specs: { "Audio": "LDAC Hi-Res", "ANC": "Integrated Processor V2", "Weight": "25% smaller than XM4", "Charging": "Wireless (Qi)" }
  },
  {
    name: "Apple AirPods Max",
    brand: "Apple",
    category: "Headphones & Audio",
    model: "Sky Blue",
    price: 59900,
    description: "Over-ear headphones reimagined. High-fidelity audio with industry-leading Active Noise Cancellation.",
    specs: { "Audio": "Custom Driver", "Chip": "Dual H1 Chips", "Build": "Knit Mesh & Aluminum", "Feature": "Spatial Audio" }
  },
  {
    name: "Bose Ultra Open Earbuds",
    brand: "Bose",
    category: "Headphones & Audio",
    model: "Black Pearl",
    price: 25900,
    description: "A breakthrough in audio design. Hear your world while enjoying private, high-quality audio.",
    specs: { "Design": "Open-ear Clip", "Audio": "Bose Immersive Audio", "Battery": "7.5 hours playback", "Water": "IPX4" }
  },
  {
    name: "Sennheiser Accentum Plus",
    brand: "Sennheiser",
    category: "Headphones & Audio",
    model: "Accentum Plus Black",
    price: 15990,
    description: "Premium features at a great price. 50 hours of battery life and Hybrid ANC.",
    specs: { "Battery": "50 hours", "Charging": "10 min = 5 hours", "ANC": "Hybrid Adaptive", "Controls": "Touch Pad" }
  },
  {
    name: "Sony Pulse Elite",
    brand: "Sony",
    category: "Headphones & Audio",
    model: "PS5 Accessory",
    price: 12990,
    description: "Lifelike audio for gaming. Planar magnetic drivers for incredible detail and hidden mic.",
    specs: { "Drivers": "Planar Magnetic", "Mic": "AI-enhanced Retractable", "Link": "PlayStation Link Wireless", "Platform": "PS5/PC/Mac" }
  },
  {
    name: "Bose SoundLink Max",
    brand: "Bose",
    category: "Headphones & Audio",
    model: "Portable Speaker",
    price: 39900,
    description: "Powerful portable sound for the outdoors. Party-starting bass and IP67 durability.",
    specs: { "Durability": "IP67 Waterproof/Dustproof", "Battery": "20 hours", "Audio": "Stereo sound with deep bass", "Handle": "Detachable climbing rope" }
  },
  {
    name: "Sonos Ace",
    brand: "Sony", // Substituted Sony for Sonos
    category: "Headphones & Audio",
    model: "Sonos Ace White",
    price: 44900,
    description: "The most comfortable premium headphones with legendary sound and lossless audio support.",
    specs: { "Design": "Memory Foam Earcups", "Audio": "Lossless over Bluetooth", "Cinema": "Home Theater Audio Swap", "Battery": "30 hours" }
  },
  {
    name: "Logitech G733 Lightspeed",
    brand: "Logitech",
    category: "Headphones & Audio",
    model: "Lilac",
    price: 15495,
    description: "Lightweight, wireless gaming headset designed for comfort and style. Total personalization with G HUB.",
    specs: { "Range": "20 meters", "Weight": "278g", "Lighting": "Dual-zone RGB", "Mic": "Blue VO!CE Filter" }
  },
  {
    name: "Sennheiser HD 600",
    brand: "Sennheiser",
    category: "Headphones & Audio",
    model: "Open-back Wired",
    price: 29900,
    description: "The gold standard for audio professionals and audiophiles. Natural, spatial, and clear sound.",
    specs: { "Type": "Open, Dynamic", "Frequency": "12 - 40,500 Hz", "Impedance": "300 Ohms", "Cable": "Detachable OFC" }
  },
  {
    name: "Sony WH-CH720N",
    brand: "Sony",
    category: "Headphones & Audio",
    model: "Blue",
    price: 9990,
    description: "Sony's lightest wireless noise cancelling headphones. Comfortable all-day wear.",
    specs: { "Weight": "192g", "Battery": "35 hours", "Chip": "Integrated Processor V1", "Support": "Multi-point connection" }
  },
  {
    name: "OnePlus Buds Pro 3",
    brand: "OnePlus",
    category: "Headphones & Audio",
    model: "Lunar Radiance",
    price: 11999,
    description: "Co-created with Dynaudio. Master-level audio with dual-driver system and 50dB ANC.",
    specs: { "Drivers": "11mm + 6mm Dual", "ANC": "Adaptive up to 50dB", "Bluetooth": "5.4 Hi-Res", "Latancy": "94ms" }
  },

  // --- CAMERAS (10) ---
  {
    name: "Sony Alpha 7 IV",
    brand: "Sony",
    category: "Cameras",
    model: "ILCE-7M4",
    price: 218990,
    description: "The all-rounder mirrorless camera for photography and videography. 33MP sensor and advanced AF.",
    specs: { "Sensor": "33MP Full-Frame Exmor R", "Video": "4K 60p 10-bit", "Focus": "Real-time Eye AF", "ISO": "50 - 204,800" }
  },
  {
    name: "Canon EOS R6 Mark II",
    brand: "Canon",
    category: "Cameras",
    model: "EOS R6 II Body Only",
    price: 225990,
    description: "Lightning fast AF and 40fps continuous shooting. High performance hybrid camera for every project.",
    specs: { "Sensor": "24.2 MP Full-Frame", "Speed": "40fps Electronic Shutter", "AF": "Dual Pixel CMOS AF II", "Video": "4K 60p Uncropped" }
  },
  {
    name: "Nikon Z8",
    brand: "Nikon",
    category: "Cameras",
    model: "Mirrorless Workhorse",
    price: 345000,
    description: "The agility of the Z9 in a more compact body. The ultimate pro camera for video and stills.",
    specs: { "Sensor": "45.7MP Stacked CMOS", "Video": "8K 60p Internal RAW", "Shutter": "No Mechanical Shutter", "AF": "Subject Tracking" }
  },
  {
    name: "Fujifilm X-T5",
    brand: "Sony", // Substituted Sony for Fujifilm in this placeholder
    category: "Cameras",
    model: "Silver Body",
    price: 164900,
    description: "Photography-focused mirrorless camera with high resolution and the classic Fuji retro design.",
    specs: { "Sensor": "40MP APS-C", "Design": "Physical Dial Controls", "Stabilization": "7-stop IBIS", "Screen": "3-way Tilt LCD" }
  },
  {
    name: "Sony ZV-E10 II",
    brand: "Sony",
    category: "Cameras",
    model: "Vlogging Guru",
    price: 84990,
    description: "Advanced vlogging camera with interchangeable lenses. Optimized for creators.",
    specs: { "Sensor": "26MP APS-C", "Audio": "3-capsule Directional Mic", "Selfie": "Vari-angle LCD", "Video": "4K 60p 10-bit" }
  },
  {
    name: "Canon Powershot G7X Mark III",
    brand: "Canon",
    category: "Cameras",
    model: "Compact Pro",
    price: 72000,
    description: "The favorite of YouTubers. Premium compact camera that fits in your pocket.",
    specs: { "Sensor": "1-inch 20MP Stacked CMOS", "Video": "4K 30p / Vertical support", "Streaming": "YouTube Live ready", "Lens": "f/1.8 - f/2.8" }
  },
  {
    name: "Nikon Z f",
    brand: "Nikon",
    category: "Cameras",
    model: "Retro Modern",
    price: 175000,
    description: "Nikon's most powerful retro-styled camera. Full-frame performance in a body inspired by the FM2.",
    specs: { "Design": "Magnesium Alloy Retro", "Sensor": "24.5MP Full-frame", "Processor": "EXPEED 7", "Stabilization": "Pixel Shift" }
  },
  {
    name: "Sony Alpha 7R V",
    brand: "Sony",
    category: "Cameras",
    model: "High Resolution",
    price: 339900,
    description: "Unprecedented resolution and intelligent AI autofocus for the most detailed captures.",
    specs: { "Sensor": "61MP Full-Frame", "Processor": "Dual BIONZ XR + AI Unit", "AF": "Human/Animal/Insect/Vehicle", "EVF": "9.44M-dot" }
  },
  {
    name: "Canon EOS R5",
    brand: "Canon",
    category: "Cameras",
    model: "45MP Monster",
    price: 310000,
    description: "Revolutionary 8K video and incredible 45MP resolution. The total creative engine.",
    specs: { "Video": "8K 30p RAW", "Resolution": "45MP", "Stills": "20fps", "IBIS": "Up to 8 stops" }
  },
  {
    name: "Nikon Z50",
    brand: "Nikon",
    category: "Cameras",
    model: "Compact Mirrorless",
    price: 74950,
    description: "Start your mirrorless journey. A lightweight, powerful camera that's easy to use.",
    specs: { "Sensor": "20.9 MP APS-C", "Selfie": "180-degree flip under-monitor", "Connectivity": "SnapBridge Wi-Fi/Bluetooth", "Mount": "Large Z Mount" }
  },

  // --- GAMING CONSOLES (15) ---
  {
    name: "PlayStation 5 Pro",
    brand: "Sony",
    category: "Gaming Consoles",
    model: "CFI-7000",
    price: 69900,
    description: "The most powerful console ever. High-fidelity graphics, 60fps even in Ray Tracing mode.",
    specs: { "CPU": "8-core AMD Zen 2", "GPU": "PSSR Upscaling Engine", "Storage": "2TB SSD", "Compatibility": "99% of PS4/PS5 games" }
  },
  {
    name: "PlayStation 5 (Slim)",
    brand: "Sony",
    category: "Gaming Consoles",
    model: "Disc Edition",
    price: 54990,
    description: "Full PS5 power in a 30% smaller chassis. Includes a 1TB SSD and detachable disc drive.",
    specs: { "Storage": "1TB Custom SSD", "Audio": "Tempest 3D AudioTech", "Controller": "DualSense Integrated", "I/O": "Ultra-High Speed" }
  },
  {
    name: "Xbox Series X",
    brand: "Microsoft",
    category: "Gaming Consoles",
    model: "Carbon Black",
    price: 54990,
    description: "The fastest, most powerful Xbox. True 4K gaming and 12TB of processing power.",
    specs: { "CPU": "Custom Zen 2", "GPU": "12 Teraflops", "Resolution": "4K @ 120fps", "Game Pass": "Optimized for" }
  },
  {
    name: "Nintendo Switch OLED Model",
    brand: "Nintendo",
    category: "Gaming Consoles",
    model: "Mario Red Edition",
    price: 32000,
    description: "Vivid 7-inch OLED screen, enhanced speakers, and a wide adjustable stand for handheld play.",
    specs: { "Display": "7-inch OLED", "Battery": "Up to 9 hours", "Modes": "Handheld, Tabletop, TV", "Storage": "64GB Internal" }
  },
  {
    name: "Steam Deck OLED",
    brand: "Asus", // Substituted Asus for Valve
    category: "Gaming Consoles",
    model: "512GB Version",
    price: 54900,
    description: "The world's premier handheld gaming PC with a stunning HDR OLED display and longer battery.",
    specs: { "Display": "7.4-inch 90Hz HDR OLED", "Battery": "30-50% longer than LCD", "Storage": "512GB NVMe SSD", "System": "SteamOS 3.0" }
  },
  {
    name: "ASUS ROG Ally X",
    brand: "Asus",
    category: "Gaming Consoles",
    model: "RC72LA",
    price: 69990,
    description: "The king of Windows handhelds. Better battery, better ergonomics, and massive storage.",
    specs: { "CPU": "AMD Ryzen Z1 Extreme", "RAM": "24GB LPDDR5X", "Battery": "80Wh", "Screen": "7-inch 120Hz 1080p" }
  },
  {
    name: "Xbox Series S",
    brand: "Microsoft",
    category: "Gaming Consoles",
    model: "512GB White",
    price: 32990,
    description: "All-digital next-gen performance. The best value in gaming.",
    specs: { "Resolution": "1440p up to 120fps", "Drive": "All-Digital (No Disc)", "Size": "Smallest Xbox ever", "Audio": "Spatial Sound" }
  },
  {
    name: "Nintendo Switch Lite",
    brand: "Nintendo",
    category: "Gaming Consoles",
    model: "Turquoise",
    price: 18500,
    description: "Dedicated to handheld play. Lightweight, portable, and compatible with all Switch games.",
    specs: { "Design": "Integrated Controls", "Screen": "5.5-inch Touchscreen", "Portability": "Fits in large pockets", "Wireless": "Local/Online Play" }
  },
  {
    name: "Xbox Elite Wireless Controller Series 2",
    brand: "Microsoft",
    category: "Gaming Consoles",
    model: "Core Black",
    price: 15990,
    description: "Play like a pro with the world's most advanced controller. Unlimited customization.",
    specs: { "Sticks": "Adjustable-Tension", "Locks": "Shorter Hair Trigger", "Battery": "40 hour rechargeable", "Profiles": "3 Custom Slots" }
  },
  {
    name: "Sony DualSense Edge",
    brand: "Sony",
    category: "Gaming Consoles",
    model: "Pro Controller",
    price: 18990,
    description: "Get an edge in gameplay by creating your own custom controls. Re-mappable buttons and tunable triggers.",
    specs: { "Caps": "Replaceable Stick Caps", "Modules": "Swappable Stick Modules", "Interface": "On-controller Profile Menu", "Buttons": "Back Buttons Available" }
  },
  {
    name: "Logitech G Cloud Gaming Handheld",
    brand: "Logitech",
    category: "Gaming Consoles",
    model: "Android 11",
    price: 29990,
    description: "Cloud gaming optimized. Xbox Cloud Gaming and NVIDIA GeForce NOW integrated.",
    specs: { "Display": "7-inch 1080p 60Hz", "Runtime": "12+ hour battery", "Apps": "Play Store support", "Controls": "Precision Console-grade" }
  },
  {
    name: "Xbox Series X - 1TB Storage Expansion",
    brand: "Microsoft",
    category: "Gaming Consoles",
    model: "Seagate Card",
    price: 14000,
    description: "Expand your storage without sacrificing performance. Matches the internal SSD speed.",
    specs: { "Capacity": "1TB", "Speed": "Xbox Velocity Architecture", "Plug": "Quick Resume compatible", "Design": "Compact Card" }
  },
  {
    name: "Nintendo Switch Pro Controller",
    brand: "Nintendo",
    category: "Gaming Consoles",
    model: "Switch Pro Controller Black",
    price: 5990,
    description: "The premium controller for the Switch. Traditional design for a better TV-mode experience.",
    specs: { "Features": "Motion Controls, HD Rumble", "NFC": "Built-in for amiibo", "Charging": "USB-C", "Battery": "Long-lasting" }
  },
  {
    name: "PlayStation Portal Remote Player",
    brand: "Sony",
    category: "Gaming Consoles",
    model: "Wi-Fi Only",
    price: 19990,
    description: "Play your PS5 over your home Wi-Fi with console-quality controls. Includes DualSense features.",
    specs: { "Screen": "8-inch LCD 1080p", "Feedback": "Haptic and Adaptive Triggers", "Speaker": "Built-in", "Jack": "3.5mm Audio" }
  },
  {
    name: "Razer Kishi Ultra",
    brand: "Razer",
    category: "Gaming Consoles",
    model: "Gaming Controller for Phone",
    price: 14999,
    description: "The ultimate mobile gaming controller. Fits iPhones and Android phones for console-feel.",
    specs: { "Connection": "USB-C Ultra-low Latency", "Buttons": "Mecha-tactile", "Ergonomics": "Full-sized console reach", "Audio": "3.5mm Pass-through" }
  },

  // --- COMPUTER ACCESSORIES (15) ---
  {
    name: "Logitech MX Master 3S",
    brand: "Logitech",
    category: "Computer Accessories",
    model: "Pale Grey",
    price: 10995,
    description: "An icon, remastered. Quiet Clicks and 8K DPI tracking for more feel and performance.",
    specs: { "Sensor": "8,000 DPI Darkfield", "Scroller": "MagSpeed Electromagnetic", "Compatibility": "Logi Bolt / Bluetooth", "Battery": "70 days" }
  },
  {
    name: "Razer BlackWidow V4 Pro",
    brand: "Razer",
    category: "Computer Accessories",
    model: "Green Switch",
    price: 22999,
    description: "Full-blown battlestation immersion. Featuring the Razer Command Dial and 8 dedicated macro keys.",
    specs: { "Switches": "Mechanical Clicky", "Lighting": "Razer Chroma Underglow", "Dial": "Multi-function Dial", "Rest": "Plush Leatherette" }
  },
  {
    name: "ASUS ROG Swift PG279QM",
    brand: "Asus",
    category: "Computer Accessories",
    model: "27-inch Monitor",
    price: 65000,
    description: "Professional gaming monitor with 240Hz refresh rate and G-SYNC processor.",
    specs: { "Panel": "Fast IPS 1440p", "Refresh": "240Hz", "G-Sync": "NVIDIA Processor Integrated", "HDR": "HDR400" }
  },
  {
    name: "Samsung Odyssey G9 OLED",
    brand: "Samsung",
    category: "Computer Accessories",
    model: "49-inch Curved",
    price: 145000,
    description: "The pinnacle of gaming displays. Ultra-wide 49-inch screen with 240Hz OLED performance.",
    specs: { "Ratio": "32:9 Super Ultra-Wide", "Panel": "OLED / Neo Quantum Processor", "Response": "0.03ms GtG", "Curvature": "1800R" }
  },
  {
    name: "Dell UltraSharp 27 4K",
    brand: "Dell",
    category: "Computer Accessories",
    model: "U2723QE",
    price: 59000,
    description: "The world's first 27-inch 4K monitor with IPS Black technology for twice the contrast.",
    specs: { "Panel": "IPS Black 4K", "Ports": "USB-C Hub (90W PD)", "Color": "98% DCI-P3", "Daisy-chain": "Supported" }
  },
  {
    name: "Logitech MX Mechanical",
    brand: "Logitech",
    category: "Computer Accessories",
    model: "Tactile Quiet",
    price: 17495,
    description: "Mechanical typing with a low profile. Whisper quiet switches and smart illumination.",
    specs: { "Type": "Full-size Low Profile", "Switches": "Tactile Quiet Mechanical", "Smart": "Backlighting Prox-sensor", "Devices": "Pair up to 3" }
  },
  {
    name: "HP Thunderbolt Dock G4",
    brand: "HP",
    category: "Computer Accessories",
    model: "280W Edition",
    price: 24000,
    description: "The most powerful docking station for pro laptops. Connect everything with one cable.",
    specs: { "Power": "280W Total (Up to 230W to Laptop)", "Displays": "Supports 4 monitors", "Ports": "Thunderbolt 4, HDMI, DP, RJ45", "Security": "Intel vPro compatible" }
  },
  {
    name: "Lenovo Go Wireless Vertical Mouse",
    brand: "Lenovo",
    category: "Computer Accessories",
    model: "Ergo Series",
    price: 4500,
    description: "Natural 45-degree handshake position that reduces wrist strain and forearm muscle fatigue.",
    specs: { "Ergo": "45-degree Angle", "Sensor": "Optical 2400 DPI", "Material": "Cork Palm Rest", "Programmable": "6 Buttons" }
  },
  {
    name: "Logitech StreamCam",
    brand: "Logitech",
    category: "Computer Accessories",
    model: "USB-C Graphite",
    price: 12900,
    description: "Built for streamers. Full HD 1080p at 60fps for a smooth and natural video experience.",
    specs: { "Video": "1080p @ 60fps", "Focus": "Smart Auto-focus", "Mount": "Versatile Clamp/Tripod", "Orientation": "Horizontal or Vertical" }
  },
  {
    name: "ASUS ProArt Display PA329C",
    brand: "Asus",
    category: "Computer Accessories",
    model: "32-inch 4K HDR",
    price: 95000,
    description: "Designed for content creators. Factory pre-calibrated for industry-leading color accuracy.",
    specs: { "Color": "100% Adobe RGB", "HDR": "VESA DisplayHDR 600", "Accuracy": "Delta E < 2", "Software": "ProArt Preset" }
  },
  {
    name: "Dell Premier Multi-Device Wireless Keyboard and Mouse",
    brand: "Dell",
    category: "Computer Accessories",
    model: "KM7321W",
    price: 8900,
    description: "Sleek and versatile desktop set. Multi-task seamlessly across 3 devices.",
    specs: { "Mode": "RF 2.4GHz & Bluetooth 5.0", "Battery": "Up to 36 months", "DPI": "Up to 4000", "Custom": "Dell Peripheral Manager" }
  },
  {
    name: "Logitech C922 Pro Stream",
    brand: "Logitech",
    category: "Computer Accessories",
    model: "Full HD",
    price: 9495,
    description: "The classic streaming webcam. Clear audio and smooth video for your home setup.",
    specs: { "Lens": "Glass with Autofocus", "FOV": "78 degrees", "Audio": "Dual Omnidirectional Mics", "Tripod": "Included" }
  },
  {
    name: "Razer Nommo V2",
    brand: "Razer",
    category: "Computer Accessories",
    model: "Gaming Speakers",
    price: 24900,
    description: "Full-range 2.1 desktop speakers with a wired subwoofer and Razer Chroma RGB.",
    specs: { "Audio": "THX Spatial Audio", "Drivers": "3-inch Full Range", "Sub": "Down-firing Subwoofer", "Lighting": "Rear-projection RGB" }
  },
  {
    name: "Microsoft Modern USB-C Speaker",
    brand: "Microsoft",
    category: "Computer Accessories",
    model: "Teams Certified",
    price: 8500,
    description: "High-quality office audio for your workspace. Dedicated Teams button for easy meeting entry.",
    specs: { "Mic": "Omnidirectional with Noise-reduction", "Input": "Plug-and-play USB-C", "Buttons": "Teams, Mute, Volume", "Cable": "Storable cord" }
  },
  {
    name: "Apple Magic Keyboard with Touch ID",
    brand: "Apple",
    category: "Computer Accessories",
    model: "White - US English",
    price: 14500,
    description: "Ultra-compact and incredibly comfortable typing. Includes Touch ID for fast authentication.",
    specs: { "Security": "Touch ID", "Battery": "Rechargeable (1 month+)", "Pairing": "Automatic with Mac", "Layout": "Compact (No Num-pad)" }
  },

  // --- MOBILES (10) ---
  {
    name: "iPhone 16 Pro Max",
    brand: "Apple",
    category: "Mobiles",
    model: "256GB Desert Titanium",
    price: 159900,
    description: "The ultimate iPhone. Featuring the A18 Pro chip, Camera Control, and the best battery life on iPhone.",
    specs: { "Display": "6.9-inch Super Retina XDR", "CPU": "A18 Pro", "Camera": "48MP Fusion / 5x Telephoto", "Body": "Grade 5 Titanium" }
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    brand: "Samsung",
    category: "Mobiles",
    model: "512GB Titanium Black",
    price: 129999,
    description: "Unleash new levels of creativity and productivity with Galaxy AI. 200MP camera and built-in S Pen.",
    specs: { "CPU": "Snapdragon 8 Gen 3 for Galaxy", "Camera": "200MP + 50MP + 12MP + 10MP", "S-Pen": "Integrated", "AI": "Circle to Search, Live Translate" }
  },
  {
    name: "Google Pixel 9 Pro XL",
    brand: "Google",
    category: "Mobiles",
    model: "128GB Porcelain",
    price: 124900,
    description: "The best of Google AI in a large, pro-level phone. Advanced triple camera and Super Actua display.",
    specs: { "CPU": "Google Tensor G4", "Camera": "50MP Wide / 48MP Tele / 48MP Ultra", "AI": "Gemini Nano, Magic Editor", "OS": "7 Years of Updates" }
  },
  {
    name: "OnePlus 12",
    brand: "OnePlus",
    category: "Mobiles",
    model: "16GB RAM / 512GB",
    price: 64999,
    description: "Elite performance with the Snapdragon 8 Gen 3 and the 4th Gen Hasselblad Camera for Mobile.",
    specs: { "Charging": "100W Wired / 50W Wireless", "Display": "2K 120Hz ProXDR", "Battery": "5400 mAh", "Heat": "Dual Cryo-velocity VC" }
  },
  {
    name: "iPhone 16 Plus",
    brand: "Apple",
    category: "Mobiles",
    model: "128GB Ultramarine",
    price: 89900,
    description: "Brilliant color, big screen, and the new A18 chip. Camera Control at your fingertips.",
    specs: { "Display": "6.7-inch Super Retina XDR", "CPU": "A18", "Button": "Action Button + Camera Control", "Body": "Aerospace-grade Aluminum" }
  },
  {
    name: "Samsung Galaxy Z Fold 6",
    brand: "Samsung",
    category: "Mobiles",
    model: "Silver Shadow",
    price: 164999,
    description: "The thinnest, lightest Fold ever. Now with powerful AI features integrated into the massive inner screen.",
    specs: { "Inner": "7.6-inch Dynamic AMOLED", "Outer": "6.3-inch AMOLED", "Hinge": "Dual Rail Structure", "Stability": "Armor Aluminum" }
  },
  {
    name: "Google Pixel 9 Pro Fold",
    brand: "Google",
    category: "Mobiles",
    model: "Obsidian",
    price: 172900,
    description: "The thinnest foldable phone with the biggest display. Optimized for Google Gemini AI multitasking.",
    specs: { "Display": "8-inch Super Actua Flex", "Thickness": "10.5mm Folded", "AI": "Gemini Pro Multitasking", "Durability": "IPX8 Water Resistant" }
  },
  {
    name: "Samsung Galaxy S24+",
    brand: "Samsung",
    category: "Mobiles",
    model: "Cobalt Violet",
    price: 99999,
    description: "Premium features in a sleek design. QHD+ display and all-day battery with Galaxy AI.",
    specs: { "RAM": "12GB", "Display": "6.7-inch Dynamic AMOLED 120Hz", "Camera": "50MP + 12MP + 10MP", "Battery": "4900 mAh" }
  },
  {
    name: "iPhone 16",
    brand: "Apple",
    category: "Mobiles",
    model: "128GB Pink",
    price: 79900,
    description: "Fast A18 chip, vibrant new colors, and the customizable Action Button. Stunning 48MP camera.",
    specs: { "Chip": "A18", "Main": "48MP Fusion", "Selfie": "Twelve TrueDepth", "Durability": "Ceramic Shield" }
  },
  {
    name: "Google Pixel 8a",
    brand: "Google",
    category: "Mobiles",
    model: "Bay (Blue)",
    price: 52999,
    description: "The smart phone that's easy on your wallet. Powerful Google Tensor G3 performance.",
    specs: { "CPU": "Google Tensor G3", "Camera": "64MP Wide / 13MP Ultra", "Battery": "24+ Hour Extreme Saver", "Updates": "7 Years" }
  }
];

export async function seed() {
  console.log("🚀 Starting massive data seeding...");

  try {
    // 1. Load existing and Ensure new Categories exist
    const categoryMap = {};
    const existingCats = await db.Category.findAll({ attributes: ["id", "name"] });
    existingCats.forEach(c => categoryMap[c.name] = c.id);

    for (const cat of categories) {
      if (!categoryMap[cat.name]) {
        const [record] = await db.Category.findOrCreate({
          where: { name: cat.name },
          defaults: { isActive: true },
        });
        categoryMap[cat.name] = record.id;
      }
    }
    console.log("✅ Categories synced.");

    // 2. Load existing and Ensure new Brands exist
    const brandMap = {};
    const existingBrands = await db.Brand.findAll({ attributes: ["id", "name"] });
    existingBrands.forEach(b => brandMap[b.name] = b.id);

    for (const br of brands) {
      if (!brandMap[br.name]) {
        const [record] = await db.Brand.findOrCreate({
          where: { name: br.name },
          defaults: { 
            description: `${br.name} is a leading brand in the electronics and technology industry.`,
            isActive: true 
          },
        });
        brandMap[br.name] = record.id;
      }
    }
    console.log("✅ Brands synced.");

    // 3. Process Products
    let createdCount = 0;
    let skippedCount = 0;

    for (const p of productData) {
      const categoryId = categoryMap[p.category];
      const brandId = brandMap[p.brand];

      if (!categoryId || !brandId) {
        console.warn(`⚠️ Skipping product '${p.name}': Missing category (${p.category}) or brand (${p.brand}) mapping.`);
        continue;
      }

      const [product, created] = await db.Product.findOrCreate({
        where: { name: p.name },
        defaults: {
          model: p.model,
          description: p.description,
          price: p.price,
          totalOfferStock: 0,
          status: "approved",
          isActive: true,
          categoryId,
          brandId
        }
      });

      if (created) {
        // Create Offer
        await db.Offer.create({
          productId: product.id,
          sellerProfileId: SELLER_ID,
          price: p.price,
          stockQuantity: Math.floor(Math.random() * 45) + 5, // 5 to 50 stock
          condition: "New",
          status: "active"
        });

        // Create Specs
        if (p.specs) {
          const specEntries = Object.entries(p.specs).map(([key, value]) => ({
            productId: product.id,
            key,
            value: value.toString()
          }));
          await db.ProductSpec.bulkCreate(specEntries);
        }

        createdCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`✨ Seeding complete!`);
    console.log(`📈 Summary: ${createdCount} products created, ${skippedCount} items already existed.`);
    
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }
}
