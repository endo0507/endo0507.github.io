function updateClock(shift){
	const start = performance.now();
	let now = new Date(Date.now()+shift); //引数で受け取ったズレ(ミリ秒)を足して現在時刻を求める
	let diff = new Date(2025, 0, 1, 0, 0, 0) - now + 900; //2025-01-01 0:00:00との時間差を計算
	const youbi = ["日", "月", "火", "水", "木", "金", "土"] //Date.getDay()で曜日を表示するための配列
	if(diff<0){ //年明け後の処理
		document.getElementById("sinceuntil").innerHTML = `<span style="color:#F00;">あけましておめでとうございます</span><br>2025年開始から`;
		diff = diff * -1 + 1000; } //年明け後はカウントアップ
	let time = [now.getFullYear(), now.getMonth()+1, now.getDate(), youbi[now.getDay()], now.getHours(), now.getMinutes(), now.getSeconds()]; //[年, 月, 日, 曜日, 時, 分, 秒]
	let remain = [Math.floor(diff/1000/60/60), Math.floor(diff/1000/60)%60, Math.floor(diff/1000)%60]; //残り時間計算 [時間, 分, 秒]
	document.getElementById("date").innerHTML = `${time[0]}年${time[1]}月${time[2]}日 (${time[3]})`; //日付書換
	document.getElementById("time").innerHTML = `${time[4]}:${time[5].toString().padStart(2, '0')}:${time[6].toString().padStart(2, '0')}`; //時刻書換
	document.getElementById("timer").innerHTML = `${remain[0]}:${remain[1].toString().padStart(2, '0')}:${remain[2].toString().padStart(2, '0')}`; //タイマー書換
	document.getElementById("exec-time").innerHTML = `${(Math.round((performance.now() - start)*10)/10000).toFixed(4)}秒` //処理時間を100μs単位で求め、秒単位で表示
	setTimeout(updateClock, 1000 - (Date.now()+shift) % 1000, shift); //秒が変わるタイミングで正確に表示
}
fetch('https://worldtimeapi.org/api/timezone/Asia/Tokyo').then(r=>{
	(!r.ok) && (document.getElementById("clock-src").innerHTML = `端末`) && updateClock(0); //取得失敗時は端末時刻をそのまま使う
	return r.json() //World Time APIからの時刻取得
}).then(d=>{
	document.getElementById("clock-src").innerHTML = `World Time API`; //取得元表示
	let shift = new Date(d.datetime) - new Date(); //端末時刻とのズレを計算
	(shift < 0) && (document.getElementById("clock-shift").innerHTML = `端末の時刻は${(shift*-1/1000).toFixed(3)}秒進んでいます`);
	(shift > 0) && (document.getElementById("clock-shift").innerHTML = `端末の時刻は${(shift/1000).toFixed(3)}秒遅れています`);
	updateClock(shift); //ズレを補正して時刻表示
});