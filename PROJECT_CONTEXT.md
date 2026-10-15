# ALIEN APOCALYPSE: 2D PIXEL ART SURVIVAL & TOWER DEFENSE
## 📘 MASTER PROJECT CONTEXT & AGENT HANDOVER DOCUMENTATION

> **Tài liệu bàn giao toàn diện:** Dành cho AI Agent hoặc Developer tiếp quản dự án trong các phiên làm việc mới. Đọc tài liệu này sẽ nắm bắt được 100% bối cảnh, kiến trúc mã nguồn, quy chuẩn nghiêm ngặt, các tính năng đã hoàn thiện từ Phase 1 đến Phase 7, và lộ trình phát triển tiếp theo.

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
│   └── style.css              # Toàn bộ CSS giao diện HUD thu gọn, Modal, Mobile Controls, Responsive
├── js/
│   ├── constants.js           # Hằng số toàn cục: Biomes, Tiles, Vật phẩm, Vũ khí, Công trình, Quái vật, 5 Loài Pet
│   ├── audio.js               # Web Audio API Synth tạo âm thanh không cần file audio ngoài
│   ├── pixelart.js            # Engine vẽ procedural pixel art cho mọi tiles, items, quái vật, trứng & 5 loài Pet
│   ├── world.js               # Khởi tạo bản đồ 100x80 tiles (3 Biomes), va chạm vật lý, sông suối, nhặt ổ trứng [F]
│   ├── entities.js            # Lớp Player, 4 loài Monster, Đạn bay Projectile (kèm đạn Pet), Hạt Particle, Chữ nổi Combat
│   ├── weapons.js             # Logic 5 loại vũ khí (Giáo, Gậy, Dao, Cung, Súng) và 10 kỹ năng giải vây
│   ├── pets.js                # Ấp Trứng, Chiết Xuất Trứng Dư, Pet Đồng Hành (1/1) & Tiến Hóa Pet (Lv.1 -> Lv.3)
│   ├── inventory.js           # Quản lý 20-28 ô Balo, Lọc/Sắp xếp/Xóa vật phẩm nhanh, 5 ô Giáp + 1 ô Pet
│   ├── lab.js                 # 6 Tab chế tác, Nâng cấp Bio-Lab (Lv.1-4), Lồng Ấp & Tiến Hóa Pet, Lồng Cấy Tự Động
│   ├── buildings.js           # Hệ thống công trình: Tường, Bẫy gai, Tháp canh, Súng cối, Preview xây & nâng cấp Lv.3
│   ├── daynight.js            # Chu kỳ Ngày/Đêm, đợt quái tấn công tăng dần, cơ chế ấp trứng nở
│   ├── savegame.js            # Tự động lưu & Khôi phục tiến trình (kèm Cấp độ Lab, Pet Lv.1-3 & Lồng Ấp) từ LocalStorage
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

### ⚡ PHASE 5: HỆ THỐNG NÂNG CẤP TƯỜNG & SÚNG (LV.1 ➔ LV.3), SÚNG TRƯỜNG PLASMA [G], NGUYÊN LIỆU MỚI & TỐI ƯU HIỆU NĂNG 60FPS

1. **Vũ Khí Thứ 5 Mới — Súng Trường Plasma (`GUN` - Phím `[G]`, [weapons.js](file:///c:/Go/demo/js/weapons.js)):**
   * **Đánh thường (Giữ chuột xả đạn liên thanh):**
     * **Lv.1:** Bắn tia đạn năng lượng Plasma tốc độ cao (24 DMG, tầm 330px, 0.25s/phát).
     * **Lv.2 (Tinh Chế Titan):** Bắn **2 tia đạn Laser song song** (`twin plasma bolts`).
     * **Lv.3 (Siêu Nạp Plasma):** Bắn **1 tia chính Rail-Plasma xuyên thấu + 2 tia phụ hai bên** (tổng 3 tia đạn hủy diệt).
   * **Kỹ năng 1 [Q] — *Pháo Điện Từ EMP (`gun_emp`):*** Phóng cầu xung điện từ phát nổ diện rộng (85px), gây 38 sát thương và **làm choáng (Stun) toàn bộ quái vật 2.2 giây**.
   * **Kỹ năng 2 [E] — *Xả Đạn Hủy Diệt (`gun_barrage`):*** Xả loạt **5 viên đạn Plasma hạng nặng** tỏa hình quạt đẩy lùi đàn quái và lùi nhẹ giữ khoảng cách an toàn.

2. **Hệ Thống Nâng Cấp Toàn Bộ 5 Vũ Khí & Súng (`Lv.1 ➔ Lv.2 ➔ Lv.3`, [weapons.js](file:///c:/Go/demo/js/weapons.js), [lab.js](file:///c:/Go/demo/js/lab.js)):**
   * Nâng cấp trực tiếp tại **Bàn Chế Tạo (`Workbench`)** hoặc **Xưởng Thủ Thành (`Workshop`)**:
     * **Cấp 1 (Cơ Bản):** Sát thương x1.0, Tầm x1.0, Tốc đánh chuẩn.
     * **Cấp 2 (Tinh Chế Titan - Lv.2):** **+35% Sát thương**, **+12% Tầm đánh**, **+12% Tốc độ đánh**, giảm 12% hồi chiêu kỹ năng.
       * *Chi phí:* `3x Đá Quặng` + `2x Hợp Kim Titan` + `2x Giáp Xác Ngoại Lai`.
     * **Cấp 3 (Siêu Nạp Plasma - Lv.3):** **+80% Sát thương**, **+25% Tầm đánh**, **+22% Tốc độ đánh**, giảm 25% hồi chiêu kỹ năng.
       * *Chi phí:* `3x Hợp Kim Titan` + `2x Lõi Năng Lượng Plasma` + `3x Giáp Xác Ngoại Lai` + `2x Linh Kiện Điện Tử`.

3. **Hệ Thống Nâng Cấp & Sửa Chữa Công Trình Thủ Thành (`Lv.1 ➔ Lv.2 ➔ Lv.3`, [buildings.js](file:///c:/Go/demo/js/buildings.js)):**
   * **3 Cách Nâng Cấp Tiện Lợi:**
     1. Bấm phím **`[9]`** (chế độ Nâng Cấp 🔧) hoặc click trực tiếp vào công trình đã đặt trên bản đồ.
     2. Chỉ chuột vào công trình (hoặc đứng gần) và bấm phím tắt **`[R]`** để nâng cấp tức thì (hoặc sửa chữa đầy máu nếu đã đạt Lv.3).
     3. Mở **Xưởng Thủ Thành (`[F]`)** hoặc **Bàn Chế Tạo (`[F]`)** để nâng cấp nhanh từng loại công trình bằng bảng điều khiển.
   * **Chi tiết 3 Cấp Độ Công Trình:**
     * 🧱 **Tường Chắn (`wall`):**
       * **Lv.1 (Tường Chắn Cấp 1):** 250 HP.
       * **Lv.2 (Tường Bọc Thép Titan):** **550 HP**, Giáp giảm **4 sát thương/đòn**, **Phản đòn gai 8 DMG** vào quái cận chiến, tự hồi **2 HP/s**. (*Chi phí:* `3x Gỗ`, `3x Đá`, `1x Hợp Kim Titan`).
       * **Lv.3 (Tường Khiên Điện Từ Plasma):** **1050 HP**, Giáp giảm **9 sát thương/đòn**, **Phản xung điện 18 DMG**, tự hồi **6 HP/s**. (*Chi phí:* `2x Hợp Kim Titan`, `2x Giáp Xác Ngoại Lai`, `1x Lõi Plasma`).
     * 🗼 **Tháp Canh Súng Tự Động (`turret`):**
       * **Lv.1 (Tháp Canh Cấp 1):** 160 HP, tầm 175px, bắn đơn 16 DMG (0.45s/phát).
       * **Lv.2 (Tháp Súng Kép Gatling Laser):** **320 HP**, tầm **225px**, bắn **2 tia Laser song song** 28 DMG (0.30s/phát). (*Chi phí:* `2x Hợp Kim Titan`, `2x Linh Kiện`, `2x Thạch Anh`).
       * **Lv.3 (Tháp Pháo Railgun Tesla):** **580 HP**, tầm **285px**, bắn tia **Railgun 52 DMG (0.22s/phát) giật sét dây chuyền (Chain Lightning) sang 3 quái vật lân cận** gây thêm 55% sát thương sét. (*Chi phí:* `3x Hợp Kim Titan`, `2x Lõi Plasma`, `2x Giáp Xác Ngoại Lai`).
     * 💣 **Súng Cối Hạng Nặng (`mortar`):**
       * **Lv.1 (Súng Cối Cấp 1):** 140 HP, tầm 80-280px, 55 AoE DMG (bán kính nổ 65px).
       * **Lv.2 (Pháo Cối Nhiệt Hạch Napalm):** **280 HP**, tầm **70-340px**, **90 AoE DMG** (bán kính nổ 90px, tốc bắn nhanh hơn). (*Chi phí:* `2x Hợp Kim Titan`, `3x Bột Lưu Huỳnh`, `2x Linh Kiện`).
       * **Lv.3 (Pháo Quỹ Đạo Hạt Nhân Mini):** **500 HP**, tầm **60-410px**, **135 AoE DMG** (bán kính nổ 125px) + **Làm choáng toàn bộ quái trong vùng nổ 1.2 giây**. (*Chi phí:* `3x Hợp Kim Titan`, `2x Lõi Plasma`, `3x Dịch Tuyến Trứng`).
     * ⚙ **Bẫy Gai Sinh Học (`trap`):**
       * **Lv.1 (Bẫy Gai Cấp 1):** 60 HP, 22 DMG, làm chậm 50%, 12 lần kích hoạt.
       * **Lv.2 (Bẫy Lưỡi Cưa Titan):** **140 HP**, **42 DMG**, làm chậm **65%**, **24 lần kích hoạt**. (*Chi phí:* `1x Hợp Kim Titan`, `2x Giáp Xác Ngoại Lai`, `2x Bột Lưu Huỳnh`).
       * **Lv.3 (Bẫy Lưới Điện Từ Tesla):** **280 HP**, **70 DMG**, làm chậm **80% + Choáng 0.6s**, **45 lần kích hoạt**. (*Chi phí:* `2x Hợp Kim Titan`, `1x Lõi Plasma`, `2x Linh Kiện`).

4. **Bổ Sung Nguyên Liệu Mới & Công Thức Chế Tác ([constants.js](file:///c:/Go/demo/js/constants.js), [world.js](file:///c:/Go/demo/js/world.js), [entities.js](file:///c:/Go/demo/js/entities.js)):**
   * ⛏ **Quặng Sắt Titan (`iron_ore`):** Khai thác từ các **Mỏ Quặng Sắt Titan (`titanium_ore`, Tile 9)** phân bố trên vùng Núi Đá, hoặc rớt từ quái vật.
   * 🔩 **Hợp Kim Titan (`titanium_alloy`):** Nung tại **Lò Nung (`Furnace`)** từ `2x Quặng Sắt Titan + 2x Đá Quặng` (hoặc tái chế tại Xưởng từ `2x Linh Kiện Điện Tử + 2x Đá Quặng`). Rớt trực tiếp khi hạ gục siêu quái **Titan Behemoth**.
   *  carapace **Giáp Xác Ngoại Lai (`alien_chitin`):** Chiến lợi phẩm tự động thu thập khi tiêu diệt quái vật (`Crawler`, `Kamikaze`, `Spitter`, `Behemoth`). Dùng để gia cố tường giáp phản đòn và nâng cấp vũ khí.
   * 🔮 **Lõi Năng Lượng Plasma (`plasma_core`):** Khai thác từ **Mạch Năng Lượng Plasma (`plasma_node`, Tile 26)** dọc bờ biển nhiễm xạ, tổng hợp tại **Phòng Lab (`Bio-Lab`)** từ `2x Tinh Thể Thạch Anh + 1x Dịch Tuyến Trứng + 1x Linh Kiện Điện Tử`, hoặc rớt từ Boss **Titan Behemoth**.
   * 🦺 **Giáp Chiến Đấu Titan-Plasma (`vest_titanium`):** Chế tạo tại Bàn Chế Tạo (`3x Hợp Kim Titan + 3x Giáp Xác Ngoại Lai + 1x Lõi Plasma`), cộng **+18 Giáp vật lý** và **+35% Kháng Độc Tố**.
   * 🎒 **Mở rộng Balo Kho Đồ:** Nâng mặc định lên **20 ô (Max Stack 25)**, và nâng cấp tối đa lên **28 ô**.

5. **Tối Ưu Hóa Hiệu Năng Toàn Diện Chống Lag (60FPS Smooth Optimization):**
   * **Offscreen Static Ground Map Cache ([world.js](file:///c:/Go/demo/js/world.js)):** Toàn bộ 8,000 ô địa hình nền, vách đá và đỉnh núi tuyết được vẽ sẵn 1 lần duy nhất vào `this.groundCanvas` (`3200x2560`). Mỗi khung hình chỉ tốn **1 lệnh `ctx.drawImage`** thay vì hơn 650 vòng lặp vẽ tile lẻ tẻ.
   * **Loại Bỏ Cấp Phát Canvas Mỗi Frame Trong Hệ Thống Ánh Sáng Đêm ([daynight.js](file:///c:/Go/demo/js/daynight.js)):** Thay thế việc gọi `document.createElement('canvas')` full-screen 60 lần/giây bằng bộ đệm `this.lightCanvas` cố định ở độ phân giải tối ưu `0.5x` (giảm **75% số điểm ảnh fillrate** mà vẫn giữ nguyên chất lượng ánh sáng đèn pha mềm mại).
   * **Loại Bỏ `ctx.filter = 'brightness(2.4)'` & `createRadialGradient` Mỗi Frame ([entities.js](file:///c:/Go/demo/js/entities.js), [world.js](file:///c:/Go/demo/js/world.js), [pixelart.js](file:///c:/Go/demo/js/pixelart.js)):**
     * Thay thế `ctx.filter` (vốn ép trình duyệt rơi về chế độ CPU Software Rendering cực lag khi bắn trúng nhiều quái) bằng lớp phủ Alpha Flash trên GPU.
     * Pre-render toàn bộ hiệu ứng sương mù núi (`fx_mist_cloud`), hào quang Bio-Lab (`fx_biolab_aura`), và bụng phát sáng Kamikaze (`fx_kamikaze_glow`) thành Sprite tĩnh trong `pixelart.js`.
   * **Pre-rendered Minimap Cache & Throttling ([game.js](file:///c:/Go/demo/js/game.js)):** Địa hình Minimap được vẽ sẵn vào `this.minimapBgCanvas` 1 lần khi khởi tạo và cập nhật vị trí thực thể ở tần số 15 FPS, loại bỏ **2,000 lệnh `fillRect` mỗi frame**.
   * **DOM State Caching & DataURL Caching ([game.js](file:///c:/Go/demo/js/game.js), [inventory.js](file:///c:/Go/demo/js/inventory.js), [lab.js](file:///c:/Go/demo/js/lab.js), [mobile.js](file:///c:/Go/demo/js/mobile.js)):**
     * Lưu cache `window.pixelArt.getDataURL(name)` để không bao giờ mã hóa lại PNG `.toDataURL()` khi mở Balo hay Bàn Chế Tạo.
     * `updateHUD()` và `renderHydroponicsTab()` chỉ ghi vào DOM khi giá trị thực sự thay đổi, chấm dứt hoàn toàn hiện tượng Layout Thrashing 60 lần/giây.
   * **GPU Opacity Animation ([style.css](file:///c:/Go/demo/css/style.css)):** Chuyển hiệu ứng chớp đỏ/tím toàn màn hình (`bloodPulse`, `toxicPulse`) từ animate `box-shadow` blur radius sang animate `opacity` trên GPU Compositor.

---

### 🐣 PHASE 6: NHẶT TRỨNG QUÁI VẬT, LỒNG ẤP PHÒNG LAB & HỆ THỐNG THÚ CƯNG ĐỒNG HÀNH (TỐI ĐA 1 PET)

1. **Thu Thập Trứng Quái Vật Đột Biến (`monster_egg`, [world.js](file:///c:/Go/demo/js/world.js), [weapons.js](file:///c:/Go/demo/js/weapons.js), [entities.js](file:///c:/Go/demo/js/entities.js)):**
   * **Cách 1 (Nhặt nguyên vẹn từ Ổ Trứng):** Lại gần bất kỳ Ổ Trứng Ngoại Lai (`alien_egg`) trên bản đồ và bấm phím **`[F]`** (hoặc nút tương tác `💬` trên Mobile) để thu hồi nguyên vẹn `+1 Trứng Quái Vật Đột Biến` kèm `+1 Dịch Tuyến Trứng`.
   * **Cách 2 (Phá hủy Ổ Trứng):** Đập vỡ Ổ Trứng bằng vũ khí nhận `+1 Trứng Quái Vật Đột Biến` và `+2 Dịch Tuyến Trứng`.
   * **Cách 3 (Chiến lợi phẩm từ Quái & Boss):** Tiêu diệt Boss **Titan Behemoth** rớt 100% `+1 Trứng Quái Vật Đột Biến`; quái vật thường có 28% cơ hội rớt trứng.
   * **Hành trang khởi đầu:** Người chơi được trang bị sẵn `2x Trứng Quái Vật Đột Biến` trong Balo để trải nghiệm ấp trứng ngay lập tức.

2. **Cơ Chế Ấp Trứng Độc Quyền Trong Phòng Lab Cách Ly ([pets.js](file:///c:/Go/demo/js/pets.js), [lab.js](file:///c:/Go/demo/js/lab.js), [inventory.js](file:///c:/Go/demo/js/inventory.js)):**
   * **Ràng buộc vị trí nghiêm ngặt (`isPlayerInBioLab()`):** Trứng quái vật **CHỈ có thể đưa vào lồng ấp và nở khi người chơi đang đứng bên trong khu vực Phòng Lab Cách Ly** (Trung tâm Đồng Bằng). Nếu cố ấp trứng ngoài trời hoặc ở trạm khác, hệ thống sẽ cảnh báo và từ chối để đảm bảo an toàn sinh học.
   * **Thời gian ấp & Tăng tốc:** Mỗi quả trứng cần **10 giây** trong Lồng Ấp Sinh Học (hoặc dùng `1x Dịch Tuyến Trứng` để kích hoạt tia sinh học nở ngay lập tức). Khi người chơi rời khỏi Phòng Lab, quá trình ấp sẽ tạm dừng ở trạng thái bảo toàn cho tới khi quay lại Phòng Lab.

3. **5 Chủng Loài Pet Đột Biến Nở Ngẫu Nhiên ([constants.js](file:///c:/Go/demo/js/constants.js), [pets.js](file:///c:/Go/demo/js/pets.js), [pixelart.js](file:///c:/Go/demo/js/pixelart.js)):**
   * 🏹 **Cung Thủ Gai (`pet_archer` - Tấn Công Tầm Xa Như Cung):** Bắn tên gai sinh học tầm xa (290px, 16 DMG mỗi 0.85s, tốc đạn 430px/s) như cung thủ, đẩy lùi và làm chậm quái vật 25%.
   * 💚 **Tinh Linh Sinh Học (`pet_healer` - Phục Hồi HP):** Tự động hồi phục **+2.5 HP/giây** liên tục, kích hoạt xung **Hồi Sinh Mệnh (+12 HP mỗi 5s)**, tăng **+25 Max HP**, và bắn đạn sinh học hút máu về cho chủ nhân.
   * 🛡️ **Bọ Giáp Kháng Độc (`pet_antitoxin` - Kháng Độc & Thanh Lọc):** Tăng **+35% Kháng Độc Tố**, tự động **thanh lọc độc tố -1.8%/giây**, cộng **+6 Giáp vật lý**, và bắn đạn khử trùng làm suy yếu quái.
   * ❄️ **Phượng Hoàng Băng (`pet_frost` - Khống Chế Đóng Băng):** Bắn cầu băng giá tầm xa (265px, 14 DMG) làm đóng băng tốc chạy quái vật **-50% trong 2.2s**, đồng thời tăng **+15 Tốc độ chạy** cho chủ nhân.
   * ⚡ **Rồng Hạch Tâm Plasma (`pet_plasma` - Đa Năng Huyền Thoại):** Bắn cầu sét Plasma (310px, 22 DMG) **giật sét dây chuyền (Chain Lightning) sang 3 mục tiêu**, kèm hồi phục **+1.5 HP/s**, thanh lọc độc **-1.0%/s**, **+20% Kháng Độc** và **+4 Giáp**.

4. **Giới Hạn Nghiêm Ngặt Chỉ Mang Bên Người 1 Pet (`MAX_ACTIVE_PETS: 1`):**
   * Người chơi **chỉ được mang theo bên mình tối đa 1 Pet đồng hành (`1/1`)** tại mọi thời điểm.
   * Khi ấp nở thêm Pet mới trong lúc đã có 1 Pet đi cùng, Pet mới sẽ tự động được lưu trữ an toàn vào **Chuồng Sinh Học Phòng Lab (`storedPets`)**.
   * Người chơi có thể đổi Pet đang mang bên người lấy bất kỳ Pet nào trong Chuồng Sinh Học thông qua tab **`🐣 ẤP TRỨNG & PET`** (Phím **`[P]`** hoặc click vào ô `🐾 Thú Cưng (1/1)` trong Balo **`[I]`**).

5. **⭐ Nâng Cấp / Tiến Hóa Pet (`Lv.1 ➔ Lv.3 MAX`, [pets.js](file:///c:/Go/demo/js/pets.js), [lab.js](file:///c:/Go/demo/js/lab.js)):**
   * Giải quyết triệt để bài toán dư thừa Trứng Quái Vật (`monster_egg`) và Pet nở trùng khi chỉ mang được `1/1` Pet bên người:
   * **2 Phương Thức Cường Hóa Tại Tab `🐣 ẤP TRỨNG & PET` (`[Phím P]`):**
     1. **🥚 Cường hóa bằng Trứng Quái Vật dư (`upgradeActivePetWithEgg`):** Tốn **1 Trứng** để nâng từ `Lv.1 ➔ Lv.2`, và **2 Trứng** để nâng từ `Lv.2 ➔ Lv.3 MAX`.
     2. **🧬 Dung hợp Pet dự phòng / Pet nở trùng (`upgradeActivePetWithStored`):** Hiến tế 1 Pet trong Chuồng Lưu Trữ để tăng ngay **+1 Cấp Sao** cho Pet đang mang bên người và nhận thêm **+1 Dịch Tuyến Trứng (`egg_fluid`)**.
   * **Sức Mạnh Tăng Tiến Theo Cấp Sao (`getPetEffectiveStats`):**
     * **⭐ Lv.1 (Cơ bản):** 100% sát thương bắn phụ, 100% hồi máu / lọc độc và chỉ số cộng thêm cho chủ nhân.
     * **⭐⭐ Lv.2 (Cường Hóa):** **+45% Sát thương bắn phụ**, **+50% Hồi máu / Lọc độc & Chỉ số chủ nhân** (Max HP, Giáp, Kháng Độc, Tốc Chạy), giảm **12% hồi chiêu bắn** và **+35px tầm bắn**.
     * **⭐⭐⭐ Lv.3 (Tiến Hóa Tối Đa - MAX):** **Bắn 2 tia đạn song song (`x2 Đạn Đôi`)**, **+100% Sát thương mỗi tia**, **+120% Hồi máu / Lọc độc & Chỉ số chủ nhân**, giảm **22% hồi chiêu bắn**, **+70px tầm bắn**, kèm vòng hào quang đôi dưới chân Pet và huy hiệu `[Lv.3]` trên đầu.

6. **🧪 Chiết Xuất Trứng Dư Trực Tiếp Tại Phòng Lab (`extractEggInLab`, [pets.js](file:///c:/Go/demo/js/pets.js), [lab.js](file:///c:/Go/demo/js/lab.js), [constants.js](file:///c:/Go/demo/js/constants.js)):**
   * Cho phép nghiền trực tiếp **1 Trứng Quái Vật dư** (hoặc bấm **`🧪 Chiết Xuất Hết (N)`** để nghiền toàn bộ trứng dư) ngay tại Phòng Lab mà **không cần chờ 10 giây ấp nở**.
   * **Thành phẩm mỗi 1 Trứng chiết xuất:** Nhận ngay **+2 Dịch Tuyến Trứng (`egg_fluid`) + 2 Giáp Xác Ngoại Lai (`alien_chitin`) + 1 Lõi Năng Lượng Plasma (`plasma_core`)** để chế tạo thuốc kháng thể và nâng cấp Súng / Công trình Lv.3.

---

### 🎒 PHASE 7: NÂNG CẤP PHÒNG LAB (LV.1 ➔ LV.4), THU GỌN GIAO DIỆN HUD & QUẢN LÝ / XÓA VẬT PHẨM BALO

1. **Hệ Thống Nâng Cấp Phòng Lab Sinh Học 4 Cấp (`Lv.1 ➔ Lv.4 MAX`, [lab.js](file:///c:/Go/demo/js/lab.js), [world.js](file:///c:/Go/demo/js/world.js)):**
   * Nâng cấp trực tiếp tại banner đầu cửa sổ Phòng Lab (`[Phím L]`) hoặc tab Lồng Cấy Sinh Học:
     * **Lv.1 (Trạm Cách Ly Cơ Bản):** 3 Lồng cấy, tốc độ mọc chuẩn (1.0x), sản lượng +2 cây/mẻ, bán kính Khiên Vô Trùng 128px.
     * **Lv.2 (Phòng Lab Khử Trùng):** **4 Lồng cấy**, cây lớn nhanh **1.25x**, sản lượng **+3 cây/mẻ**, bán kính Khiên **160px**, hồi **+1.5 HP/s** & lọc độc **-0.8%/s** khi đứng trong Lab.
     * **Lv.3 (Trung Tâm Nghiên Cứu Gen):** **6 Lồng cấy**, cây lớn nhanh **1.55x**, sản lượng **+3 cây/mẻ**, bán kính Khiên **195px**, hồi **+3.0 HP/s** & lọc độc **-1.6%/s** trong Lab.
     * **Lv.4 (Pháo Đài Sinh Học Tối Thượng - MAX):** **8 Lồng cấy tự động**, cây lớn nhanh **2.0x**, sản lượng **+4 cây/mẻ**, bán kính Khiên **240px**, hồi **+5.0 HP/s** & lọc độc **-3.0%/s** trong Lab.
   * Hỗ trợ **Tự Động Gieo Lại Hạt Giống (`Auto-Replant`)**, nút **Thu Hoạch Tất Cả** và **Gieo Nhanh Toàn Bộ Lồng Trống**.

2. **Tối Giản Hóa Giao Diện HUD & Thanh Công Cụ (`Compact HUD & Collapsible Dock`, [index.html](file:///c:/Go/demo/index.html), [style.css](file:///c:/Go/demo/css/style.css)):**
   * Thu gọn toàn bộ HUD trên cùng và khay kỹ năng dưới đáy màn hình, mở rộng tối đa tầm nhìn bản đồ chiến đấu.
   * Tích hợp nút **`▼ Ẩn Khay` / `▲ Mở Khay`** để đóng/mở nhanh hàng Vũ Khí & Xây Dựng Thủ Thành, và gom các nút hệ thống phụ vào menu **`⚙ MENU`**.

3. **Hệ Thống Quản Lý, Lọc, Sắp Xếp & Xóa Bỏ Vật Phẩm Trong Balo ([inventory.js](file:///c:/Go/demo/js/inventory.js)):**
   * **Nút xóa nhanh `✕` trên từng ô đồ:** Bấm trực tiếp vào góc phải trên của bất kỳ ô đồ nào để xóa ngay ô đó (giữ `Shift` hoặc click Chuột phải để xóa lẻ 1 món).
   * **Chế độ Xóa Nhanh (`🗑 Chế Độ Xóa Nhanh - Trash Mode`):** Khi bật lên, chạm vào bất kỳ ô đồ nào trong Balo sẽ lập tức tiêu hủy vật phẩm đó mà không cần xác nhận rườm rà.
   * **Bảng Chi Tiết & Thao Tác Vật Phẩm Chọn (`Selected Item Inspector`):** Hiển thị đầy đủ mô tả, số lượng trong ô / tổng trong Balo cùng 4 nút thao tác rõ ràng:
     * **`⚡ Sử Dụng / Trang Bị`**
     * **`➖ Xóa 1`** (Xóa bớt 1 đơn vị)
     * **`🗑 Xóa Ô (N)`** (Xóa toàn bộ stack trong ô đang chọn)
     * **`🔥 Xóa Hết (Tổng)`** (Xóa sạch mọi ô chứa vật phẩm cùng loại trong Balo)
   * **Tiện ích dọn kho 1 chạm:**
     * **`📦 Gộp & Sắp Xếp`:** Tự động dồn các ô vật phẩm cùng loại lại tới mức tối đa (`Max Stack 25`) và sắp xếp theo thứ tự.
     * **`🧹 Dọn Đồ Dư`:** Tự động lọc và tiêu hủy toàn bộ vật phẩm nhiễm độc có hại (`Nước Ô Nhiễm`, `Quả Đột Biến Nhiễm Độc`) chỉ với 1 cú bấm.
     * **Bộ lọc danh mục:** Lọc nhanh theo `Tất Cả`, `Tiêu Hao`, `Trang Bị`, `Nguyên Liệu`.

---

### 🌩️🤖 PHASE 8: SỰ KIỆN THỜI TIẾT BIẾN ĐỘNG (LOOT X2) & HỆ THỐNG DRONE TỰ ĐỘNG NHẶT ĐỒ & SỬA TƯỜNG (LV.1 ➔ LV.3)

1. **Hệ Thống Thời Tiết Biến Động & Đêm Huyết Nguyệt (`WEATHER_TYPES`, [daynight.js](file:///c:/Go/demo/js/daynight.js), [entities.js](file:///c:/Go/demo/js/entities.js), [lab.js](file:///c:/Go/demo/js/lab.js)):**
   * Tự động chuyển biến thời tiết mỗi ngày mới hoặc người chơi có thể **bấm trực tiếp vào Đồng hồ Thời gian trên HUD (`#chronometer-panel`)** để chuyển đổi nhanh giữa 4 hiện tượng thời tiết:
     * **☀ Quang Đãng (`CLEAR`):** Thời tiết ổn định, tầm nhìn rõ ràng.
     * **🌧️ Mưa Axit Độc (`ACID_RAIN`):**
       * *Hiệu ứng:* Mưa axit xanh lục rơi chéo toàn màn hình + tăng nhẹ độc tố (`+0.30% Độc/s`) khi đứng ngoài Khiên Vô Trùng Phòng Lab.
       * *Phần thưởng:* Cây dược liệu trong Lồng Cấy lớn nhanh **+40%**, và mọi quái vật bị tiêu diệt rớt **X2 Giáp Xác Ngoại Lai (`alien_chitin`) + 65% rớt thêm Dịch Tuyến Trứng (`egg_fluid`)**!
     * **⚡ Bão Điện Từ (`EMP_STORM`):**
       * *Hiệu ứng:* Sét từ trường tự động giáng xuống mặt đất mỗi ~3.2s gây **28 sát thương điện + Làm choáng (Stun) 1.8s** lên quái vật ngoài trời.
       * *Phần thưởng:* Cộng hưởng từ trường tăng **+25% sát thương cho Súng Trường Plasma (`GUN`), Tháp Canh (`Turret`), Rồng Plasma và Drone**, đồng thời quái vật bị hạ gục có **55% rớt Mảnh Vỡ Công Nghệ (`tech_scrap`) & 22% rớt Lõi Plasma (`plasma_core`)**!
     * **🩸 Đêm Huyết Nguyệt / Trăng Máu (`BLOOD_MOON`):**
       * *Hiệu ứng:* Bầu trời đỏ rực kèm tàn lửa bay lên, quái vật tấn công dữ dội.
       * *Phần thưởng:* **TẤT CẢ QUÁI VẬT & BOSS BỊ TIÊU DIỆT ĐỀU RỚT X2 CHIẾN LỢI PHẨM (`x2 Giáp Xác, x2 Quặng/Thạch Anh, x2 Hợp Kim Titan & Lõi Plasma, 50% rớt Trứng Quái Vật`)**!

2. **Hệ Thống Robot Drone Tự Động Nhặt Tài Nguyên & Sửa Chữa Công Trình (`DRONE_TIERS`, [pets.js](file:///c:/Go/demo/js/pets.js), [lab.js](file:///c:/Go/demo/js/lab.js), [constants.js](file:///c:/Go/demo/js/constants.js)):**
   * Chế tạo và nâng cấp tại **Xưởng Cơ Khí Thủ Thành (`Workshop` - nút `⚙️`)** hoặc tab **Ấp Trứng & Pet (`[Phím P]`)**:
     * **🤖 Cấp 1 — Drone Thu Thập & Sửa Chữa (`Lv.1`):**
       * Triển khai **1 Drone** bay tự động (bán kính quét `280px`), tự phóng tia Laser khai thác tài nguyên & hái quả mọng sạch quanh người/căn cứ cộng thẳng vào Balo mỗi `2.6s`, tự động phóng tia Hàn Nano sửa chữa Tường/Tháp bị hư hại (**`+16 HP/giây`**), bắn đạn Laser hỗ trợ (**`15 DMG`**) và cộng **`+4 Giáp`** cho chủ nhân.
     * **🤖🤖 Cấp 2 — Phi Đội Drone Kép Từ Trường (`Lv.2`):**
       * Mở khóa **2 Drone bay song song** (bán kính quét `400px`), tự thu hoạch nhanh mỗi `1.8s`, hàn sửa cùng lúc 2 công trình (**`+34 HP/giây`**), bắn Laser **`24 DMG`** và cộng **`+8 Giáp`**.
     * **🤖🤖⚡ Cấp 3 — Phi Đội Drone AI Siêu Nạp (`Lv.3 MAX`):**
       * **2 Drone AI Tối Thượng** (bán kính quét toàn khu `540px`), tự thu hoạch siêu tốc mỗi `1.1s` (bao gồm cả tự động thu hồi `Trứng Quái Vật` từ Ổ Trứng ở gần!), hàn sửa công trình **`+60 HP/giây`**, bắn đạn Plasma **`38 DMG`** và cộng **`+14 Giáp`**.
   * **2 Chế Độ Bay Linh Hoạt (`toggleDroneMode`):**
     * **`🔄 ĐA NHIỆM (BAY THEO NGƯỜI)`:** Bay hộ tống người chơi, vừa đi đường vừa tự động khai thác tài nguyên dọc đường + bắn quái + sửa công trình ở gần.
     * **`🏰 TUẦN TRA CĂN CỨ (TRỰC CHIẾN LAB)`:** Bay tuần tra cố định quanh Phòng Lab & Hàng phòng thủ để liên tục hàn sửa Tường/Tháp Canh suốt đêm ngay cả khi người chơi đi xa!

---

## 4. BẢNG THÔNG SỐ VŨ KHÍ, CÔNG TRÌNH, THÚ CƯNG, NGUYÊN LIỆU & QUÁI VẬT

### 🐣 Bảng 5 Loài Pet Đồng Hành (Ấp Ngẫu Nhiên Tại Phòng Lab — Tiến Hóa Lv.1 ➔ Lv.3 MAX)
| Loài Pet | Độ Hiếm (Tỉ Lệ) | Đòn Bắn Tầm Xa (Lv.1 / Lv.2 / Lv.3 Đạn Đôi) | Kỹ Năng Nội Tại & Chỉ Số Cộng Thêm (Lv.1 ➔ Lv.3) |
| :--- | :---: | :--- | :--- |
| **🏹 Cung Thủ Gai (`pet_archer`)** | Phổ Biến (26%) | Tên gai (16 / 23 / 32x2 DMG, làm chậm 25%) | Tốc bắn liên thanh + Đẩy lùi quái, **+10 ➔ +22 Max HP**, **+5 ➔ +11 Tốc chạy** |
| **💚 Tinh Linh Sinh Học (`pet_healer`)**| Hiếm (24%) | Đạn sinh học (10 / 15 / 20x2 DMG + Hút HP) | **Hồi +2.5 ➔ +5.5 HP/s**, Xung trị thương, **+25 ➔ +55 Max HP**, **+10 ➔ +22% Kháng Độc** |
| **🛡️ Bọ Giáp Kháng Độc (`pet_antitoxin`)**| Hiếm (22%) | Đạn khử độc (12 / 17 / 24x2 DMG, chậm 20%) | **+35 ➔ +77% Kháng Độc**, **Thanh lọc độc -1.8 ➔ -4.0%/s**, **+6 ➔ +13 Giáp** |
| **❄️ Phượng Hoàng Băng (`pet_frost`)** | Sử Thi (16%) | Cầu băng giá (14 / 20 / 28x2 DMG, chậm 50% 2.2s) | Khống chế diện rộng, **+15 ➔ +33 Tốc chạy**, **+3 ➔ +7 Giáp** |
| **⚡ Rồng Hạch Tâm Plasma (`pet_plasma`)**| Huyền Thoại (12%)| Sét Plasma (22 / 32 / 44x2 DMG, **Giật sét 3 mục tiêu**)| **Hồi +1.5 ➔ +3.3 HP/s**, **Lọc độc -1.0 ➔ -2.2%/s**, **+20 ➔ +44% Kháng Độc**, **+4 ➔ +9 Giáp** |

### 🔫 Bảng 5 Vũ Khí (Hỗ Trợ Nâng Cấp Lv.1 ➔ Lv.2 [+35% DMG] ➔ Lv.3 [+80% DMG])
| Vũ Khí | Phím | Sát Thương (Lv1 / Lv2 / Lv3) | Tầm / Tốc Độ | Kỹ Năng 1 [Q] | Kỹ Năng 2 [E] |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **Giáo (Spear)** | `[1]` | 18 / 24 / 32 | 65px (0.42s) | Quét Ngang (AoE 120°, Knockback 130px) | Chống Sào Nhảy Vọt (Vượt chướng ngại 180px) |
| **Gậy (Staff)** | `[2]` | 14 / 19 / 25 | 55px (0.55s) | Chấn Động (Sóng xung kích choáng 1.5s) | Lốc Xoáy Đẩy Lùi (Bảo vệ diện rộng +30% Tốc) |
| **Dao Găm (Dagger)**| `[3]` | 11 / 15 / 20 | 42px (0.22s) | Bom Khói Sinh Học (Tàng hình 2s, xuyên quái)| Đâm Xuyên Bóng Tối (Lướt đâm + Chậm 50%)|
| **Cung (Bow)** | `[4]` | 16 / 22 / 29 | 320px (0.60s) | Mũi Tên Lưới Trói (Trói chân AoE 2.5s) | Phát Bắn Giật Lùi (Đạn nổ chậm + Lùi 80px)|
| **Súng Plasma (Gun)**| `[G]` | 24 / 32 (x2 tia) / 43 (x3 tia)| 330px (0.25s) | Pháo Điện Từ EMP (38 DMG + Choáng AoE 2.2s)| Xả Đạn Hủy Diệt (5 tia đạn quạt + Đẩy lùi) |

### 🏰 Bảng Công Trình Thủ Thành 3 Cấp Độ (Lv.1 ➔ Lv.2 ➔ Lv.3)
| Công Trình | Cấp 1 (Cơ Bản) | Cấp 2 (Tinh Chế Titan) | Cấp 3 (Siêu Nạp Plasma) |
| :--- | :--- | :--- | :--- |
| **🧱 Tường Chắn** | 250 HP | **550 HP**, Giáp 4, Phản đòn 8 DMG, Hồi 2 HP/s | **1050 HP**, Giáp 9, Phản xung điện 18 DMG, Hồi 6 HP/s |
| **⚙ Bẫy Gai** | 60 HP, 22 DMG, Chậm 50% (12 lần) | **140 HP**, **42 DMG**, Chậm 65% (24 lần) | **280 HP**, **70 DMG**, Chậm 80% + **Choáng 0.6s** (45 lần) |
| **🗼 Tháp Canh Súng**| 160 HP, Tầm 175, 16 DMG (0.45s) | **320 HP**, Tầm 225, **28 DMG x2 tia Laser** (0.30s) | **580 HP**, Tầm 285, **52 DMG Railgun giật sét 3 mục tiêu** (0.22s) |
| **💣 Súng Cối** | 140 HP, Tầm 280, 55 AoE DMG | **280 HP**, Tầm 340, **90 AoE DMG** (Nổ rộng 90px) | **500 HP**, Tầm 410, **135 AoE DMG + Choáng 1.2s** (Nổ 125px) |

### 🧪 Bảng Nguyên Liệu Nâng Cấp & Chế Tác Bổ Sung (Phase 5 - Phase 7)
| Mã Item | Tên Nguyên Liệu | Nguồn Thu Thập / Chế Tạo | Công Dụng Chính |
| :--- | :--- | :--- | :--- |
| `monster_egg` | **Trứng Quái Vật Đột Biến** | Nhặt từ Ổ Trứng `[F]` / Đập Ổ Trứng / Hạ Quái & Boss | Ấp nở Pet tại Phòng Lab, **Cường hóa Pet lên Lv.2–Lv.3**, hoặc **Chiết xuất trực tiếp** thành Dịch Trứng + Giáp Xác + Lõi Plasma |
| `egg_fluid` | **Dịch Tuyến Trứng** | Phá Ổ Trứng / Chiết xuất Trứng dư / Dung hợp hoặc thả Pet | Bào chế Huyết Thanh Kháng Độc, kích nở Trứng tức thì, tổng hợp Lõi Plasma |
| `iron_ore` | **Quặng Sắt Titan** | Đập Mỏ Quặng Sắt Titan trên Núi Đá / Hạ quái vật | Nung thành Hợp Kim Titan tại Lò Nung |
| `titanium_alloy` | **Hợp Kim Titan** | Lò Nung (`2x Quặng Sắt Titan + 2x Đá`) / Hạ Boss Behemoth | Nâng cấp Tường, Tháp Súng, Súng Cối, Phòng Lab & 5 Vũ Khí lên Lv.2 - Lv.4 |
| `alien_chitin` | **Giáp Xác Ngoại Lai** | Rớt tự động khi tiêu diệt quái vật / Chiết xuất Trứng dư | Chế tạo Giáp Titan, nâng cấp Tường phản đòn & Vũ khí Lv.2 - Lv.3 |
| `plasma_core` | **Lõi Năng Lượng Plasma**| Mạch Plasma bờ biển / Bào chế hoặc Chiết xuất Trứng tại Lab | Nâng cấp Phòng Lab, Tường Khiên Điện Từ, Tháp Railgun, Cối Hạt Nhân & Vũ khí Lv.3 |
| `vest_titanium` | **Giáp Chiến Đấu Titan** | Bàn Chế Tạo (`3x Hợp Kim Titan + 3x Giáp Xác + 1x Lõi Plasma`)| Trang bị Áo Giáp cuối (+18 Giáp bảo vệ, +35% Kháng Độc) |

---

## 5. HỆ THỐNG PHÍM TẮT & ĐIỀU KHIỂN

| Phím Tắt | Chức Năng |
| :---: | :--- |
| **W, A, S, D** / Mũi tên | Di chuyển nhân vật (Hỗ trợ Virtual Joystick trên Mobile) |
| **Chuột Trái / Nút TẤN CÔNG** | Tấn công thường (Giữ chuột xả đạn Súng Plasma) / Thu hoạch / Đặt & Nâng cấp công trình |
| **Chuột Phải / Phím ESC** | Hủy chế độ đặt/nâng cấp công trình Thủ thành (Trong Balo: Chuột phải vào ô đồ để xóa 1 món) |
| **Phím SPACE / Nút LƯỚT** | Kích hoạt Lướt nhanh (Dash) né đòn |
| **Phím Q / Nút KỸ NĂNG 1** | Kích hoạt Kỹ năng 1 của vũ khí đang cầm |
| **Phím E / Nút KỸ NĂNG 2** | Kích hoạt Kỹ năng 2 của vũ khí đang cầm |
| **Phím 1, 2, 3, 4, G** | Đổi nhanh 5 loại vũ khí: `[1]` Giáo, `[2]` Gậy, `[3]` Dao, `[4]` Cung, **`[G]` Súng Trường Plasma** |
| **Phím 5, 6, 7, 8** | Bật nhanh chế độ đặt: `[5]` Tường, `[6]` Bẫy Gai, `[7]` Tháp Canh, `[8]` Súng Cối |
| **Phím 9 / Phím R** | **`[9]`** Bật chế độ click nâng cấp công trình / **`[R]`** Nâng cấp hoặc sửa chữa nhanh công trình dưới trỏ chuột / gần người chơi |
| **Phím F** | Tương tác trạm (Bio-Lab, Lò Nung, Bàn Chế Tạo, Xưởng), Nhặt Trứng Quái Vật nguyên vẹn hoặc Múc nước suối |
| **Phím P / Phím L** | **`[P]`** Mở nhanh Lồng Ấp Trứng, Nâng Cấp Pet (Lv.1-3) & Chiết Xuất Trứng Dư / **`[L]`** Mở Phòng Lab Sinh Học |
| **Phím I / TAB** | Đóng / Mở Balo Kho đồ (20-28 ô), Sắp xếp, Xóa bỏ vật phẩm dư thừa & Trang bị Giáp / Pet |
| **Phím K** | Lưu tiến trình game thủ công vào `localStorage` |
| **Phím U** | Cứu hộ khẩn cấp (Thoát kẹt địa hình / quái vật) |
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

Nếu người dùng yêu cầu tiếp tục phát triển Phase 6 hoặc Endgame:
1. **Nhiệm vụ Sửa Chữa Tàu Không Gian Thoát Hiểm (Escape Spaceship Quest):**
   * Bãi biển chứa mảnh xác tàu vũ trụ rơi (`tech_debris`).
   * Yêu cầu thu thập đủ linh kiện liên biome (Nhiên liệu lưu huỳnh từ Núi, Lõi Năng Lượng Plasma từ Bờ biển, Dung dịch kháng thể tinh khiết từ Bio-Lab) để sửa chữa phi thuyền và bấm nút phóng thoát hiểm (Điều kiện Thắng Game).
2. **Trận Chiến Trùm Cuối (Alien Queen Mega-Boss):**
   * Lối vào hang động bí mật trên đỉnh núi đá.
   * Trùm Chúa Tể Alien có 3 giai đoạn biến hình: Phun mưa axit diện rộng, đẻ trứng liên tục và triệu hồi đàn quái Behemoth hộ vệ.
3. **Mở Rộng Thú Cưng / Drone Hỗ Trợ (Support Companion):**
   * Chế tạo Robot Drone theo chân người chơi tự động nhặt tài nguyên và bắn đạn hỗ trợ phòng thủ.

