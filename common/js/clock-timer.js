let until, offset; //大域：カウントダウン終了日時, 時刻のズレ

async function updateDay(now) { //読込時と0:00に日付と残り日数書換
	if (timerDisp == "yes" || timerDisp == null) {
		const dif = until - now + 1e3 > 0 ? until - now + 1e3 : -1 * (until - now), //残り時間、終了日時を過ぎたら経過時間(ミリ秒)
			days = Math.floor(dif / 1e3 / 86400); //残り or 経過日数
		document.getElementById("days").innerHTML = days != 0 ? days + "日" : ""; //残り日数書換(0日は非表示)
		now.getMonth == 0 && now.getDate == 1 ? document.getElementById("msg").innerHTML = '<span style="color:#F20;">あけましておめでとうございます</span><br>' + now.getFullYear() + '年開始から'
			: now.getMonth() == 4 && now.getDate() == 7 && (document.getElementById("msg").innerHTML = '<span style="color:#F20;">Endo, Happy Birthday!</span>', document.getElementById("days").innerHTML = now.getFullYear() - 2003 + "歳")
		//元日と誕生日のメッセージ
	} else if (timerDisp == "no") document.getElementById("days").innerHTML = document.getElementById("time").innerHTML = "";
	document.getElementById("today").innerHTML = now.getFullYear() + "年" + (now.getMonth() + 1) + "月" + now.getDate() + "日 (" + ["日", "月", "火", "水", "木", "金", "土"][now.getDay()] + ")"; //日付書換
}
function timerSet(now) { //読込時にカウントダウン終了日時を決定
	if (timerDisp == "yes" || timerDisp == null) {
		const Y = now.getFullYear(); //今年
		new Date(Y, 0, 2) > now ? until = new Date(Y, 0, 1) //1月1日 -> 今年1月1日 0:00
			: new Date(Y, 4, 8) > now ? (until = new Date(Y, 4, 7), document.getElementById("msg").innerHTML = "Endoの誕生日まで") //1月2日～5月7日 -> 5月7日 0:00
				: (until = new Date(Y + 1, 0, 1), document.getElementById("msg").innerHTML = Y + 1 + "年まで"); //5月8日以降 ->来年1月1日 0:00
	} else if (timerDisp == "no") document.getElementById("msg").innerHTML = "現在時刻";
	updateDay(now); //読込時の日付挿入
	document.getElementById("clock-offset").innerHTML = offset > 0 ? "端末の時刻は" + (Math.abs(offset) / 1e3).toFixed(3) + "秒遅れています"
		: offset < 0 ? "端末の時刻は" + (Math.abs(offset) / 1e3).toFixed(3) + "秒進んでいます"
			: offset == 0 ? "端末の時刻は合っています" : "端末の時刻は不正確な可能性があります"; //時刻のズレを表示
}
let timeoutID;
function clock() { //毎秒の時刻書換
	const st = performance.now(), //実行開始のタイミングを記録
		now = offset ? new Date(Date.now() + offset + 10) : new Date(Date.now() + 10), //現在時刻
		time = { h: now.getHours(), m: now.getMinutes(), s: now.getSeconds() }; //現在時刻{時, 分, 秒}
	if (timerDisp == "yes" || timerDisp == null) {
		const dif = until - now + 1e3 > 0 ? until - now + 1e3 : -1 * (until - now), //残り時間、終了日時を過ぎたら経過時間(ミリ秒)
			remain = { h: Math.floor(dif / 1e3 / 3600) % 24, m: Math.floor(dif / 1e3 / 60) % 60, s: Math.floor(dif / 1e3) % 60 }; //残り時間{時間, 分, 秒}
		document.getElementById("time").innerHTML = time.h + ":" + time.m.toString().padStart(2, '0') + ":" + time.s.toString().padStart(2, '0');
		document.getElementById("count").innerHTML = remain.h + ":" + remain.m.toString().padStart(2, '0') + ":" + remain.s.toString().padStart(2, '0');
	} else if (timerDisp == "no") document.getElementById("count").innerHTML = time.h + ":" + time.m.toString().padStart(2, '0') + ":" + time.s.toString().padStart(2, '0');
	time.h * 3600 + time.m * 60 + time.s < 2 && updateDay(now); //0:00:00で日付、0:00:01で残り日数書換
	document.getElementById("exec-time").innerHTML = (Math.round((performance.now() - st) * 10) / 1e4).toFixed(4); //100μs単位で実行時間を求め、秒単位で表示
	timeoutID = offset ? setTimeout(clock, 1e3 - (Date.now() + offset) % 1e3) : setTimeout(clock, 1e3 - (Date.now() % 1e3)) //(1000 - 現在時刻(ミリ秒)を1000で割った余り)ミリ秒待つ -> 次の.000秒のタイミングで実行
}
const url = new URL(window.location.href), timerDisp = url.searchParams.get("countdown");
timerSet(new Date); clock(); document.getElementById("clock-src").innerHTML = "時刻情報：端末 (読み込み中…)"; //読込完了前はとりあえず端末時刻で時計とタイマーを動かす

async function clocksync() { //APIから時刻情報を取得し、現在時刻とのズレを求める
	const serverlist = [ //key:受信したJSONの時刻情報が入っているキー, unix:その時刻情報がUNIX時間のとき出現, tz:時刻情報にタイムゾーン情報がないとき出現
		{ url: "https://timeapi.io/api/time/current/zone?timeZone=Asia%2FTokyo", key: "dateTime", tz: "+0900" },
		{ url: "https://worldtimeapi.org/api/timezone/Asia/Tokyo", key: "datetime" },
		{ url: "https://elp.emtybox.win", key: "unix_time_ms", unix: true }
	];
	let offsets = []; //それぞれのAPIで取得した時刻から端末時刻とのズレを求めて入れる（後でズレ平均を計算する）
	for (const sv of serverlist) {
		try {
			const reqSt = performance.now(); //リクエスト開始のタイミングを記録
			const res = await fetch(sv.url)
			if (!res.ok) {
				console.warn("Failed to fetch from " + sv.url + " (status: " + res.status + ")");
				continue; //取得失敗時は次のAPIサーバへ
			}
			const latency = (performance.now() - reqSt) / 2, //レスポンスの時間を求める
				J = await res.json(); //JSON
			sv.unix ? offsets.push(latency + (J[sv.key] - Date.now()))
				: sv.tz ? offsets.push(latency + (new Date(J[sv.key] + sv.tz) - new Date())) : offsets.push(latency + (new Date(J[sv.key]) - new Date()));
		} catch (e) {
			console.error("Fetch error from " + sv.url, e);
			continue;
		}
	}
	return offsets
}

onload = async() => { //読込完了後、APIから時刻取得して修正
	document.getElementById("clock-src").innerHTML = "時刻情報：端末 (APIから取得中…)";
	const offsets = await clocksync();
	if (offsets.length > 0) {
		offsets.sort((a, b) => a - b);
		const mid = Math.floor(offsets.length / 2);
		offset = offsets.length % 2 == 0 ? (offsets[mid - 1] + offsets[mid]) / 2 : offsets[mid];
		document.getElementById("clock-src").innerHTML = '時刻情報：API (取得サーバ数：' + offsets.length + ')';
	} else {
		document.getElementById("clock-src").innerHTML = '時刻情報：端末 (<span style="color:#F20;">サーバから取得失敗</span>)';
		console.error("すべてのサーバで時刻情報の取得に失敗しました");
	}
	timerSet(new Date(Date.now() + offset + 10)); //正確な時刻に基づき、カウントダウン終了日時を改めて決定
}
document.onvisibilitychange = () => { //ブラウザのタブ移動等でページが非表示の場合時計を止める
	if (document.hidden) clearTimeout(timeoutID);
	else {
		const now = offset ? new Date(Date.now() + offset) : new Date();
		updateDay(now); clock(); //再表示時に日付の更新(0時またぎ対策)と時計再スタート
	}
}

/*
期間       メッセージ  カウントダウン終了日時
1/1        あけおめ    今年1/1 0:00 経過
1/2-5/6    誕生日まで  今年5/7 0:00 残り
5/7        ハピバ      今年5/7 0:00 経過
5/8-12/31  来年まで    来年1/1 0:00 残り
*/