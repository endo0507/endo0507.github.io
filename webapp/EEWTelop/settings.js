function sampleselector() { //ラジオボタンの選択に応じて表示サンプル切替
	switch (document.querySelector("form").sampleselect.value) {
		case "announce": sampleannounce(); break;
		case "cancel": samplecancel()
	}
}
sampleselector();
document.getElementById("apply").addEventListener("click", sampleselector); //適用ボタンイベント
for (const e of document.querySelectorAll('[name="sampleselect"]')) e.addEventListener("change", sampleselector); //サンプル選択ラジオボタンイベント
export async function applyColors(colors) {
	for (const e in colors) for (const s of colors[e])
		/^#([0-9A-F]{3}){1,2}$/i.test(s.val) ? document.querySelector(e).style.setProperty(s.prop, s.val)
			: alert(s.name + '　の色設定が正しくありません。\n半角で、"#"に続けて16進数カラーコードを入力して下さい')
}
function sampleannounce() { //発表サンプル
	applyColors({
		"#sample-EEWTitle": [{ name: "タイトルの背景色(発表時)", prop: "background-color", val: document.getElementById("announce-title-bgcolor").value }, { name: "タイトルの文字色(発表時)", prop: "color", val: document.getElementById("announce-title-txtcolor").value }],
		"#sample-main": [{ name: "メインの背景色(発表時)", prop: "background-color", val: document.getElementById("announce-main-bgcolor").value }],
		"#sample-EEWhypocenter": [{ name: "震源地名の文字色", prop: "color", val: document.getElementById("announce-hypocenter-txtcolor").value }],
		"#sample-EEWarea": [{ name: "発表地域の文字色", prop: "color", val: document.getElementById("announce-area-txtcolor").value }]
	});
	document.getElementById("sample-EEWTitle").innerHTML = document.getElementById("announce-title-txt").value;
	document.getElementById("sample-EEWhypocenter").innerHTML = "能登半島沖で地震　強い揺れに警戒";
	document.getElementById("sample-EEWarea").innerHTML = ""; //発表地域表示を一旦全消去
	for (const a of ["北陸", "新潟", "甲信", "東北", "関東", "東海", "近畿"]) document.getElementById("sample-EEWarea").innerHTML += "<span>" + a + "　</span>"
}
function samplecancel() { //取消サンプル
	applyColors({
		"#sample-EEWTitle": [{ name: "タイトルの背景色(キャンセル報)", prop: "background-color", val: document.getElementById("cancel-title-bgcolor").value }, { name: "タイトルの文字色(キャンセル報)", prop: "color", val: document.getElementById("cancel-title-txtcolor").value }],
		"#sample-main": [{ name: "メインの背景色(キャンセル報)", prop: "background-color", val: document.getElementById("cancel-main-bgcolor").value }],
		"#sample-EEWarea": [{ name: "取消メッセージの文字色", prop: "color", val: document.getElementById("cancel-area-txtcolor").value }]
	});
	document.getElementById("sample-EEWTitle").innerHTML = document.getElementById("cancel-title-txt").value;
	document.getElementById("sample-EEWhypocenter").innerHTML = "　"; //震源地名非表示
	document.getElementById("sample-EEWarea").innerHTML = document.getElementById("cancel-area-txt").value
}