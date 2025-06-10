function connect() {
	let ws = new WebSocket("wss://api.p2pquake.net/v2/ws");
	ws.onopen = e => { document.getElementById("status").innerHTML = "接続されています"; retrycnt = 0; }
	ws.onmessage = e => {
		let J = JSON.parse(e.data); console.log(J);
		document.getElementById("updateTime").innerHTML = J.time; //受信日時
		document.getElementById("code").innerHTML = J.code; //情報コード
		J.code == 556 && !J.test && (J.cancelled ? cancel() : announce(J)); //コード556(EEW警報)かつtest(訓練報)ではない
	}
	ws.onclose = e => { //切断されたら再接続
		retrycnt < 5 ? (document.getElementById("status").innerHTML = '<span style="color:#F60;">切断されました。5秒後に再接続します。</span>', retrycnt++, setTimeout(connect, 5e3))
			: document.getElementById("status").innerHTML = '<span style="color:#F20;">再接続に5回連続で失敗しました。手動でページ再読込して下さい。(接続先のサーバダウンの可能性があります)</span>';
		console.error(e);
	}
	ws.onerror = e => { document.getElementById("status").innerHTML = '<span style="color:#F20;">接続エラーが発生しました。手動でページ再読込して下さい。(接続先に問題がある可能性があります)</span>'; console.error(e); }
}
import { applyColors } from "./settings.js"; let timeoutID, retrycnt = 0; connect();
function announce(J) { //緊急地震速報発表
	timeoutID && clearTimeout(timeoutID); //setTimeoutをクリア(続報と、取消からの新規受信時)
	applyColors({
		"#EEWTitle": [{ name: "タイトルの背景色(発表時)", prop: "background-color", val: document.getElementById("announce-title-bgcolor").value }, { name: "タイトルの文字色(発表時)", prop: "color", val: document.getElementById("announce-title-txtcolor").value }],
		"main": [{ name: "メインの背景色(発表時)", prop: "background-color", val: document.getElementById("announce-main-bgcolor").value }],
		"#EEWhypocenter": [{ name: "震源地名の文字色", prop: "color", val: document.getElementById("announce-hypocenter-txtcolor").value }],
		"#EEWarea": [{ name: "発表地域の文字色", prop: "color", val: document.getElementById("announce-area-txtcolor").value }]
	});
	document.getElementById("EEWTitle").innerHTML = document.getElementById("announce-title-txt").value;
	document.getElementById("EEWhypocenter").innerHTML = J.earthquake.hypocenter.reduceName + "で地震　強い揺れに警戒";
	let PREFS = []; //府県予報区
	for (const a of J.areas) PREFS.includes(a.pref) || PREFS.push(a.pref);
	document.getElementById("EEWarea").innerHTML = ""; //発表地域表示を一旦全消去
	for (const a of PREFS.length >= 8 ? grouping(PREFS) : PREFS) document.getElementById("EEWarea").innerHTML += "<span>" + a + "　</span>"; //発表地域表示(8予報区以上の場合地方にまとめる)
	timeoutID = J.earthquake.hypocenter.magnitude >= 5.0 ? setTimeout(gb, J.earthquake.hypocenter.magnitude * 2e4) : setTimeout(gb, 1e5) //予想マグニチュード * 20秒間表示。ただしM5.0未満の場合は100秒
}
function grouping(PREFS) { //広範囲に発表された場合地方ごとにまとめる
	const AREAS = [
		{ 地方名: "北海道", 府県予報区: ["北海道道央", "北海道道南", "北海道道北", "北海道道東"] },
		{ 地方名: "東北", 府県予報区: ["青森", "岩手", "宮城", "秋田", "山形", "福島"] },
		{ 地方名: "関東", 府県予報区: ["茨城", "栃木", "群馬", "埼玉", "千葉", "東京", "神奈川"] },
		{ 地方名: "伊豆諸島", 府県予報区: ["伊豆大島", "新島", "神津島", "三宅島", "八丈島"] },
		{ 地方名: "小笠原", 府県予報区: ["小笠原"] },
		{ 地方名: "新潟", 府県予報区: ["新潟"] },
		{ 地方名: "北陸", 府県予報区: ["富山", "石川", "福井"] },
		{ 地方名: "甲信", 府県予報区: ["山梨", "長野"] },
		{ 地方名: "東海", 府県予報区: ["岐阜", "静岡", "愛知", "三重"] },
		{ 地方名: "近畿", 府県予報区: ["滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山"] },
		{ 地方名: "中国", 府県予報区: ["鳥取", "島根", "岡山", "広島", "山口"] },
		{ 地方名: "四国", 府県予報区: ["徳島", "香川", "愛媛", "高知"] },
		{ 地方名: "九州", 府県予報区: ["福岡", "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島"] },
		{ 地方名: "奄美", 府県予報区: ["奄美群島"] },
		{ 地方名: "沖縄", 府県予報区: ["沖縄本島", "大東島", "宮古島", "八重山"] }
	]; let prefcnt = new Array(AREAS.length).fill(0), //地方ごとに何県発表されているかカウント
		areacnt = 0; //発表された地方数
	for (const p of PREFS) for (let a = 0; a < AREAS.length; a++)
		if (AREAS[a].府県予報区.includes(p)) { //検索対象の府県予報区と地方が一致
			prefcnt[a] == 0 && areacnt++; //地方数カウント
			prefcnt[a]++; break //地方ごとの県数カウント
		}
	let disp = []; //表示する地域名
	if (areacnt >= 4) { //4地方以上に発表された場合
		for (const p of PREFS) for (let a = 0; a < AREAS.length; a++)
			if (AREAS[a].府県予報区.includes(p)) {
				(prefcnt[a] >= 2 || prefcnt[a] >= AREAS[a].府県予報区.length) && !disp.includes(AREAS[a].地方名) ? disp.push(AREAS[a].地方名) //その地方で2予報区以上(2以下の地方は全て)発表され、dispにその地方名がなければpush
					: prefcnt[a] == 1 && prefcnt[a] < AREAS[a].府県予報区.length && disp.push(p); break //その地方で1予報区のみ発表されているときは府県予報区をpush
			}
	} else for (const p of PREFS) for (let a = 0; a < AREAS.length; a++) //3地方以下に発表された場合
		if (AREAS[a].府県予報区.includes(p)) {
			(prefcnt[a] >= 3 || prefcnt[a] >= AREAS[a].府県予報区.length) && !disp.includes(AREAS[a].地方名) ? disp.push(AREAS[a].地方名) //その地方で3予報区以上(3以下の地方は全て)発表され、dispにその地方名がなければpush
				: prefcnt[a] <= 2 && prefcnt[a] < AREAS[a].府県予報区.length && disp.push(p); break //その地方で2予報区以下に発表されているときは府県予報区をpush
		}
	return disp
}
function cancel() { //緊急地震速報取消
	timeoutID && clearTimeout(timeoutID); //キャンセル報でないときのsetTimeoutをクリア
	applyColors({
		"#EEWTitle": [{ name: "タイトルの背景色(キャンセル報)", prop: "background-color", val: document.getElementById("cancel-title-bgcolor").value }, { name: "タイトルの文字色(キャンセル報)", prop: "color", val: document.getElementById("cancel-title-txtcolor").value }],
		"main": [{ name: "メインの背景色(キャンセル報)", prop: "background-color", val: document.getElementById("cancel-main-bgcolor").value }],
		"#EEWarea": [{ name: "取消メッセージの文字色", prop: "color", val: document.getElementById("cancel-area-txtcolor").value }]
	});
	document.getElementById("EEWTitle").innerHTML = document.getElementById("cancel-title-txt").value;
	document.getElementById("EEWhypocenter").innerHTML = "　"; //震源情報非表示
	document.getElementById("EEWarea").innerHTML = document.getElementById("cancel-area-txt").value;
	timeoutID = setTimeout(gb, document.getElementById("cancel-gb-timeout").value * 1e3)
}
function gb() { //表示時間終了後にグリーンバックにする
	for (const e of ["#EEWTitle", "main", "#EEWhypocenter", "#EEWarea"])
		e != "main" && (document.querySelector(e).innerHTML = "　"), //文字を消す
			document.querySelector(e).removeAttribute("style"); //style属性を消し、CSS指定の緑色にする
	timeoutID = null //timeoutIDの値をクリア
}