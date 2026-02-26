# Tiny Swords RTS

一款即時戰略塔防遊戲，使用 [Phaser 3](https://phaser.io/) 引擎開發。玩家操控騎士陣營，在左側建立基地、採集金礦、生產士兵，抵禦從右側進攻的哥布林波次敵人。撐過 10 波攻擊即為勝利。

**線上試玩：** https://easylive1989.github.io/tiny_sword/

## 遊戲操作

### 基本操作

| 操作 | 說明 |
|------|------|
| 左鍵點擊單位 | 選取單位，底部顯示資訊面板 |
| 左鍵點擊建築 | 選取建築，兵營可生產戰士 |
| 左鍵點擊空地 | 取消選取 |
| 右鍵點擊地面 | 命令已選取的單位移動到該位置 |
| 右鍵點擊金礦 | 命令工人前往採集金礦 |
| 右鍵點擊敵人 | 命令戰士攻擊目標敵人 |

### 遊戲流程

1. **採集資源** — 選取工人 (Pawn)，右鍵點擊金礦開始採集。工人會自動在金礦與主堡之間來回運送金幣
2. **建造兵營** — 點擊底部的「Barracks (150)」按鈕進入建造模式，綠色表示可放置，紅色表示不可放置，左鍵確認放置，右鍵取消
3. **生產戰士** — 選取兵營，點擊「Train Warrior (75)」按鈕，等待 10 秒後戰士出現在兵營旁
4. **防禦敵人** — 戰士會自動偵測並攻擊附近的敵人，也可以手動右鍵指定攻擊目標
5. **撐過 10 波** — 每 60 秒會有一波哥布林從右側進攻，難度逐波遞增，全部擊退即為勝利

### 勝負條件

- **勝利** — 撐過全部 10 波敵人攻擊，並消滅所有殘餘敵人
- **敗北** — 主堡 (Castle) 被敵人摧毀

## 遊戲單位

### 玩家單位

| 單位 | HP | 速度 | 攻擊力 | 說明 |
|------|----|------|--------|------|
| Pawn（工人） | 50 | 100 | - | 採集金礦，每趟運回 10 金幣 |
| Warrior（戰士） | 100 | 80 | 15 | 近戰單位，自動偵測並攻擊範圍內敵人 |

### 敵方單位

| 單位 | HP | 速度 | 攻擊力 | 說明 |
|------|----|------|--------|------|
| Goblin Torch（火把兵） | 60 | 60 | 10 | 基本步兵 |
| Goblin Barrel（炸藥桶） | 150 | 40 | 20 | 高血量坦克型 |
| Goblin TNT（自爆兵） | 30 | 50 | 80 | 低血量但爆炸傷害極高 |

### 建築

| 建築 | HP | 費用 | 佔地 | 說明 |
|------|----|------|------|------|
| Castle（主堡） | 1000 | - | 5×4 | 遊戲核心，被摧毀即敗北 |
| Gold Mine（金礦） | - | - | 3×2 | 派工人採集，每座含 5000 金幣 |
| Barracks（兵營） | 500 | 150 | 3×4 | 生產戰士（75 金 / 10 秒） |

## 技術架構

### 技術棧

- **引擎：** Phaser 3 (CDN v3.60.0)
- **語言：** JavaScript (ES Modules)
- **開發伺服器：** live-server
- **測試：** Playwright
- **部署：** GitHub Pages + GitHub Actions

### 專案結構

```
src/
├── main.js                    # Phaser 遊戲入口
├── config/
│   ├── gameConfig.js          # 遊戲常數（格子大小、費用、血量等）
│   └── assetManifest.js       # 素材路徑與幀設定
├── scenes/
│   ├── BootScene.js           # 素材載入 + 進度條
│   └── GameScene.js           # 主遊戲場景（核心協調器）
├── entities/                  # 遊戲實體
│   ├── Unit.js                # 單位基底類（狀態機、移動、動畫）
│   ├── Pawn.js                # 工人（採集循環）
│   ├── Warrior.js             # 戰士（近戰 + 自動索敵）
│   ├── GoblinTorch.js         # 哥布林火把兵
│   ├── GoblinBarrel.js        # 哥布林炸藥桶
│   ├── GoblinTNT.js           # 哥布林自爆兵
│   ├── Building.js            # 建築基底類
│   ├── Castle.js              # 主堡
│   ├── Barracks.js            # 兵營（生產單位）
│   └── GoldMine.js            # 金礦
├── systems/                   # 遊戲系統
│   ├── GridSystem.js          # 格子座標 + 佔用管理
│   ├── SelectionSystem.js     # 滑鼠選取 + 指令分派
│   ├── CommandSystem.js       # 移動、採集、攻擊指令
│   ├── ResourceSystem.js      # 金幣管理
│   ├── BuildSystem.js         # 建築放置（幽靈預覽 + 驗證）
│   ├── CombatSystem.js        # 戰鬥清理
│   └── WaveSystem.js          # 敵人波次生成（10 波遞增難度）
├── ui/                        # 介面元件
│   ├── HUD.js                 # 頂部資訊列（金幣、波次、倒數）
│   ├── BuildMenu.js           # 底部建造面板
│   ├── UnitPanel.js           # 建築/單位資訊面板
│   └── HealthBar.js           # 血條
├── utils/                     # 工具
│   ├── Pathfinding.js         # A* 尋路（8 方向 + MinHeap）
│   ├── SpriteHelper.js        # 動畫建立輔助
│   └── EventBus.js            # 事件匯流排
└── api/
    └── GameAPI.js             # window.gameAPI（Playwright 測試介面）
```

### 架構設計

遊戲採用 **Scene → Systems → Entities** 的分層架構：

```
GameScene（核心協調器）
  ├── Systems（遊戲邏輯）
  │   ├── GridSystem        ← 格子座標與碰撞
  │   ├── SelectionSystem   ← 輸入處理
  │   ├── CommandSystem     ← 指令發送
  │   ├── ResourceSystem    ← 經濟系統
  │   ├── BuildSystem       ← 建造流程
  │   ├── CombatSystem      ← 戰鬥管理
  │   └── WaveSystem        ← 波次控制
  ├── Entities（遊戲物件）
  │   ├── Unit（基底）→ Pawn, Warrior, Goblins
  │   └── Building（基底）→ Castle, Barracks, GoldMine
  └── UI（介面層）
      ├── HUD, BuildMenu, UnitPanel, HealthBar
      └── EventBus ← 解耦 Systems 與 UI
```

**關鍵設計決策：**

- **格子系統 (64×64)：** 20×12 格地圖，建築佔用多格，支援碰撞與佔用查詢
- **A* 尋路：** 8 方向移動，MinHeap 優先佇列，自動繞過建築障礙
- **單位狀態機：** IDLE → MOVING → ATTACKING / HARVESTING → DEAD
- **敵人 AI：** 偵測 3 格內玩家單位 → 攻擊；無目標 → 朝主堡行軍（加權優先）
- **EventBus：** 解耦資源變動與 UI 更新，避免直接依賴

### 地圖配置

```
解析度: 1280×768（20 列 × 12 行，每格 64px）

[水][水][水][水][水][水][水][水][水][水][水][水][水][水][水][水][水][水][水][水]
[水][草][草][草][草][草][草][草][草][草][草][草][草][草][草][草][草][草][草][水]
[水][草]                    [金礦]                                    [草][水]
[水][草]                                                              [草][水]
[水][草] [主堡]                         [兵營]                        [草][水]
[水][草]                                        [金礦]                [草][水]
[水][草]                                                              [草][水]
[水][草]                                                              [草][水]
[水][草]    [工人][工人]     [金礦]                         ← 敵人生成區[草][水]
[水][草]                                                              [草][水]
[水][草][草][草][草][草][草][草][草][草][草][草][草][草][草][草][草][草][草][水]
[水][水][水][水][水][水][水][水][水][水][水][水][水][水][水][水][水][水][水][水]

玩家區域: 列 0~13    敵人生成區: 列 18~19
```

## 開發

### 安裝與啟動

```bash
npm install
npm run dev          # 啟動 live-server (port 8080)
```

瀏覽器開啟 http://localhost:8080 即可遊玩。

### 執行測試

```bash
npm test             # 執行全部 14 個 Playwright 測試
```

測試透過 `window.gameAPI` 操控遊戲，涵蓋：

| 測試檔案 | 涵蓋範圍 |
|----------|----------|
| 01-game-loads | 遊戲啟動、初始狀態 |
| 02-unit-selection | 單位選取、移動 |
| 03-resource-harvest | 金礦採集循環 |
| 04-building | 兵營建造、費用驗證 |
| 05-combat | 敵人生成、戰鬥傷害 |
| 06-wave-system | 波次生成、跳波 |
| 07-win-lose | 勝利/敗北條件 |
