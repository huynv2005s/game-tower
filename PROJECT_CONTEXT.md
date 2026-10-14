# ALIEN APOCALYPSE: 2D PIXEL ART SURVIVAL & TOWER DEFENSE
## 📘 MASTER PROJECT CONTEXT & AGENT HANDOVER DOCUMENTATION

> **Tài liệu bàn giao toàn diện:** Dành cho AI Agent hoặc Developer tiếp quản dự án trong các phiên làm việc mới. Đọc tài liệu này sẽ nắm bắt được 100% bối cảnh, kiến trúc mã nguồn, quy chuẩn nghiêm ngặt, các tính năng đã hoàn thiện từ Phase 1 đến Phase 4, và lộ trình phát triển tiếp theo.

---

## 1. TỔNG QUAN DỰ ÁN & MỤC TIÊU CỐT LÕI

* **Tên dự án:** Alien Apocalypse (Tận Thế Sinh Vật Ngoài Hành Tinh)
* **Thể loại:** 2D Top-down Pixel Art kết hợp **Sinh tồn (Survival) + Phiêu lưu khám phá (Adventure) + Thủ thành (Tower Defense) + Hỗ trợ Di động (Mobile App & PWA)**.
* **Thư mục gốc:** `c:/Go/demo/`
* **Local Web Server:** Chạy bằng Node.js thuần (`node server.js`) tại `http://localhost:3000/`.
* **Quy tắc bắt buộc của User (`user_rules`):**
  > `<RULE[user_global]> import file đường dẫn tuyệt đối </RULE[user_global]>`
  > Tất cả các đường dẫn nhúng CSS, Javascript, Manifest, Service Worker và tài nguyên phải sử dụng đường dẫn tuyệt đối (ví dụ: `/c:/Go/demo/css/style.css`, `/c:/Go/demo/js/...`). Khi tạo liên kết markdown trong báo cáo, luôn dùng định dạng `file:///c:/Go/demo/...`.
* **Công nghệ sử dụng:**
  * **Core:** HTML5 Canvas API + Vanilla JavaScript (ES6+ Classes), không phụ thuộc framework nặng.
  * **Styling:** Vanilla CSS3 với hệ thống biến màu HSL / Hex cao cấp, hiệu ứng Glassmorphism và Pixel Glow.
  * **Đồ họa:** Procedural Pixel Art Generator (`pixelart.js`) - Tự tạo toàn bộ sprite-sheet, địa hình, vũ khí, biểu tượng và quái vật bằng Canvas bộ nhớ đệm (Offscreen Canvas), không dùng placeholder.
  * **Âm thanh:** Web Audio API (`audio.js`) - Bộ tổng hợp âm thanh Synth đa tần số cho tiếng chém, va chạm, bắn súng cối, hú còi ban đêm, lướt và đập trứng.
  * **Mobile & PWA:** Cần gạt ảo Virtual Joystick, nút bấm đa điểm, chế độ xoay ngang Landscape Lock, `manifest.json`, `service-worker.js` (Offline Cache) và sẵn sàng xuất bản ra file `.apk` qua Capacitor.

---

## 2. KIẾN TRÚC THƯ MỤC & DANH SÁCH FILE NGUỒN

```
c:/Go/demo/
├── assets/
│   └── icons/
│       ├── icon-192.png       # Icon PWA 192x192
│       └── icon-512.png       # Icon PWA 512x512
├── css/
│   └── style.css              # Toàn bộ CSS giao diện HUD, Modal, Mobile Controls, Responsive
├── js/
│   ├── constants.js           # Hằng số toàn cục: Biomes, Tiles, Vật phẩm, Vũ khí, Công trình, Quái vật
│   ├── audio.js               # Web Audio API Synth tạo âm thanh không cần file audio ngoài
│   ├── pixelart.js            # Engine vẽ procedural pixel art cho mọi tiles, items, quái vật
│   ├── world.js               # Khởi tạo bản đồ 100x80 tiles (3 Biomes), va chạm vật lý, sông suối
│   ├── entities.js            # Lớp Player, 4 loài Monster, Đạn bay Projectile, Hạt Particle, Chữ nổi Combat
│   ├── weapons.js             # Logic 4 loại vũ khí (Giáo, Gậy, Dao, Cung) và 8 kỹ năng giải vây
│   ├── inventory.js           # Quản lý 12-18 ô Balo, 5 ô Trang bị Giáp, nâng cấp dung lượng
│   ├── lab.js                 # 5 Tab chế tác: Bio-Lab, Lò Nung, Bàn Chế Tạo, Xưởng Cơ Khí, Lồng Cấy
│   ├── buildings.js           # Hệ thống công trình: Tường, Bẫy gai, Tháp canh, Súng cối, Preview xây
│   ├── daynight.js            # Chu kỳ Ngày/Đêm, đợt quái tấn công tăng dần, cơ chế ấp trứng nở
│   ├── savegame.js            # Tự động lưu & Khôi phục tiến trình từ LocalStorage khi chuyển Ngày/Đêm
│   ├── mobile.js              # Virtual Joystick, Smart Auto-Aim, Action Buttons, Landscape Overlay
│   └── game.js                # Game Engine chính, vòng lặp Loop 60fps, Camera, Phím tắt, Điều phối
├── index.html                 # Giao diện chính, HUD, các Modal, khai báo PWA và Script Tags
├── manifest.json              # Cấu hình PWA Fullscreen & Landscape
├── service-worker.js          # Service Worker lưu cache offline cho di động
├── generate_icons.js          # Tool Node.js tạo icon PNG bằng built-in zlib
├── server.js                  # Server HTTP Node.js tĩnh hỗ trợ route tuyệt đối /c:/Go/demo/
├── package.json               # Cấu hình npm dự án
└── PROJECT_CONTEXT.md         # File tài liệu ngữ cảnh này
```

---

## 3. CHI TIẾT CÁC GIAI ĐOẠN ĐÃ HOÀN THÀNH

### 🏞 PHASE 1: BẢN ĐỒ 3 BIOMES, VŨ KHÍ & HỆ THỐNG CHIẾN ĐẤU CƠ BẢN
1. **3 Vùng Địa Hình (Biomes):**
   * **Núi Đá (Mountains):** Phía trên (Rows 0-25). Địa hình hiểm trở, có hồ lưu huỳnh, đá thạch anh, thảo dược Tuyết liên và các ổ trứng quái vật.
   * **Đồng Bằng (Plains):** Trung tâm (Rows 26-60). Khu vực an toàn khởi đầu, có hồ nước ngọt, sông chia cắt có cầu gỗ bắc qua, lùm cây quả dại, trạm Bio-Lab và các trạm chế tạo.
   * **Bờ Biển & Đại Dương (Beach/Ocean):** Phía dưới (Rows 61-79). Dải cát vàng, nước biển độc hại và các mảnh xác tàu vũ trụ rơi (`tech_debris`).
2. **Hệ Thống 4 Loại Vũ Khí ([weapons.js](file:///c:/Go/demo/js/weapons.js)):**
   * **Giáo (Spear):** Cận chiến sải dài (65px, 18 DMG). 
     * Kỹ năng 1 [Q] *Quét Ngang:* Vung giáo 120° gây sát thương và hất văng quái vật 130px.
     * Kỹ năng 2 [E] *Chống Sào Nhảy Vọt:* Cắm giáo bật nhảy qua đầu đám đông 180px, né tránh toàn bộ vật cản và sát thương.
   * **Gậy Chấn Động (Staff):** Khống chế diện rộng (55px, 14 DMG).
     * Kỹ năng 1 [Q] *Chấn Động:* Đập đất phát sóng xung kích làm choáng quái 1.5 giây.
     * Kỹ năng 2 [E] *Lốc Xoáy Đẩy Lùi:* Tạo lốc xoáy quanh người đẩy lùi mọi quái áp sát.
   * **Dao Găm Sinh Tồn (Dagger):** Đánh siêu nhanh (0.22s, 11 DMG, chí mạng x2.5).
     * Kỹ năng 1 [Q] *Đâm Lén Chớp Nhoáng:* Lướt xuyên qua quái vật gây 32 sát thương.
     * Kỹ năng 2 [E] *Tàng Hình Ẩn Thân:* Tàng hình 3.0s, tăng 40% tốc chạy, đi xuyên quái.
   * **Cung Bắn Tỉa (Bow):** Tầm xa cực đại (320px, 16 DMG).
     * Kỹ năng 1 [Q] *Mũi Tên Lưới Trói:* Phóng đạn lưới trói chặt mục tiêu 2.5s trong cự ly 240px.
     * Kỹ năng 2 [E] *Phát Bắn Giật Lùi:* Bắn chùm 3 viên đạn lửa đẩy lùi quái và hất người chơi lùi sau 80px.
3. **Cơ Chế Di Chuyển:**
   * Phím `W, A, S, D` hoặc Mũi tên. Phím `Space` để Lướt nhanh (Dash) có dư ảnh Ghost trail.
   * Camera mượt mà (Lerp 0.12) giới hạn trong thế giới 3200x2560px.

---

### ☣ PHASE 2: CƠ CHẾ SINH TỒN, THANH ĐỘC TỐ & PHÒNG LAB CÁCH LY
1. **Thanh Độc Tố (Toxin / Infection Meter 0-100%):**
   * Tăng khi bị quái vật cắn, dính đạn axit, hái quả dại biến dị, hoặc hít khí độc ngoài trời vào ban đêm.
   * Khi độc tố chạm mốc **100%**: Tử vong ngay lập tức do ký sinh đột biến toàn diện (`gameover-modal`).
   * Phạt theo các mốc: >30% (màn hình chớp tím, giảm 15% tốc chạy), >60% (mất máu từ từ 1 HP/giây), >85% (choáng váng định kỳ).
2. **Khu Cách Ly Vô Trùng Bio-Lab ([world.js](file:///c:/Go/demo/js/world.js), [lab.js](file:///c:/Go/demo/js/lab.js)):**
   * Nằm ở trung tâm Đồng Bằng. Có vòng hào quang năng lượng bảo vệ (`Quarantine Field`).
   * Khi người chơi đứng trong phòng Lab vào ban đêm, độc tố ngoài môi trường không thể xâm nhập.
   * Điểm hồi sinh sau khi tử vong với 15 giây miễn nhiễm sát thương.
3. **Tài Nguyên Trên Núi & Trứng Quái Vật:**
   * Bột lưu huỳnh (`sulfur_dust`), Thạch anh (`quartz_crystal`), Hoa tuyết liên (`snow_lotus`).
   * **Ổ Trứng Quái Vật (`alien_egg`):** Cần 45 sát thương để đập vỡ, rớt ra Dịch tuyến trứng (`egg_fluid`). Nếu không đập vỡ, ban đêm trứng sẽ nở thành quái vật!
4. **Bào Chế Thuốc & Lò Nung ([lab.js](file:///c:/Go/demo/js/lab.js)):**
   * **Huyết thanh sơ cấp:** Giảm 25% độc tố.
   * **Thuốc kháng thể tinh khiết:** Giảm 60% độc tố + nhận buff Miễn nhiễm độc tố trong 120 giây (tương đương 1 ngày game).
   * **Lò nung khử trùng (Furnace):** Đun nước bẩn thành nước sạch, nung bột lưu huỳnh diệt khuẩn.
   * **Lồng cấy sinh học (Hydroponics):** 3 lồng nuôi trồng cây dược liệu vô trùng không bao giờ nhiễm bệnh.
5. **Cơ chế Đột biến qua đêm:** Cây quả dại ngoài thiên nhiên bị nhiễm độc biến thành quả thối qua đêm.

---

### 🏰 PHASE 3: BÀN CHẾ TẠO, XƯỞNG THỦ THÀNH & QUÁI VẬT BAN ĐÊM
1. **Trạm Chế Tác Đặt Tại Căn Cứ:**
   * **Bàn Chế Tạo (Workbench):** Đặt cạnh Bio-Lab, gia công Tường Chắn, Giáp Dã Chiến và May Balo Nâng Cấp (+6 Ô Đồ mở rộng kho đồ từ 12 lên 18 ô).
   * **Xưởng Cơ Khí Thủ Thành (Workshop):** Đặt cạnh Lò nung, chế tạo Bẫy Gai, Tháp Canh Tự Động, Súng Cối Hạng Nặng.
2. **4 Công Trình Thủ Thành ([buildings.js](file:///c:/Go/demo/js/buildings.js)):**
   * 🧱 **Tường Chắn Bê Tông (Wall):** Máu 250 HP, chặn quái vật, điều hướng quái vào bẫy.
   * ⚙ **Bẫy Gai Sinh Học (Spike Trap):** 60 HP, gây 22 sát thương và **làm chậm 50% trong 2s** khi quái giẫm lên (độ bền 12 lần).
   * 🗼 **Tháp Canh Tự Động (Watchtower / Turret):** 160 HP, tầm bắn 175px, tự xoay 360° nã đạn plasma liên thanh (0.45s/phát, 16 DMG).
   * 💣 **Súng Cối Hạng Nặng (Heavy Mortar):** 140 HP, tầm bắn xa 80-280px, bắn pháo cầu vồng nổ diện rộng AoE 65px (55 DMG + hiệu ứng hất văng Knockback).
3. **Cơ Chế Đợt Tấn Công Ban Đêm & 4 Chủng Loài Quái ([daynight.js](file:///c:/Go/demo/js/daynight.js), [entities.js](file:///c:/Go/demo/js/entities.js)):**
   * **Công thức tăng tiến:** $\text{Số lượng quái} = (4 + \text{Ngày} \times 3) + \text{Số trứng quái chưa vỡ}$.
   * **4 Loài Quái Ngoại Lai:**
     * 🕷 **Xenomorph Crawler:** Di chuyển nhanh (75px/s), cắn xé cận chiến lây độc.
     * 💥 **Kamikaze Exploder:** Túi axit phát sáng cam đỏ, lao nhanh (110px/s) tự sát nổ tung 55px (45 DMG) phá hủy công trình.
     * 🧪 **Acid Spitter:** Giữ khoảng cách 190px, khạc đạn axit ăn mòn công trình và gây độc.
     * 🦏 **Titan Behemoth:** Siêu quái giáp dày 280 HP, càn quét nghiền nát tường chắn.
4. **Hệ Thống Quick Build:** Hàng phím nóng `[5] Tường`, `[6] Bẫy Gai`, `[7] Tháp Canh`, `[8] Súng Cối` kèm vòng tròn hiển thị tầm bắn và kiểm tra vật cản trước khi đặt.

---

### 📱 PHASE 4: MOBILE CONTROLS, AUTO-SAVE, PWA & CAPACITOR PACKAGING
1. **Điều Khiển Cảm Ứng (Mobile Touch Controls - [mobile.js](file:///c:/Go/demo/js/mobile.js)):**
   * **Cần gạt ảo (Virtual Joystick):** Góc dưới bên trái, điều khiển di chuyển 360 độ mượt mà.
   * **Phím bấm cảm ứng lớn:** Góc dưới bên phải gồm Tấn công (kèm Smart Auto-Aim khóa mục tiêu gần nhất), Lướt (Dash), Kỹ năng 1 (Q), Kỹ năng 2 (E), Đổi vũ khí, Tương tác [F], Bật danh mục xây dựng.
   * **Nút chuyển đổi trên HUD:** Nút `📱 CẢM ỨNG` trên thanh HUD cho phép bật/tắt thủ công hoặc tự nhận diện màn hình cảm ứng.
   * **Khóa thao tác trình duyệt:** `touch-action: none;` và `user-select: none;` loại bỏ hoàn toàn hiện tượng zoom hoặc kéo giật trang trên điện thoại.
2. **Xoay Màn Hình Ngang (Landscape Mode):**
   * Tự động hiển thị lớp phủ xoay màn hình (Rotate Device Overlay) kèm biểu tượng điện thoại xoay hoạt họa nếu người chơi cầm dọc máy.
3. **Hệ Thống Tự Động Lưu Game ([savegame.js](file:///c:/Go/demo/js/savegame.js)):**
   * Tự động lưu tiến trình (Số ngày, Máu, Độc tố, 18 ô Balo, Giáp, Công trình phòng thủ, Trứng quái) vào `localStorage` mỗi khi chuyển giao Ngày/Đêm.
   * Nút `💾 LƯU [K]` cho phép lưu tay bất kỳ lúc nào kèm thông báo Toast nổi.
   * Tự động khôi phục tiến trình khi tải lại trang.
4. **Tích Hợp PWA & Xuất APK:**
   * Cung cấp [manifest.json](file:///c:/Go/demo/manifest.json) và [service-worker.js](file:///c:/Go/demo/service-worker.js) chơi offline.
   * Hướng dẫn chi tiết đóng gói bằng **Capacitor** thành file `app-debug.apk`.

---

## 4. BẢNG THÔNG SỐ VŨ KHÍ, CÔNG TRÌNH & QUÁI VẬT

### 🗡 Bảng Vũ Khí
| Vũ Khí | Loại | Sát Thương | Tầm / Tốc Độ | Kỹ Năng 1 [Q] | Kỹ Năng 2 [E] |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **Giáo (Spear)** | Cận chiến | 18 | 65px (0.42s) | Quét Ngang (AoE 120°, Knockback 130px) | Chống Sào Nhảy Vọt (Vượt chướng ngại 180px) |
| **Gậy (Staff)** | Khống chế | 14 | 55px (0.55s) | Chấn Động (Sóng xung kích choáng 1.5s) | Lốc Xoáy Đẩy Lùi (Bảo vệ diện rộng) |
| **Dao Găm (Dagger)**| Sát thủ | 11 (Crit x2.5) | 42px (0.22s) | Đâm Lén Chớp Nhoáng (Lướt xuyên quái 32 DMG)| Tàng Hình Ẩn Thân (Tàng hình 3s, +40% Speed)|
| **Cung (Bow)** | Tầm xa | 16 | 320px (0.60s) | Mũi Tên Lưới Trói (Trói chân 2.5s) | Phát Bắn Giật Lùi (Bắn 3 đạn lửa + lùi 80px)|

### 🗼 Bảng Công Trình Thủ Thành
| Công Trình | Máu (HP) | Tầm Hoạt Động | Sát Thương | Công Dụng Đặc Biệt |
| :--- | :---: | :---: | :---: | :--- |
| **Tường Chắn** | 250 HP | - | - | Chặn quái vật, hướng quái vào choke-point bẫy |
| **Bẫy Gai** | 60 HP | 18px (tiếp xúc)| 22 | Làm chậm 50% trong 2s, độ bền 12 lần kích hoạt |
| **Tháp Canh** | 160 HP | 175px | 16 / viên | Tự động xoay 360° xả đạn plasma tốc độ cao (0.45s/phát) |
| **Súng Cối** | 140 HP | 80px - 280px | 55 AoE | Bắn pháo cầu vồng nổ diện rộng 65px + hất văng (Knockback) |

### 👾 Bảng Quái Vật
| Chủng Loài | HP | Tốc Độ | Sát Thương | Đặc Tính Chiến Thuật |
| :--- | :---: | :---: | :---: | :--- |
| **Xenomorph Crawler** | 50 | 75 px/s | 10 | Bò nhanh nhẹn, cận chiến lây nhiễm độc tố |
| **Kamikaze Exploder** | 40 | 110 px/s | 45 AoE | Lao tự sát nổ tung 55px phá tường và gây sát thương lớn |
| **Acid Spitter** | 65 | 55 px/s | 14 | Thả đạn axit từ cự ly 190px ăn mòn công trình |
| **Titan Behemoth** | 280 | 45 px/s | 32 | Siêu quái giáp dày, càn quét nghiền nát mọi công trình |

---

## 5. HỆ THỐNG PHÍM TẮT & ĐIỀU KHIỂN

| Phím Tắt | Chức Năng |
| :---: | :--- |
| **W, A, S, D** / Mũi tên | Di chuyển nhân vật (Hỗ trợ Virtual Joystick trên Mobile) |
| **Chuột Trái / Nút TẤN CÔNG** | Tấn công thường / Thu hoạch tài nguyên / Đặt công trình |
| **Chuột Phải / Phím ESC** | Hủy chế độ đặt công trình Thủ thành |
| **Phím SPACE / Nút LƯỚT** | Kích hoạt Lướt nhanh (Dash) né đòn |
| **Phím Q / Nút KỸ NĂNG 1** | Kích hoạt Kỹ năng 1 của vũ khí đang cầm |
| **Phím E / Nút KỸ NĂNG 2** | Kích hoạt Kỹ năng 2 của vũ khí đang cầm |
| **Phím 1, 2, 3, 4** | Đổi nhanh giữa 4 loại vũ khí: Giáo, Gậy, Dao, Cung |
| **Phím 5, 6, 7, 8** | Bật nhanh chế độ đặt: [5] Tường, [6] Bẫy Gai, [7] Tháp Canh, [8] Súng Cối |
| **Phím F** | Tương tác trạm (Bio-Lab, Lò Nung, Bàn Chế Tạo, Xưởng) hoặc Múc nước suối |
| **Phím I / TAB** | Đóng / Mở Balo Kho đồ (12-18 ô) và Trang bị Giáp |
| **Phím K** | Lưu tiến trình game thủ công vào `localStorage` |
| **Phím H** | Đóng / Mở Bảng Trợ giúp và Hướng dẫn chơi |
| **Phím M** | Bật / Tắt toàn bộ Âm thanh game |

---

## 6. HƯỚNG DẪN ĐÓNG GÓI APK BẰNG CAPACITOR

Khi muốn tạo file Android `.apk` từ thư mục này, thực thi lần lượt các lệnh PowerShell:

```powershell
# 1. Cài đặt Capacitor
cd c:\Go\demo
npm install @capacitor/core @capacitor/cli @capacitor/android --save

# 2. Khởi tạo dự án
npx cap init "Alien Apocalypse" "com.alien.apocalypse" --web-dir "."

# 3. Thêm nền tảng Android & Đồng bộ
npx cap add android
npx cap sync

# 4. Cố định màn hình ngang: Trong android/app/src/main/AndroidManifest.xml thêm:
# android:screenOrientation="sensorLandscape" vào thẻ <activity>

# 5. Build file APK:
cd android
./gradlew assembleDebug
# File APK hoàn thiện: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 7. GỢI Ý ĐỊNH HƯỚNG CHO CÁC PHASE TIẾP THEO (ROADMAP)

Nếu người dùng yêu cầu tiếp tục phát triển Phase 5 hoặc Endgame:
1. **Nhiệm vụ Sửa Chữa Tàu Không Gian Thoát Hiểm (Escape Spaceship Quest):**
   * Bãi biển chứa mảnh xác tàu vũ trụ rơi (`tech_debris`).
   * Yêu cầu thu thập đủ linh kiện liên biome (Nhiên liệu lưu huỳnh từ Núi, Vi mạch từ Bờ biển, Dung dịch kháng thể tinh khiết từ Bio-Lab) để sửa chữa phi thuyền và bấm nút phóng thoát hiểm (Điều kiện Thắng Game).
2. **Trận Chiến Trùm Cuối (Alien Queen Mega-Boss):**
   * Lối vào hang động bí mật trên đỉnh núi đá.
   * Trùm Chúa Tể Alien có 3 giai đoạn biến hình: Phun mưa axit diện rộng, đẻ trứng liên tục và triệu hồi đàn quái Behemoth hộ vệ.
3. **Mở Rộng Thú Cưng / Drone Hỗ Trợ (Support Companion):**
   * Chế tạo Robot Drone theo chân người chơi tự động nhặt tài nguyên và bắn đạn hỗ trợ phòng thủ.
