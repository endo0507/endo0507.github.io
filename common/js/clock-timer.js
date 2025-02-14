let until, offset = 0; //大域：カウント終了日時, 時刻のズレ(初期値 = 0)

async function updateDate(now){ //読込時と0:00に日付や残り日数など書換
	let dif = until - now + 1e3; //残り時間を計算(ミリ秒)
	dif < 0 && (dif = -1 * dif + 1e3); //終了日時を過ぎた後は、-1を掛けて経過時間にする
	const days = Math.floor(dif / 1e3 / 86400); //残り日数(↑の処理があった場合経過日数)
	document.getElementById("today").innerHTML = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 (${["日", "月", "火", "水", "木", "金", "土"][now.getDay()]})`, //日付書換
	days != 0 ? document.getElementById("days").innerHTML = `${days}日` //残り日数書換
	: document.getElementById("days").innerHTML = "", //残り0日は非表示
	//元日と誕生日はメッセージ挿入
	now.getMonth() == 0 && now.getDate() == 1 ? document.getElementById("msg").innerHTML = `<span style="color:#F20;">あけましておめでとうございます</span><br>${now.getFullYear()}年開始から`
	: now.getMonth() == 4 && now.getDate() == 7 && (document.getElementById("msg").innerHTML = `<span style="color:#F20;">Endo, Happy Birthday!</span>`, document.getElementById("days").innerHTML = `${now.getFullYear() - 2003}歳`)
}
function timerSet(now){ //読込時にカウント終了日時を決定
	const Y = now.getFullYear(); //今年
	new Date(Y, 0, 2) > now ? until = new Date(Y, 0, 1) //1月1日 -> 今年1月1日 0:00
	: new Date(Y, 4, 8) > now ? (until = new Date(Y, 4, 7), document.getElementById("msg").innerHTML = "Endoの誕生日まで") //1月2日～5月7日 -> 5月7日 0:00
	: (until = new Date(Y + 1, 0, 1), document.getElementById("msg").innerHTML = `${Y + 1}年まで`), //5月8日以降 -> 来年1月1日 0:00
	updateDate(now), //読込時の日付挿入
	offset > 0 ? document.getElementById("clock-offset").innerHTML = `時差：端末の時刻は${(Math.abs(offset) / 1e3).toFixed(3)}秒遅れています`
	: offset < 0 ? document.getElementById("clock-offset").innerHTML = `時差：端末の時刻は${(Math.abs(offset) / 1e3).toFixed(3)}秒進んでいます`
	: document.getElementById("clock-offset").innerHTML = "時差：端末の時刻は不正確な可能性があります" //時刻のズレを表示
}
function updateClock(){ //毎秒の時刻書換
	let st = performance.now(), //実行開始のタイミングを記録
	    now = new Date(Date.now() + offset + 10), //端末時刻にズレを差し引き正確な時刻を求め、setTimeoutの精度補正に10ms足す
	    time = [now.getHours(), now.getMinutes(), now.getSeconds()], //現在時刻[時, 分, 秒]
	    dif = until - now + 1e3; //残り時間を計算(ミリ秒)
	dif < 0 && (dif = -1 * dif + 1e3); //終了日時を過ぎた後は、-1を掛けて経過時間にする
	(time[0] * 3600 + time[1] * 60 + time[2]) < 2 && updateDate(now); //0:00に日付書換(ズレて書き換わらないのを防ぐため2秒間実行)
	const remain = [Math.floor(dif / 1e3 / 3600) % 24, Math.floor(dif / 1e3 / 60) % 60, Math.floor(dif / 1e3) % 60]; //残り時間[時間, 分, 秒]
	document.getElementById("time").innerHTML = `${time[0]}:${time[1].toString().padStart(2, '0')}:${time[2].toString().padStart(2, '0')}`, //時刻書換
	document.getElementById("count").innerHTML = `${remain[0]}:${remain[1].toString().padStart(2, '0')}:${remain[2].toString().padStart(2, '0')}`, //カウントダウン書換
	document.getElementById("exec-time").innerHTML = (Math.round((performance.now() - st) * 10) / 1e4).toFixed(4), //100μs単位で実行時間を求め、秒単位で表示
	setTimeout(updateClock, 1e3 - (Date.now() + offset) % 1e3) //(1000 - 現在時刻(ミリ秒)を1000で割った余り)ミリ秒待つ -> 次の.000秒のタイミングで実行(精度4ms)
}
timerSet(new Date), updateClock(), document.getElementById("clock-src").innerHTML = "時刻情報：端末 (読み込み中…)"; //DOMツリー構築後、とりあえず端末時刻で時計とタイマーを動かす

addEventListener("load", () => { //読込完了後、APIから時刻取得して時刻修正
	document.getElementById("clock-src").innerHTML = "時刻情報：端末 (APIから取得中…)"
	const reqSt = performance.now(); //リクエスト開始のタイミングを記録
	fetch('https://timeapi.io/api/time/current/zone?timeZone=Asia%2FTokyo', {signal:AbortSignal.timeout(1500)}).then(r=>{ //1.5秒でタイムアウトエラー
		if(!r.ok)throw Error(r.status);  //HTTPステータス200番台以外がレスポンスされた時はエラー
		offset = (performance.now() - reqSt) / 2; //レスポンスにかかった時間を求める
		return r.json() //APIから受け取ったJSONを処理
	}).then(d=>{
		offset += (new Date(d.dateTime + "+0900") - new Date), //端末時刻のズレ = レスポンスの時間 + (API時刻 - 端末時刻)
		document.getElementById("clock-src").innerHTML = "時刻情報：timeapi.io (取得成功)", //取得先表示
		timerSet(new Date(Date.now() + offset + 10)) //正確な時刻に基づき、カウント終了日時を改めて決定
	}).catch(e=>(document.getElementById("clock-src").innerHTML = `時刻情報：端末 (<span style="color:#F20;">APIから取得失敗</span>)`, console.log(e))) //取得失敗メッセージ表示
});

/*
期間       メッセージ  カウント終了日時
1/1        あけおめ    今年1/1 0:00 経過
1/2-5/6    誕生日まで  今年5/7 0:00 残り
5/7        ハピバ      今年5/7 0:00 経過
5/8-12/31  来年まで    来年1/1 0:00 残り
*/