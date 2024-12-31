function updateClock(shift){
	let st = performance.now(),
	now = new Date(Date.now() + shift), //引数で受け取ったズレ(ミリ秒)を足して現在時刻を求める
	dif = new Date(2025, 0, 1, 0, 0, 0) - now + 900; //2025-01-01 0:00:00との時間差を計算
	dif < 0 && (document.getElementById("sinceuntil").innerHTML = `<span style="color:#F00;">あけましておめでとうございます</span><br>2025年開始から`, dif = -1 * dif + 1e3); //年明け後はカウントアップ
	let time = [now.getFullYear(), now.getMonth()+1, now.getDate(), ["日", "月", "火", "水", "木", "金", "土"][now.getDay()], now.getHours(), now.getMinutes(), now.getSeconds()], //[年, 月, 日, 曜日, 時, 分, 秒]
	remain = [Math.floor(dif / 1e3 / 60 / 60), Math.floor(dif / 1e3 / 60) % 60, Math.floor(dif / 1e3) % 60]; //残り時間計算 [時間, 分, 秒]
	document.getElementById("date").innerHTML = `${time[0]}年${time[1]}月${time[2]}日 (${time[3]})`; //日付書換
	document.getElementById("time").innerHTML = `${time[4]}:${time[5].toString().padStart(2, '0')}:${time[6].toString().padStart(2, '0')}`; //時刻書換
	document.getElementById("timer").innerHTML = `${remain[0]}:${remain[1].toString().padStart(2, '0')}:${remain[2].toString().padStart(2, '0')}`; //タイマー書換
	document.getElementById("exec-time").innerHTML = `${(Math.round((performance.now() - st) * 10) / 1e4).toFixed(4)}`; //処理時間を100μs単位で求め、秒単位で表示
	setTimeout(updateClock, 1e3 - (Date.now() + shift) % 1e3, shift); //秒が変わるタイミングで正確に表示
}
fetch('https://worldtimeapi.org/api/timezone/Asia/Tokyo').then(r=>{
	if(!r.ok)throw Error(r.statusText); //エラー処理
	return r.json() //World Time APIからの時刻取得
}).then(d=>{
	let s = new Date(d.datetime) - new Date(); //端末時刻とのズレを計算
	document.getElementById("clock-src").innerHTML = `時刻情報取得先：World Time API`; //取得元表示
	s > 0 ? (document.getElementById("clock-shift").innerHTML = `時差：端末の時刻は${(s / 1e3).toFixed(3)}秒遅れています`)
	: s < 0 && (document.getElementById("clock-shift").innerHTML = `時差：端末の時刻は${(-1 * s / 1e3).toFixed(3)}秒進んでいます`);
	updateClock(s); //ズレを補正して時刻表示
}).catch(e=>(document.getElementById("clock-src").innerHTML = `時刻情報取得先：端末`, updateClock(0))); //取得失敗時は端末の時刻を使う