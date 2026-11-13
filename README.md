# PATCHFLOW

ブラウザで機材と端子を配置して音響配線を作成する、静的Webアプリです。

## 使い方

- 左のライブラリで種類・ブランドを絞り込み、機材を追加します。
- 出力端子をクリックし、入力端子をクリックするとケーブルを接続します。
- ブースの見出しをドラッグすると、所属機材がまとめて動きます。
- 「＋ブース」で枠を作成し、機材の「所属ブース」でメンバーを設定します。
- ケーブルをクリックして選び、詳細欄の削除ボタンかDelete / Backspaceで削除します。
- 「↶」で変更を取り消せます。
- 光の流れは接続方向の視覚演出です。音声を実際に検出・再生してはいません。
- 状態はブラウザ内に自動保存します。JSONで保存・再読込、配線図はSVG、ケーブルリストはCSVで出力できます。

## 機材と出典

2026年11月5日確認。ライブラリは網羅的な全機材リストではなく、仕様と写真を確認した28機種です。

- AlphaTheta CDJ-3000X / CDJ-1500X：メーカー現行製品ページ。
- Pioneer DJ DJM-A9：メーカー製品ページ。CDJ-3000も独立した実機モデルとしてライブラリから選べます。
- YAMAHA MG06X / MG10XU / MG12XU / MG16XU / MG20XU：メーカー端子仕様、シネ・フォーカスのレンタル取扱い。
- ZOOM LiveTrak L-12：メーカー製品情報・取扱説明書、メディア・リース取扱い・写真。
- YAMAHA DBR10 / DBR12 / DBR15 / CBR10 / CBR12 / CBR15：メーカー仕様・写真。
- YAMAHA PX5：メーカー仕様、メディア・リース取扱い・写真。

各機材の詳細から出典へリンクできます。パンダスタジオのサイトは取得制限があり、取扱いを確認した他のレンタル会社を参照しています。

## 接続チェックの範囲

物理端子の方向・種類・信号形式・ジャックの重複を検査します。パッシブスピーカーはアンプ出力からのみ接続できます。PX5はステレオ運用、1チャンネル1台のスピーカーを対象とし、入力・出力とも同一チャンネルの別端子を重複使用できません。スピコンはNL4の1+/1−。スピーカー用PHONEとライン用TSは別規格として扱います。

電源、ゲイン、内部ルーティング、クロスオーバー、リミッター、アンプ出力と許容入力の最終調整は実機で確認してください。並列接続・ブリッジ・NL4の2+/2−・TRS/XLR以外の変換ケーブル・USB/LINKの配線・映像接続は未対応です。MG/LiveTrak等の共有チャンネル端子は端子数を表示しますが、すべての内部排他関係までは自動判定しません。

## 開発

依存パッケージ不要。`dist/` を静的ホスティングするか、`python3 -m http.server --directory dist` で実行できます。

`node --check dist/app.js` と `node test-rules.cjs` で構文・接続ルールを検証します。

## v0.3の操作

キャンバス下の固定バーでグループを選択すると、所属機材のヘッダーのドラッグでもまとめ移動できます。右の方向ボタンは20px単位。Escで個別移動に戻ります。グループのX/Y座標も指定できます。

ズームは25〜200%。＋/−、スライダー、Ctrl/Cmd＋ホイール、トラックパッドのピンチで拡大縮小できます。倍率をクリックすると100%、全体表示でキャンバス全体を表示します。

XDJ-AZは公式製品ページ・公式取扱説明書、DM3/DM3 StandardはYAMAHA公式仕様・写真を参照しています。レンタル取扱いは西尾レントオール・アークベル・KIG・メディアリース等から確認しています。

## v0.4の操作と追加機材

- 新規機材は常に「グループなし」。所属は明示的に設定します。位置からグループを推測しません。
- 線を選ぶとキャンバス内に操作バーが出ます。「接続先を変更」「接続元を変更」で新しい端子をクリックするか、候補一覧で選択します。選択線の端点丸印をドラッグして差し替えることもできます。互換性のない差し替えは元の配線を維持します。
- 「ミキサーを挟む」で、配置済み／新規ミキサー、入出力端子、L/Rペアの同時処理を選んで確定します。新しい入力ケーブルを3mで追加し、既存ケーブルの長さはミキサーから元の接続先への経路に引き継ぎます。内部ルーティング・PAN・OMNI OUTアサイン・共有入力切替等は実機で設定します。
- RCA、XLR、TS（シールド）、TRS、TRS–XLR、スピコン等に端子図・用途説明を追加しました。「シールド」は遮蔽構造の呼び名です。アナログのTRSバランス・モノラルと、PHONESのTRSステレオは別に扱います。
- DJM-V10はLINE/DIGITAL各6ch、PHONOはCH1/3/4/6。AES/EBU出力はアナログXLRと区別します。
- CDJ-2000 / CDJ-2000NXS / CDJ-2000NXS2を追加。音声RCA L/RとS/PDIF出力をモデル化し、旧機種として表示します。
- Genelec 8010A / 8020D / 8030C / 8040Bを追加。各モデルの公式写真を使い、XLRアナログ入力を1端子ずつ表示します。各1台はモノラルです。
- TRS→XLRとXLR→TRSのバランス・ラインケーブルに対応し、集計・保存にも個別形式を記録します。
- 「6DJ構成」でCDJ-2000NXS2×6、DJM-V10、Genelec 8030C×2の音声配線例を読み込めます。12本のアナログRCA入力と2本のXLR出力で14本。USB・PRO DJ LINKネットワークはこの例には含みません。↶で元の構成へ戻せます。

写真・仕様はPioneer DJ / AlphaThetaとGenelec公式製品ページを参照しています。画像は各製品のページへの出典リンクを備えます。ケーブル図は端子の形を説明する模式図で、製品の正確な寸法や外装を再現したものではありません。

## v0.5 ワークスペースと複数プロジェクト

- キャンバスは4,800×3,200。ライブラリと詳細は開閉式のドロワーに変更し、通常時も全画面幅を編集に使います。
- 「キャンバスを最大化」で上部のヘッダー類も隠します。「通常表示に戻す」で戻れます。
- 背景のドラッグ、Space＋ドラッグ、中ボタンドラッグ、移動ツールで表示位置を移動できます。ズームは10〜250%、全体表示は現在の機材・ブースの範囲に合わせます。
- 既存のブラウザ保存データは最初のプロジェクトとして引き継ぎます。
- 上部の一覧・選択欄から、複数のプロジェクトを作成・切り替え・複製・名前変更できます。空の構成、現在のコピー、通常デモ、6DJから新規作成できます。
- 機材、配線、グループ、キャンバスサイズ、ズームと表示位置をプロジェクト別に保存します。取り消し履歴もプロジェクト間で混ざりません。
- 削除はゴミ箱への移動です。一覧のゴミ箱から復元でき、完全削除機能は設けていません。
- 個別JSONの読み込みは現在の構成を上書きせず、新しいプロジェクトを作ります。全プロジェクトのJSON書き出し・読み込みにも対応し、取り込みは別IDで追加します。
- 保存先は同じオリジンのブラウザのlocalStorageです。サーバー・他の端末へ同期する機能はありません。別の端末へ移す場合はJSONを書き出してください。保存容量が不足した場合は保存未完了と表示し、プロジェクト切り替えを止めます。

検証: `node test-projects.cjs` で既存データ移行、独立保存、複製、名前変更、ゴミ箱と復元、保存失敗時のロールバック、再読み込み、バックアップ取り込み、別タブから追加されたプロジェクトの保持を確認できます。

## v0.6 配線を保つ機材交換

機材カードの「⇄ 機材を交換」または詳細の交換ボタンから、同種の別モデルへ交換できます。DJプレーヤー／オールインワンDJ、DJ・PAミキサー、パワードスピーカー、パッシブスピーカー、アンプを種類ごとに扱います。

使用中の端子だけを対象に、自動で対応表を作成します。方向・信号・端子規格・重複を確認し、同じ端子IDやL/R・出力用途を優先して最大数の対応付けを探します。対応表で手動変更もできます。未割当や重複がある場合は交換を確定できません。交換前は現在の配線に変更を加えず、確定時にまとめて反映します。

位置、所属ブース、機材ID、ケーブルID、接続相手とケーブル長を保持します。端子形状が変わる場合は必要なケーブル交換を表示し、対応するケーブル形式を集計に反映します。元の機種名を含む表示名は新機種名へ置き換え、それ以外のカスタム名は維持します。表示名は交換画面で編集できます。交換は通常の取り消しで戻せ、プロジェクト保存にも含まれます。

内部ルーティング、チャンネルの共有入力切替、PAN、出力のアサイン等は実機で設定する必要があります。単に物理端子の総数が多いだけでは交換可とせず、現在の接続と互換性のある端子が揃うことを条件にします。

`node test-replacement.cjs` で自動対応付け、6chから4chへの交換拒否、デジタル端子不足、重複・信号違い、ケーブル変更、THRU出力不足、未接続の交換、競合する端子への割り当てを確認できます。

## v0.7 — Video workspace

`?mode=audio` / `?mode=video` で共通UIを切り替えます。Videoは別のlocalStorageライブラリを使用し、既存音響プロジェクトを変更しません。公開リンクはアプリの共有であり、端末内プロジェクトのクラウド共有ではありません。

映像機材37種：ATEM 21機種（Mini 4、SDI 3、Television Studio 6、Constellation 8）、Micro Converter 3G / 12G各3方向、α6400、PXW-Z150、HERO12＋Media Mod、V-1HD、VR-4HD、汎用PC・モニター・プロジェクター・キャプチャー。

機種選定は接続済みNotion Stock Dataと配信機材シートに基づき、仕様と写真は公開メーカー資料を使用。HERO12の本体写真のみ東京カメラ機材レンタルを参照。個人メモ・在庫数量・見積価格・私用資料リンクは配布物に含めません。型番不明品は汎用ノード・模式図と明示し、仮定した端子と対応範囲を注記しています。

HDMI / Micro HDMI / SDI / USB映像の接続規格、端子重複、接続ごとの解像度・フレームレートを検証。HDMI-SDI間は変換器、HDMI-PC間はキャプチャーを必要とします。ケーブル詳細でフォーマットを設定。変換器のレート不一致・入力未接続・長距離HDMIは接続チェックで確認事項を表示します。

グループ移動、ズーム、ケーブル差し替え・削除・機材挿入、配線を維持した機材交換、Undo、JSON / CSV / SVG、複数プロジェクトを共用。初期版は1080p・2160pの対応サブセットを対象とし、8K Quad Link、アナログ映像、電源・制御・タリー・LAN・リファレンス・音声専用端子、HDCP/EDID検証・内部ルーティング・実信号のシミュレーションは対象外です。

検証：`node test-video.cjs`、既存3テスト、各JSの構文チェック。`test-ui.cjs`は別の開発用ディレクトリにlinkedomを用意し、`NODE_PATH=<node_modulesの絶対パス> node test-ui.cjs`で実行。実DOMイベントによる初期化、交換・Undo、ケーブル編集、図鑑、分類・ブランド検索、保存とモード分離を検証します。レイアウトはスタブであり、実ブラウザ表示を検証するものではありません。この更新ではブラウザ操作がWork設定で無効のため実画面QAは未実施です。
## v0.8 — Booth drops and trash

Audio / Video共通。機材の見出しをドラッグしてBoothへ重ねると、追加先の枠がハイライトされ、カードを囲む大きさにプレビューが広がります。ドロップで所属を確定し、枠の拡張を保存。ライブラリのカードもマウスで直接ドラッグ配置できます。クリック追加は従来どおりグループなしです。Booth外へのドロップで所属を解除し、別のBoothへドロップすると移籍します。枠は拡張を保持し、メンバー削除で勝手に縮小しません。

右下のゴミ箱はキャンバスの表示領域に固定。機材をドロップすると、その機材と接続ケーブルをまとめて削除し、1回のUndoで復元します。既存のBooth移動モードではメンバーをまとめて移動する操作を維持。個別機材を取り出す際はグループ移動モードを終了してください。

ドラッグ中の所属と枠は確定まで保存データを変更しません。Esc・ポインターキャンセル・ウインドウ離脱では移動をロールバック。開いたライブラリや詳細パネルの裏へのドロップは配置せず中止。ズーム・スクロール後の座標、重なったBoothの選択、右下ゴミ箱へのドロップ、配線を含むUndo、ライブラリからの追加・クリック抑止、保存・再読込をDOM統合テストで検証しています。実ブラウザのレイアウト・ポインターキャプチャーはWork設定でブラウザ操作が無効のため未確認です。

## v0.9 — One Audio + Video canvas

音響と映像を統合し、上部の「音響」「映像」ボタンを表示レイヤーのON/OFFに変更。非表示でも機材・配線は削除しません。両方の信号を扱うスイッチャー等は、表示中レイヤーの端子を表示します。旧`?mode=audio` / `?mode=video` URLも同じプロジェクトライブラリを開きます。ケーブルリストとCSVは全接続を対象にします。

保存先は`patchflow-av-project-library-v1`。初回起動時に旧音響・旧映像のライブラリとゴミ箱をコピーし、ID衝突を防止して移行します。元キーは読み取りのみで維持。移行後は統合先へ保存。プロジェクト一覧の「キャンバスへ追加」で別プロジェクトの機材・ブース・配線をID変更して横に配置でき、元プロジェクトは維持します。追加は1回のUndoで戻せます。

計75機種。新規10機種：DDJ-FLX4、RØDE Wireless GO II / Wireless PRO / Wireless ME / VideoMic GO II、Shure SM58、Sony FX30＋XLRハンドル / FX3＋XLRハンドル / FX2ボディ / FX6。公式製品写真を使用（FX30写真はボディ）。ワイヤレスマイクは送受信機をまとめたシステムノードで、電波区間とラベリア入力は対象外。VideoMic GO IIはUSB使用時に3.5mm端子が監視用になるため同時録音出力を防止します。

ATEM / Rolandのスイッチャーに、実機別のXLR・コンボ・TRS・RCA・3.5mm音声入力と出力を追加。独立LINE出力がない機種ではその旨を明示し、HDMI / SDI / USB映像に重畳する音声のチャンネル数・48kHz情報を詳細に表示。内部ミックス・AFV・MIC/LINE切替・ゲインは実機設定で、実音量・実信号は検出しません。MADI・トークバック・タリー・電源等は対象外。

3.5mmステレオMIC/LINE信号と6.35mmバランスTRSを分離。RCA→TSはモノラルごとの変換ケーブルとして対応（L/Rは各1本）。USB音声はPCのUSB MEDIA入力へ接続でき、同じ物理USB入力の二重使用は不可。ステレオミニをモノラルコンボへ直接接続する等の不適切な結線は防止します。

グループの「ドラッグして移動」表示を削除し、辺・角8箇所からサイズ変更に対応。メンバーの位置は動かさず、機材を囲う最小範囲とキャンバス境界で制限。Undo / Esc中止に対応。従来のBooth自動拡張・機材ドロップ・右下ゴミ箱も維持。

ライブラリはグリッド / テーブルを切り替え、どちらも種類・ブランド・検索・クリック追加・ドラッグ配置に対応。表示形式はブラウザに保存します。

追加検証：`NODE_PATH=<linkedomを含むnode_modules> node test-av-ui.cjs`。実際の全スクリプトをDOMにロードし、表示レイヤー、音声・映像間の接続、信号レベル制約、USB音声、スイッチャー仕様、75機種の画像、ライブラリ表示、旧データとゴミ箱の移行、保存失敗、URL間の同一状態、プロジェクト重ね合わせ、リサイズ・キャンセル・Undoを検証。既存4ルールテストと旧画面の互換性テストも通過。実ブラウザ表示・ドラッグ操作は設定でブラウザ操作が無効のため未確認です。


## v0.10 — PANDA rental additions

13機種を追加、合計88機種。種類別・ブランド別、グリッド・テーブル、機材交換、プロジェクト保存は既存の共通キャンバスを使用します。

| 種類 | 追加機種 | PANDA掲載の参照先 |
| --- | --- | --- |
| HDMI分配器 | ELECOM VSP-HD14BK（1入力4出力、4K30p） | https://panda-times.com/archives/41332 |
| Roland | V-8HD / V-80HD / V-160HD / VR-120HD | https://panda-times.com/archives/73591 ・ https://panda-times.com/archives/43612 ・ https://panda-times.com/archives/2114 ・ https://panda-times.com/archives/43534 |
| Canon PTZ・操作盤 | CR-N500 / RC-IP100 | https://panda-times.com/archives/2578 |
| Sony PTZ・操作盤 | BRC-X1000 / RM-IP500 | https://panda-times.com/archives/70204 |
| Panasonic PTZ・操作盤 | AW-HE50SN / AW-RP50N | https://panda-times.com/archives/48597 |
| JVC PTZ・操作盤 | KY-PZ400NB / RM-LP100 | https://panda-times.com/archives/2578 |

2026-11-06に公開掲載を確認。レンタル本体サイトは403を返すため、公式PANDA TIMESの公開掲載を参照。現在の予約在庫は取得していません。仕様は各モデルのメーカーリンクで確認し、PANDA記事の説明だけから端子仕様を生成していません。

PTZ用LANは独立した制御信号（RJ45図解付き）。Canon XC / Sony VISCA over IP / Panasonic AW-IP / JVC IPを区別し、異なる規格の操作盤との接続と映像・音声端子への接続を拒否します。制御コマンドの方向を操作盤→カメラとして表現し、両者のLANは各1物理端子です。現在は直結1対1のIP制御を対象とし、複数台制御用ネットワークスイッチ、NDI/IP映像、PoE給電、シリアル、タリー、同期は対象外です。PTZと操作盤は映像レイヤーに属します。

V-8HDはUSB映像出力なし。V-80HDはHDMI IN 3/4 THRUを個別端子で再現し4K信号にも対応、PGM出力はHD。VR-120HDはHDMI6+SDI6の独立12入力。音声のRCA・コンボ・XLR出力・ヘッドホンもモデル別に収録。システム周波数や内部ルーティングは実機で設定。PC解像度・SD・RAW等は未収録です。

AW-HE50SNはSDIモデルで1080i/720p。HDMIや1080pを追加していません。BRC-X1000はHDMI1、SDI LINE2・MONITOR2を収録し、SDIはHD単線モードのみ。CR-N500のHDMI/SDI同一フォーマット条件、分配器・THRUの入力欠落と前後形式不一致は接続チェックで警告します。EDID・HDCP・実機の内部設定はシミュレーション対象外です。

実機写真：Roland・Canon・Sony・Panasonicはメーカー公開写真。Canon・Sonyの写真は黒白のカラーバリエーションを含み、1ノードは1台です。ELECOMはメディア・リースの同型番写真、JVCカメラはフジヤカメラ、操作盤はBroadcastEuropeの同型番写真を参照。写真出典は `rental-photo-sources.json`。生成した機材画像は使用していません。

追加検証：`NODE_PATH=<linkedomを含むnode_modules> node test-rental-ui.cjs`。13機種の写真ファイル、4規格のPTZ接続・規格不一致、映像レイヤー、端子数、12系統入力、分配器とTHRU警告、RJ45図解、保存検証を確認。既存テストも実行。DOMのレイアウトはスタブのため、実ブラウザ表示と実ドラッグ操作は未確認です。


## v0.11 — Generic audio and MG16/6FX

3機材を追加して91機種。汎用XLRマイク（モノラルMIC出力1端子）、汎用オーディオインターフェース（MIC/LINEコンボ2入力・TRS LINE L/R出力・PHONES・USB-C録音出力）、YAMAHA MG16/6 FX。汎用2機材は特定の製品を表さないSVGイラストとして明示しています。インターフェースは「オーディオインターフェース」種類、「汎用」ブランドで検索できます。USBは録音方向のみモデル化し、PC→インターフェースの再生は対象外です。RCAのREC OUTからはRCA→TSを2本使い、PCのUSB MEDIAへ接続します。

MG16/6FXはMG16XUと別モデル。メーカーの取扱説明書（https://usa.yamaha.com/files/download/other_assets/2/324662/MG16_6FXE.pdf）で確認。MIC XLR10、LINE TRS8、ステレオLINE TS8、ステレオRCA4、RETURN TS2、2TR IN RCA2の計34入力物理ジャック。ST OUT XLR/TRS各L/R、GROUP4、AUX2、EFFECT SEND1、C-R L/R、REC RCA L/R、PHONESの計16出力。INSERT8とFOOT SWITCH1は参照専用で、USB端子はありません。同一CHのMICとLINE、ステレオCHの代替入力（MIC/TS、TS/RCA）は接続時・JSON読込み・機材交換・接続チェックで同時使用を拒否し、同じステレオTSペアのL/Rは許可します。ファンタム・ゲイン・内部バスの割当ては実機で設定してください。

MG写真はYamaha公開ニュース（https://usa.yamaha.com/news_events/2003/20030709_mixing-gets-personal-with-the-mg-series-analog-mixers_us.html）の実機写真を使用。スペースのない「MG16/6FX」でも検索できます。

検証：`test-audio-additions.cjs`で経路全体の接続・USB信号・二重入力・保存再読込み・マイク交換を検証。既存7テストも通過。実ブラウザのローカルプレビューでも4機材を配置・ドラッグし、マイク→MG16/6FX→REC L/R→汎用インターフェース→配信PCの4本を接続、接続チェックとページ再読込みによる保存復元を確認しました。


## v0.12 — PC USB input and portable speakers

既存2種類のPC（配信PC・スライド/上映PC）の両方に、USB音声/映像ホスト入力×2を表示。端子ID `uvc1` / `uvc2` は維持し、保存済みの配線を保持します。音響のみ表示でもPCのUSB入力とUSB音声のケーブルを表示し、インターフェース、USBマイク、UVC機器を接続可能。同一物理端子への二重接続は拒否。実機の端子数・USB形状・ドライバーは別途確認してください。

3機種を追加し計94機種：

- JVC PE-W50CDB：ハンドマイク向けポータブルPAの仮選定として追加。「ポータブルPA / ハンドマイク」カテゴリ。有線MICは6.3mmバランスTRS×1、外部入力RCA L/R、モノラル音声のRCA出力×2。ワイヤレスマイクは別売WT-U85/WT-UD84と対応800MHz帯マイク（例：WM-P970）が必要で、初期同梱品とは扱いません。無線区間はモデル化対象外。USB-AはMP3メモリー再生専用でPCのUSBホストへ接続不可。XLRマイク→TRSマイク入力の専用変換ケーブルを図鑑と接続判定に追加。
- Bose L1 Compact：パワード。XLR MIC×1、6.35mm TRS LINE×1、ステレオ3.5mm×1、RCA入力L/R、TRS LINE出力×1、RCA録音出力×2。CH2入力は共有音量。1台はモノラル運用で、外部パワーアンプ出力を接続不可。
- Bose Panaray 802 Series III：最初の参考図に合わせたSeries IIIを収録。NL4×2は内部並列。8Ω・パワーアンプ必須。ライン出力からの直結や別アンプでの二重駆動は拒否し、1アンプCH→1台のみ対応。802 III用のアクティブEQ/プロセッサー設定は接続チェックで確認事項として表示し、DSPの設定値自体はシミュレーションしません。

資料・写真：

- JVCメーカー取扱説明書：https://www32.jvckenwood.com/jvc/system/pro-dl/fls_dl/mn/B5A-1300-00.pdf
- JVC公式写真：https://www32.jvckenwood.com/jvc/system/pro-dl/fls_dl/lphoto/pe-w50cdb_03.png （オプション装着例）
- Bose L1 Compact メーカー技術資料・抽出した製品写真：https://assets.boseprofessional.com/m/7278645094b2288c/original/tds_l1_compact_en.pdf
- Bose作成802 III技術資料の保存版：https://device.report/m/612855121de0d95c6de76228ff51c7372cb8babba33afda0c30c7e55eef36da6
- 802 III同型番写真：https://www.audiocity2u.com/Speaker/Bose/BOSE-802-Series-III.html

検証：`test-portable-audio.cjs`で2種類のPCへのUSB音声、音響表示時の端子・ケーブル、共用ポート占有、旧UVC接続、保存再読込、JVCマイク変換とUSBメモリー端子、L1/802の信号分離、アンプ経路とEQリマインダーを検証。既存8テストも通過。ローカル実ブラウザで音響のみ表示、JVC追加、Bose一覧表示、USB配線を維持した配信PC→上映PC交換と接続チェックを確認。


## v0.13 — Reconnect an occupied output from the canvas

A9 MASTER 1 Lなどの接続済み出力を押したとき、ケーブル選択だけで止まっていたため、新しい入力へ接続できないように見えていました。出力を押すと、その既存ケーブルの接続先を選び直す状態へ直接移行するように変更。現在の接続先を通知し、元のケーブルは有効な入力で確定するまで維持します。IDと長さを保ち、ケーブル種別は新しい入力に合わせて再判定。中止、Esc、同じ出力の再クリックで元の配線を保持し、確定後はUndoで復元できます。接続済み入力のクリックとケーブル自体のクリックは従来どおり選択操作です。

物理端子1個に2本のケーブルを挿す扱いにはしていません。MIC専用入力にLINE出力をつなごうとした場合は、MIC/LINE対応入力やXLR→TRSで接続するLINEフォーン入力を案内します。接続済み出力のツールチップにも差し替え操作を表示。

追加検証：`test-connected-output.cjs`でA9 MASTER 1 L→DBR12の既存接続からMG16XUコンボ入力へのXLR差し替え、MG16/6FX LINEへのXLR→TRS、MIC入力の拒否と元経路保持、中止/同じ出力再クリック/Esc、Undo、長さ・ID・保存再読込みを検証。既存9テストも実行。実ブラウザの隔離したローカルプロジェクトで、A9→DBRからA9→MG16XUへ差し替え、Undoと中止、MG16XU→DBRのXLR接続と接続チェックを確認。


## v0.14 — A9 to MG16/6FX XLR input

MG16/6FXのMIC XLR入力でLINE信号を一律拒否していた判定を修正。減衰・ゲイン調整を前提とするXLR接続を許可し、接続時、ケーブル詳細、接続チェックにレベル確認を表示します。入力はMICプリアンプのまま扱い、GAIN最小時の最大入力をCH1–8で+4 dBu、CH9/10・11/12で−10 dBuと区別。PHANTOM OFF、接続元の出力を下げるか外部PADを使うこと、PEAK確認を案内します。通常のLINE TRS入力（+30 dBu）と同一視しません。CH内のMIC/LINE同時使用拒否、他機種のMIC専用入力へのLINE拒否は維持。配信スクリプトには版番号を付け、更新前の端子定義がブラウザキャッシュに残ることも防ぎます。

検証：test-a9-mg166fx.cjsで実モデルA9 MASTER 1 L/R→MG16/6FX CH1/CH2 MIC XLR、既存配線の差し替え、XLR種別・ID・長さ保持、MG→PA、共有入力、マイク入力維持、スピーカーレベル拒否、レベル警告、保存再読込みを確認。


## v0.15 — Behringer U-PHORIA UMC202HD

95機種。オーディオインターフェースにUMC202HDを追加。メーカー公式の実機写真、XLR/6.35mmコンボ入力×2、バランスTRS出力1(L)/2(R)、6.35mm PHONES、2ch USB-B録音出力を収録。USB-BはPCへの録音方向を表し、同じ端子のPC再生方向は現行アプリの対象外。LINE信号はフォーン側/LINE設定、PAD・+48V・内部モニターは実機で確認。MIDI/RCA/INSERTは存在しないため追加しません。種類/ブランド別グリッド・テーブル、既存インターフェースからの配線維持交換、USBでPCへの接続に対応。

仕様・画像: https://behringer.com/en/products/0805-AAR
メーカー日本語説明書: https://cdn-media.empowertribe.com/b826c4bb637149c39debfaae74c38dd9/QSG_BE_0805-AAR_U-PHORIA-Series_JP.pdf


## v0.16 — 汎用レコーダーと閲覧リンク

- 種類「レコーダー」に汎用LINE録音モデルを追加（計96機種）。L/R各1個の6.35mm TRS入力、TRS・TSシールドに対応。MIC/スピーカーレベルは拒否。USBや出力端子は実機依存なので仮定せず、汎用イラストを使用。
- ヘッダーの「閲覧リンク」から、現在表示中の配線図・ケーブル一覧を共有。ログイン不要のview.htmlは独立した閲覧専用ページで、編集コードもローカル保存処理も読み込みません。ズーム、パン、ケーブル一覧切替に対応。音響/映像の非表示レイヤーや別プロジェクトは含めません。
- 作成時点のスナップショットをURLフラグメントに圧縮して格納。リンクを知る人が閲覧でき、編集後はリンク再作成が必要です。ライブ同期、失効、パスワード設定はありません。ブラウザ/メッセンジャーにより長いリンクの取り扱いが異なるため、通常規模の構成向け。大きすぎる構成は作成時に案内します。
- コピー失敗時は選択済みURLの手動コピーに対応。閲覧データのサイズ・構造・端子参照を検証し、画像は同サイトのassetsのみ、文字列はエスケープして表示。

検証: test-sharing.cjsでTRS/TS録音入力、MIC/アンプ信号拒否、圧縮/非圧縮URLでの日本語往復、他プロジェクト除外・ストレージ非変更、閲覧用マークアップ、改ざんデータ拒否、保存再読込を確認。実ブラウザでUMC202HD→レコーダーL/RのTRS接続、リンク作成、別タブの閲覧画面、ズーム、ケーブル一覧を確認。

全ソース・画像・テスト・ドキュメントは、このSiteに紐づくGitリポジトリへまとめてpushします。ブラウザ内の個人プロジェクト、ローカル作業中のPDF/スクリーンショットや認証情報はソースには含めません。


## v0.17 — iPad workspace

iPadの縦横表示向けにヘッダー/ツールバーを折り返し、操作列だけ横スクロール、機材一覧・詳細は可変幅の引き出しに調整。動的ビューポートとセーフエリア、画面回転後のパネル上端、スクロール可能なケーブル表・ダイアログに対応。タッチ環境では44pxの主要操作と大きめの端子を使用。キャンバスは2本指でピンチ・移動し、開始前の機材/ブース移動はキャンセルして誤変更を防止。ピンチ後の意図しないタップ接続も抑止。マウス/キーボード操作は維持。


## v0.18 — 自動整理・テーマ・画像/PDF・プロジェクト共有

- 「自動整理」でブースの所属と配線を維持し、信号の流れに沿って配置。循環をまとめ、重なりを避けて並べ、Undoに対応。
- ライト/ダークを切替。表示テーマをPNG/PDF/SVGと閲覧画面へ反映。PNGは最大4096px/1600万画素以内、PDFは機材写真と日本語を含めA3の1ページに配置する画像PDFです。
- 「閲覧リンク」はプロジェクト専用の固定URL。編集内容は共有保存先に自動保存し、同じURLをリロードすると最新の構成を表示。古いスナップショットURLも引き続き読めます。
- 「編集リンク」を知る人はログインなしで同時編集。約2秒間隔の差分同期、機材/配線/ブースの項目単位の統合、同じ項目は後着優先。別の端子への同時配線が物理端子を重複使用すると同期エラーを表示し、その未同期操作は取り消して解消できます。共有中はリモート更新を受けた時点で古いUndo履歴をクリア。ポインターで機材移動中のリモート反映は待機。
- 閲覧URLのランダムなプロジェクトIDは閲覧権限。編集には別の256bitトークンが必要で、保存先にはSHA-256ハッシュのみ保存。編集リンクを知る人は全編集が可能なので、閲覧だけの相手には閲覧リンクを送ってください。ログイン・アカウント管理・リンク失効UIは未実装。
- 編集元はブラウザにも自動保存。共有作成後はD1にも差分を保存し、再読み込み/再接続時に保存先を復元。プロジェクト切り替え時は共有セッションを切り替え、無関係な構成を送信しません。

GitHub Pagesは静的フロントエンド。共有APIは既存SitesのWorker+D1を使用し、API以外の旧URLはGitHub Pagesの同じアプリを配信。D1マイグレーションはdrizzle/。開発では npm install / npm run db:generate / npm run build:collab。APIテストは Node 24のnode:sqliteを使用。

## v1.0 — Studio UI and collaborative presence

- Neutral warm gray / charcoal surfaces, orange action colour, a single SVG icon set, revised type hierarchy, concise equipment rows, and two-column photo cards. Desktop/tablet toolbars keep diagram actions visible; templates and file tools live in the project menu. Light/dark appearance carries through the viewer and PNG/PDF/SVG output.
- The library has a sticky search/filter/view header and an explicit, always-reachable close icon. Type/brand filters, grouping order, grid/table views, reset filters and Escape remain available. A command palette (⌘/Ctrl+K) provides searchable actions; F fits the diagram, A toggles equipment, I toggles details, V/H choose select/pan.
- Canvas padding permits visual centring even when equipment sits at world coordinates near zero. Startup, project changes and automatic arrangement centre the content; fitting also respects an open library/details drawer. Zoom and two-finger gestures preserve the point underneath the gesture. Old camera snapshots are refitted once, then saved with camera version 2. Opening/closing a drawer keeps the same work area in view.
- Editing rooms show participant avatars, editable display names, coloured cursors and remote selections for equipment, cables, booths and pending ports. Avatar buttons move to a collaborator’s work area. Presence is separate from document data/Undo and expires after 16 seconds without heartbeat; leaving/hiding a tab removes it immediately when network is available. Cursor updates are throttled (~350ms during pointer activity, 1s heartbeat). Foreground network and browser scheduling determine latency.
- Presence uses an authenticated D1 endpoint and an indexed ephemeral table. Read-only project URLs cannot access editor presence. Expired room presence is pruned on heartbeat; tokens remain hashed in the rooms table. Project changes continue using the existing field-diff merge and autosave. Remote render is deferred during active typing or a connection gesture so it cannot replace an active text field.
- Local QA: `npm run preview` on Node 24 serves the real Worker against an isolated in-memory SQLite database at http://127.0.0.1:4173. Restarting discards local test rooms. The production app continues using the Sites Worker+D1 backend.

Validation includes the existing equipment/connection/migration/sharing tests, authenticated presence/expiry/leave and document revision isolation in `test-collaboration.cjs`, and origin-centred fit, zoom anchoring, library close and command search in `test-studio.cjs`.

## v1.1 — Cable lengths, comments and serial extensions

Select a cable, its length badge or an inline junction to edit lengths and per-segment comments directly on the canvas. Each edit autosaves. “＋ 延長” appends a 3m segment whose length/comment can be changed; extensions can be removed and restored with Undo. Length badges appear above each section, with junction markers placed proportionally along the route. Comments are available from the badge tooltip and the cable list.

The connection continues to occupy one physical input/output pair. `edge.length` is the total route length; optional `edge.segments` stores 1–12 serial cable lengths and comments (120 characters each). Old files without segments remain single cables. Lengths must be positive and the total at most 1000m. The list, counts and CSV enumerate separate physical segments, including comments and route total. Adapter routes retain the adapter as the first segment and use the destination-side connector family for later segments. This is a wiring plan; select actual inline connectors/transport hardware for the equipment in use.

JSON autosave/import, room autosave, live read-only links, replacement/reconnection, and SVG/PNG/PDF output retain the lengths and comments. Server and viewer validation reject invalid segment metadata or inconsistent totals. The current camera centre format is also accepted on JSON reload. Existing legacy snapshot links continue to work.

Validation: `test-cable-extensions.cjs` covers editing, extension removal/Undo, physical counts, unchanged endpoint occupancy, invalid input, escaping, route geometry, snapshot/export markup and saved reload. `test-collaboration.cjs` covers persisted extended routes and public read projection, live updates and invalid extension data.
