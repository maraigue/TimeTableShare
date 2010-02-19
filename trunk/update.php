<?
$data = '{"saved":true}';

header('content-type: application/json');
header('content-length: '.strlen($data));
echo $data;

function parse_time_spec($str){
	if(preg_match("/^\\[(\\d+),(\\d+)\\]$/", $str, $matches)){
		return sprintf("%02d:%02d", $matches[1], $matches[2]);
	}
	if($str === "true") return "→";
	if($str === "false") return "＝";
	return "";
}

$stations = explode(" ", $_POST["s"]);
$trains_info = explode(" ", $_POST["i"]);
$time_table = explode("\n", $_POST["t"]);

$file = fopen("result.html", "w");
	fwrite($file, <<< HTML
<html>
<head>
<title>直近のデータ - TimeTableShare</title>
</head>
<body>
<h1>直近のデータ - TimeTableShare</h1>
<table border="1">
HTML
);
	// 駅名を表示
	fwrite($file, "<tr><th>列車名</th>");
	for($i = 0; $i < count($stations); $i++){
		fwrite($file, "<th>".htmlspecialchars($stations[$i])."</th>");
	}
	fwrite($file, "</tr>");
	
	// 列車を表示
	for($j = 0; $j < count($trains_info); $j++){
		fwrite($file, "<tr><th>".$trains_info[$j]."</th>");
		$time_data = explode(" ", $time_table[$j]);
		
		for($i = 0; $i < count($stations); $i++){
			fwrite($file, "<td>".parse_time_spec($time_data[$i])."</td>");
		}
		fwrite($file, "</tr>");
	}
	
	fwrite($file, <<< HTML
</table>
</body>
</html>
HTML
);
fclose($file);
?>
