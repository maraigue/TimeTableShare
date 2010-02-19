var MARKS = {
	null: "&nbsp;&nbsp;&nbsp;&nbsp;",
	true: "&nbsp;↓&nbsp;",
	false:"&nbsp;||&nbsp;"};
var MARKS_INV = {
	"&nbsp;&nbsp;&nbsp;&nbsp;": null,
	"&nbsp;↓&nbsp;":           true,
	"&nbsp;||&nbsp;":           false};
var TRAINS = 50;        // 何本の列車を1単位として、状態の保存・呼び出しを行うか
var WIDTH = 4;          // 1つの時刻に対して割り当てられる文字数

var trains;        // 列車の総数
var stations;      // 駅の総数
var cursor = "st"; // 選択されているカーソル
var backup;        // 数字入力時に元の値を確保するための変数
var width_train = 10;   // 1画面に何列車を表示するか
var width_station = 10; // 1画面に何駅を表示するか
var shown_train = 0;    // 何本目の列車から表示するか
var shown_station = 0;  // 何駅目から表示するか
var under_inputing = null; // 時刻が入力途中か
                           // null: 入力途中ではない
                           // オブジェクト: 入力途中である
                           //   under_inputing["input_num"]: 現在入力途中の時刻
                           //   under_inputing["successive"]: 連続入力中かどうか
                           //     (null: 連続入力中でない
                           //      true: 連続入力の最初
                           //      配列: 連続入力の途中(1つ前の時刻が格納される))
var clipboard_train = null;
var clipboard_station = null;

// ----------------------------------------
//   Utilities
// ----------------------------------------

// ---------- HTMLタグの除去 ----------
function rmtag(str){
	return(str
		.replace(/&/, "&amp;")
		.replace(/</, "&lt;")
		.replace(/>/, "&gt;")
		.replace(/"/, "&quot;") // "
		.replace(/[\x00-\x20]/, "&nbsp;")
	);
}

// ---------- 時刻表のデータを表示するフォーマットにする ----------
function format_num(num){
	return(("0"+num).slice(-2));
}

function format_time(time){
	var tmp = MARKS[time];
	if(tmp !== undefined) return tmp;
	return format_num(time[0])+format_num(time[1]);
}

// ---------- 列車名のフォーマットを行う ----------
function traininfo(buf){
	var i;
	var res = "";
	for(i = 0; i < buf.length; i++){
		res += rmtag(buf.charAt(i));
		if(i != buf.length - 1) res += "<br>";
	}
	return res;
}

// ---------- IDからセルの座標を得る ----------
function parseID(idname){
	if(idname.match(/^s(\d*)t(\d*)$/)){
		return [RegExp.$1, RegExp.$2];
	}
	return null;
}

// ---------- 入力された時刻が有効かどうか調べる ----------
function valid_time(str){
	// 「時」が有効かチェック
	switch(str.charAt(0)){
	case "0": case "1":
		break;
	case "2":
		if(str.charAt(1) - 0 >= 4) return false;
		break;
	default:
		return false;
	}
	
	// 「分」が有効かチェック
	if(str.charAt(2) - 0 >= 6) return false;
	
	return([str.substr(0,2)-0, str.substr(2,2)-0]);
}

// ---------- 時刻を入力できる場所か判定する ----------
function is_time_cell(pos){
	var i = parseID(pos);
	if(i === null || i[0] === "" || i[1] === "" ||
	   i[0]-0 === stations-1 || i[1]-0 === trains-1){
		return false;
	}
	return true;
}

// ---------- 駅名を入力できる場所か判定する ----------
function is_station_cell(pos){
	var i = parseID(pos);
	
	if(i[1] === "" && i[0] !== "" && i[0]-0 !== stations-1){
		return true;
	}
	return false;
}

// ---------- 列車名を入力できる場所か判定する ----------
function is_train_cell(pos){
	var i = parseID(pos);
	
	if(i[0] === "" && i[1] !== "" && i[1]-0 !== trains-1){
		return true;
	}
	return false;
}

// ---------- バックアップ(変更中の値を戻す)を適用 ----------
function restore_backup(){
	$("#"+cursor).html(backup);
	refresh_inputing_status(null);
}

// ---------- カーソルを指定した量だけ移動する ----------
// 注：スクロール対応もここでやってる
function move_cursor(st, tr, cancel_input){ // cancel_input: optional(default: true)
	if(st == 0 && tr == 0) return;
	
	var need_render = false;
	
	// 値が変更途中で、その変更を破棄するようなカーソル移動だったら、
	// 値をバックアップした値に戻す。
	if(cancel_input === undefined || cancel_input === true){
		if(under_inputing !== null) restore_backup();
	}
	
	// バックアップした値を破棄する
	backup = "";
	
	// セルIDを準備
	var i = parseID(cursor);
	if(i === null) return;
	var new_st, new_tr, key;
	
	// 駅の変更
	if(i[0] === ""){
		if(st == 0){
			new_st = "s";
		}else{
			new_st = "s"+(st+shown_station-1);
		}
	}else{
		key = (i[0] - 0) + st;
		
		if(key < shown_station){
			shown_station += st;
			if(shown_station < 0) shown_station = 0;
			need_render = true;
		}else if(key >= shown_station + width_station && stations > width_station){
			shown_station += st;
			if(shown_station > stations - width_station){
				shown_station = stations - width_station;
			}
			need_render = true;
		}
		
		if(key < 0){
			new_st = "s";
		}else{
			if(key >= stations + 1) key = stations;
			new_st = "s"+key;
		}
	}
	
	// 列車の変更
	if(i[1] === ""){
		if(tr == 0){
			new_tr = "t";
		}else{
			new_tr = "t"+(tr+shown_train-1);
		}
	}else{
		key = (i[1] - 0) + tr;
		
		if(key < shown_train){
			shown_train += tr;
			if(shown_train < 0) shown_train = 0;
			need_render = true;
		}else if(key >= shown_train + width_train && trains > width_train){
			shown_train += tr;
			if(shown_train > trains - width_train){
				shown_train = trains - width_train;
			}
			need_render = true;
		}
		
		if(key < 0){
			new_tr = "t";
		}else{
			if(key >= trains + 1) key = trains;
			new_tr = "t"+key;
		}
	}
	
	if(need_render) render();
	sel(new_st + new_tr);
}

// ---------- カーソルを指定した位置に移動する ----------
function cell_clicked(pos){
	// カーソルが移動してないときは終了
	if(pos === cursor) return;
	
	// 値が変更途中だったら、値をバックアップした値に戻す
	if(under_inputing !== null) restore_backup();
	
	sel(pos);
}

// ---------- 時刻の連続入力の途中か判定 ----------
function is_halfway_of_successive_input(inputing_status){
	return(
		inputing_status !== null &&
		inputing_status["successive"] !== null &&
		inputing_status["successive"] !== true);
}

// ---------- 連続入力中か判定 ----------
function is_under_successive_input(inputing_status){
	return(
		inputing_status !== null &&
		inputing_status["successive"] !== null);
}

// ---------- 現在のカーソル位置で、時刻の入力が可能か判定 ----------
// (不可能なら、連続入力を解除する)
function validate_ability_of_input(){
	if(!is_time_cell(cursor)){
		backup = "";
		refresh_inputing_status(null);
		$("#"+cursor).html("");
	}
}

// ---------- 入力状況（通常か連続入力か、など）を更新 ----------
// 同時にカーソルの色も変更する
function refresh_inputing_status(new_status){
	under_inputing = new_status;
	sel(cursor);
}

// ---------- 数字を入力したときの処理 ----------
function put_number(num){
	var this_hour_str = null;
	
	// 入力できない位置で入力した場合は無視
	if(!is_time_cell(cursor)) return;
	
	// 現在入力途中でなければ、現在セルにある値を確保しておく
	if(under_inputing === null){
		refresh_inputing_status({"input_num": "", "successive": null});
		backup = $("#"+cursor).html();
	}
	
	// 数字を入力
	under_inputing["input_num"] += num;
	$("#"+cursor).html(under_inputing["input_num"]);
	
	// 入力が確定したときの処理
	if(under_inputing["input_num"].length === WIDTH){
		var pos = parseID(cursor);
		var val = valid_time(under_inputing["input_num"]);
		if(val){
			if(under_inputing["successive"] !== null){
				this_hour_str = under_inputing["input_num"].substr(0, 2);
			}
			
			if(under_inputing["successive"] !== null && under_inputing["successive"] !== true){
				// 連続入力で入力している場合の、時刻の算出
				if(val[1] <= under_inputing["successive"][1]){
					// いま入力した「分」の値が、1つ前のセルの「分」の値と
					// 同じか小さい場合、いま入力した時刻の「時」の部分は
					// 1つ前のセルの「時」の値+1
					val[0]++;
					if(val[0] >= 24) val[0] -= 24;
					this_hour_str = format_num(val[0]);
					
					$("#"+cursor).html(format_time(val));
					
					// ※そうでない場合、そのまま処理すればよい
				}
			}
			
			data["t"][pos[1]][pos[0]] = val;
			
			// カーソルを移動
			move_cursor(1, 0, false);
			if(this_hour_str !== null){
				// if(ORIGINAL_under_inputing["successive"] !== null) のこと
				// (次が連続入力の場合)
				backup = $("#"+cursor).html();
				refresh_inputing_status({"input_num": this_hour_str, "successive": val});
				$("#"+cursor).html(this_hour_str);
			}else{
				refresh_inputing_status(null);
			}
			
			validate_ability_of_input();
		}else{
			// 無効ならバックアップを戻す
			restore_backup();
			backup = "";
		}
	}
}

// ---------- 列車の挿入 ----------
function train_insert(pos, time, name){ // time, name: optional
	if(pos == "" || pos < 0 || pos > trains) return;
	
	if(time === undefined){
		time = []
		for(var i = 0; i < stations; i++) time.push(null);
	}
	if(name === undefined) name = "";
	
	data["t"].splice(pos, 0, time);
	data["i"].splice(pos, 0, name);
	
	trains++;
	render();
}

// ---------- 列車のコピー ----------
function train_copy(pos){
	if(pos == "" || pos < 0 || pos >= trains - 1) return;
	clipboard_train = { "t": data["t"][pos], "i": data["i"][pos] };
}

// ---------- 列車の削除 ----------
function train_delete(pos, copy){ // copy: optional (trueであった場合、クリップボードへコピー)
	if(pos == "" || pos < 0 || pos >= trains - 1) return;
	
	if(copy === true) train_copy(pos);
	data["t"].splice(pos, 1);
	data["i"].splice(pos, 1);
	
	trains--;
	render();
}

// ---------- 駅の挿入 ----------
function station_insert(pos, time, name){ // time, name: optional
	if(pos == "" || pos < 0 || pos > stations) return;
	
	if(time === undefined){
		time = []
		for(var i = 0; i < trains; i++) time.push(null);
	}
	if(name === undefined) name = "";
	
	for(var i = 0; i < trains; i++) data["t"][i].splice(pos, 0, time[i]);
	data["s"].splice(pos, 0, name);
	
	stations++;
	render();
}

// ---------- 駅のコピー ----------
function station_copy(pos){
	if(pos == "" || pos < 0 || pos >= stations - 1) return;
	
	clipboard_station = { "t": [], "s": data["s"][pos] };
	for(var i = 0; i < trains; i++){
		clipboard_station["t"].push(data["t"][i][pos]);
	}
}

// ---------- 駅の削除 ----------
function station_delete(pos, copy){ // copy: optional (trueであった場合、クリップボードへコピー)
	if(pos == "" || pos < 0 || pos >= stations - 1) return;
	
	if(copy === true) station_copy(pos);
	for(var i = 0; i < trains; i++) data["t"][i].splice(pos, 1);
	data["s"].splice(pos, 1);
	
	stations--;
	render();
}

// ---------- 特殊な値をセットし、カーソルを移動する ----------
// null: 空欄 true: 通過 false: 別線区経由
function set_special_value_and_move(cursor, value){
	if(!is_time_cell(cursor) || MARKS[value] === undefined) return;
	
	$("#"+cursor).html(MARKS[value]);
	var pos = parseID(cursor);
	data["t"][pos[1]][pos[0]] = value;
	
	move_cursor(1, 0, false);
}

// ---------- サーバに保存するためのデータ形式を生成する ----------
function server_format_time(time_data, index){
	// 時刻1つ1つ（2要素の配列 or true or false or null）を変換する
	switch(time_data){
	case true:
		return "true";
	case false:
		return "false";
	case null:
		return "null";
	}
	return "["+time_data[0]+","+time_data[1]+"]";
}

function server_format(timetable_data){
	var stations_data = $.map(timetable_data["s"], function(v, i){ return rmtag(v); });
	stations_data.pop();
	var train_info_data = $.map(timetable_data["i"], function(v, i){ return rmtag(v); });
	train_info_data.pop();
	var time_table_data = $.map(timetable_data["t"], function(arr, i){
			var time_data = $.map(arr, server_format_time);
			time_data.pop();
			return time_data.join(" ");
		});
	time_table_data.pop();
	
	return({
		s: stations_data.join(" "),
		i: train_info_data.join(" "),
		t: time_table_data.join("\n")
	})
}

// ---------- サーバに保存する ----------
function save_to_server(){
	var formatted_data = server_format(data);
	$.ajax({
		async: true,
		cache: false,
		data: formatted_data,
		dataType: "json",
		type: "post",
		url: "http://hhiro.net/ttshare/update.php",
		error: function(request, status, error){
			alert("保存に失敗しました。時間をおいて再度試行して下さい。");
		},
		success: function(data, data_type){
			if(data.saved){
				alert("保存されました。");
			}else{
				alert("サーバ上に問題が発生しています。時間をおいて再度試行して下さい。")
			}
		}
	});
}

// ----------------------------------------
//   Event-driven functions
// ----------------------------------------

function on_load(){
	// add key event
	add_keyevents();
	
	data_loaded();
	render();
}

function add_keyevents(){
	// 数字（時刻の入力）
	$(document).bind("keydown", "0", function(){ put_number(0); });
	$(document).bind("keydown", "1", function(){ put_number(1); });
	$(document).bind("keydown", "2", function(){ put_number(2); });
	$(document).bind("keydown", "3", function(){ put_number(3); });
	$(document).bind("keydown", "4", function(){ put_number(4); });
	$(document).bind("keydown", "5", function(){ put_number(5); });
	$(document).bind("keydown", "6", function(){ put_number(6); });
	$(document).bind("keydown", "7", function(){ put_number(7); });
	$(document).bind("keydown", "8", function(){ put_number(8); });
	$(document).bind("keydown", "9", function(){ put_number(9); });
	
	// スペース(連続入力開始)
	$(document).bind("keydown", "space", function(){
		if(!is_time_cell(cursor)) return;
		if(backup === "") backup = $("#"+cursor).html();
		refresh_inputing_status({"input_num": "", "successive": true});
		put_number("");
	});
	
	// 上下左右(カーソル移動)
	$(document).bind("keydown", "left",  function(){ move_cursor(0, -1); });
	$(document).bind("keydown", "right", function(){ move_cursor(0, 1);  });
	$(document).bind("keydown", "up",    function(){ move_cursor(-1, 0); });
	$(document).bind("keydown", "down",  function(){ move_cursor(1, 0);  });
	
	// Insert/Delete(列車の追加・削除)
	$(document).bind("keydown", "insert", function(){
		train_insert((parseID(cursor))[1]); });
	$(document).bind("keydown", "del", function(){
		train_delete((parseID(cursor))[1]); });
	
	// Shift+Insert/Delete(駅の追加・削除)
	$(document).bind("keydown", "Shift+insert", function(){
		station_insert((parseID(cursor))[0]); });
	$(document).bind("keydown", "Shift+del", function(){
		station_delete((parseID(cursor))[0]); });
	
	// B(空欄)
	$(document).bind("keydown", "b", function(){
		set_special_value_and_move(cursor, null);
		refresh_inputing_status(null);
	});
	
	// P(通過)
	$(document).bind("keydown", "p", function(){ input_special_timespec(true); });
	
	// O(別線区経由)
	$(document).bind("keydown", "o", function(){ input_special_timespec(false); });
	
	// エンターキー
	$(document).bind("keydown", "return", on_keydown_enter);
	
	// Ctrl+X(列車を切り取り)
	$(document).bind("keydown", "Ctrl+x", function(){
		train_delete((parseID(cursor))[1], true) });
	// Ctrl+C(列車をコピー)
	$(document).bind("keydown", "Ctrl+c", function(){
		train_copy((parseID(cursor))[1]) });
	// Ctrl+V(列車を貼り付け)
	$(document).bind("keydown", "Ctrl+v", function(){
		train_insert((parseID(cursor))[1], clipboard_train["t"], clipboard_train["i"]) });
	
	// Ctrl+Shift+X(駅を切り取り)
	$(document).bind("keydown", "Ctrl+Shift+x", function(){
		station_delete((parseID(cursor))[0], true); });
	// Ctrl+Shift+C(駅をコピー)
	$(document).bind("keydown", "Ctrl+Shift+c", function(){
		station_copy((parseID(cursor))[0]); });
	// Ctrl+Shift+V(駅を貼り付け)
	$(document).bind("keydown", "Ctrl+Shift+v", function(){
		station_insert((parseID(cursor))[0], clipboard_station["t"], clipboard_station["s"]) });
}

// 特殊な時刻の値（通過・別線区経由）を入力する処理
function input_special_timespec(new_status){
	set_special_value_and_move(cursor, new_status);
	
	if(is_halfway_of_successive_input(under_inputing)){
		backup = $("#"+cursor).html();
		$("#"+cursor).html(format_num(under_inputing["successive"][0]));
	}else{
		refresh_inputing_status(null);
	}
	validate_ability_of_input();
}

// エンターキーが押されたときの処理
function on_keydown_enter(double_click){
	var pos = parseID(cursor);
	if(pos[0] !== "" && pos[1] === ""){
		// 駅名を変更する場合
		if(!is_station_cell(cursor)) return;
		
		var st = pos[0] - 0;
		var res = prompt("駅名を入力して下さい。", data["s"][st]);
		if(res !== null){
			data["s"][st] = res;
			$("#"+cursor).text(res);
		}
	}else if(pos[0] === "" && pos[1] !== ""){
		// 列車名を変更する場合
		if(!is_train_cell(cursor)) return;
		
		var tr = pos[1] - 0;
		var res = prompt("列車名を入力して下さい。", data["i"][tr]);
		if(res !== null){
			data["i"][tr] = res;
			$("#"+cursor).html(traininfo(res));
		}
	}else if(pos[0] !== "" && pos[1] !== ""){
		// 時刻フィールドでのエンターキー
		if(under_inputing === null){
			// 時刻変更ダイアログを出す場合(未実装)
		}else{
			// 時刻を確定する場合
			if(under_inputing["input_num"].length == 3){
				// すでに3桁入力されている状態でエンターが
				// 押された場合、先頭に0を補完したものとみなして
				// 時刻を確定する（例：830[Enter]→"0830"）
				under_inputing["input_num"] = "0"+under_inputing["input_num"];
				put_number("");
			}else{
				// そうでない場合、無条件にキャンセル
				restore_backup();
			}
		}
	}
}

function data_loaded(){
	var s, t;
	
	data["s"].push("");
	stations = data["s"].length;
	
	data["t"].push([]);
	data["i"].push("");
	trains = data["t"].length;
	for(s = 0; s < stations; s++){
		data["t"][trains-1].push(null);
	}
	for(t = 0; t < trains-1; t++){
		data["t"][t].push(null);
	}
}

function sel(itemid){
	if($("#"+itemid).length === 0) return;
	
	if(cursor !== "st"){
		$("#"+cursor).removeClass("selected");
		$("#"+cursor).removeClass("selectedsucc");
		$("#"+cursor).addClass("notselected");
	}
	
	if(itemid !== "st"){
		$("#"+itemid).removeClass("notselected");
		
		if(is_under_successive_input(under_inputing)){
			$("#"+itemid).addClass("selectedsucc");
		}else{
			$("#"+itemid).addClass("selected");
		}
	}
	cursor = itemid;
}

function render(){
	var buf = "";
	var s, t;
	var name, imp;
	var last_station, last_train;
	var itemid;
	
	last_train = shown_train + width_train;
	if(last_train > trains) last_train = trains;
	last_station = shown_station + width_station;
	if(last_station > stations) last_station = stations;
	
	// Put train info
	itemid = "st";
	buf += ("<tr><td class='trinfo station' id='"+itemid+"'>&nbsp;</td>");
	for(t = shown_train; t < last_train; t++){
		itemid = "st"+t;
		buf += ("<td class='trinfo' id='"+itemid+"' onclick='cell_clicked(\""+itemid+
		        "\")' ondblclick='on_keydown_enter(true)'>"+
		        traininfo(data["i"][t])+"</td>");
	}
	buf += "</tr>";
	
	// Put station name and time
	for(s = shown_station; s < last_station; s++){
		// station name
		name = data["s"][s];
		imp = "";
		if(name.charAt(0) == " "){
			imp = " class='important'";
			name = name.substr(1);
		}
		itemid = "s"+s+"t";
		buf += ("<tr"+imp+"><td class='station' id='"+itemid+
		        "' onclick='cell_clicked(\""+itemid+
		        "\")' ondblclick='on_keydown_enter(true)'>"+name+"</td>");
		
		// time
		for(t = shown_train; t < last_train; t++){
			itemid = "s"+s+"t"+t;
			buf += ("<td id='"+itemid+"' onclick='cell_clicked(\""+itemid+
			        "\")' ondblclick='on_keydown_enter(true)'>"+
			        format_time(data["t"][t][s])+"</td>");
		}
		buf += "</tr>";
	}
	
	$("#tt").html(buf);
	
	sel(cursor);
}

/*

未済

# 時刻入力部でEnter(入力途中のキー押下など)
  →時刻入力ダイアログは当面放置
# 発/着
  →上記の理由ゆえ当面放置

# 時刻の連続入力
  [未済事項]
  # (済)通過・別線区が指定されたときも継続する
  # (済)末尾行到達時に止める
  # (済)連続入力時はカーソルの色を変える
  # 4桁入力時にEnterキーを押す場合に対応する(放置)
  # 2桁入力時にEnterキーを押すと中止とみなす(放置)
# (済？)カット・コピー・ペースト
# Undo(ちょっと先？)
# サーバへのデータ格納仕様

仕様

# 時刻の3桁入力
  → 3桁打ってエンターなら確定、3桁打ってカーソルキーなら取り消し
# 時刻の連続入力
  # 開始条件：時刻フィールドでスペースキー
    * 入力途中の場合は、一旦その値を解消。
    * フラグ「true」を立てる。
  # 連続入力を始めたセルでは4桁入力、それ以外では2桁入力
    * 連続入力状態（trueか、時分の値がフラグに立っている場合）で1つのセルの
      入力が完結した際、フラグとして「時」「分」の値の組を立ててから次のセルに移る。
  # 終了条件：カーソルを、上記の自動移動以外で移動させる
    * move_cursor関数ではフラグをnullにする処理が必要。
*/
