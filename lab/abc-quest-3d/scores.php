<?php
/* The 36th Chamber of Schooling: high score board.
   Every finished game becomes one line in scores.txt (plain text, readable by anyone).
   GET  scores.php            -> top 10 as JSON
   GET  scores.php?check=1    -> can the server write the log?
   POST name=ABCDE&rooms=N    -> appends a line, returns top 10 + rank of the new entry.
   The score is recomputed here from the number of doors, never taken from the browser. */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$FILE    = __DIR__ . '/scores.txt';
$CHARS   = preg_split('//u', 'ABCČDEFGHIJKLMNOPQRSŠTUVWXYZŽÄÖÜ-', -1, PREG_SPLIT_NO_EMPTY);
$CHAMBER = 36;
$MAXSIZE = 2000000;   // stop writing once the log reaches ~2 MB

if (!function_exists('mb_strtoupper')) {   // hosts without mbstring: the game already sends capitals
    function mb_strtoupper($s, $enc = null) { return strtoupper($s); }
    function mb_strlen($s, $enc = null) { return preg_match_all('/./u', $s); }
}

function score_for($rooms, $chamber) { return $rooms * 10 + intdiv($rooms, $chamber) * 100; }

function read_scores($file) {
    $out = array();
    if (!is_file($file)) return $out;
    foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if ($line === '' || $line[0] === '#') continue;
        $p = array_map('trim', explode('|', $line));
        if (count($p) < 4) continue;
        $out[] = array('date' => $p[0], 'name' => $p[1], 'score' => (int)$p[2], 'rooms' => (int)$p[3]);
    }
    usort($out, function ($a, $b) {
        if ($a['score'] !== $b['score']) return $b['score'] - $a['score'];
        return strcmp($a['date'], $b['date']);   // older entry wins a tie
    });
    return $out;
}

function reply($data) { echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }

if (isset($_GET['check'])) {
    reply(array('ok' => true, 'writable' => is_file($FILE) ? is_writable($FILE) : is_writable(__DIR__)));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = mb_strtoupper((string)($_POST['name'] ?? ''), 'UTF-8');
    $name = '';
    foreach (preg_split('//u', $raw, -1, PREG_SPLIT_NO_EMPTY) as $c) {
        if (in_array($c, $CHARS, true)) $name .= $c;
        if (mb_strlen($name, 'UTF-8') >= 5) break;
    }
    while (mb_strlen($name, 'UTF-8') < 5) $name .= '-';
    $rooms = max(0, min(99999, (int)($_POST['rooms'] ?? 0)));
    $score = score_for($rooms, $CHAMBER);
    $date  = gmdate('Y-m-d H:i:s');

    if (!is_file($FILE) || filesize($FILE) < $MAXSIZE) {
        $new  = !is_file($FILE);
        $line = sprintf("%s | %s | %6d | %5d\n", $date, $name, $score, $rooms);
        if ($new) $line = "# The 36th Chamber of Schooling - high scores, one line per game\n"
                        . "# date (UTC)         | name  |  score | doors\n" . $line;
        file_put_contents($FILE, $line, FILE_APPEND | LOCK_EX);
    }
    $all = read_scores($FILE);
    $rank = -1;
    foreach ($all as $k => $e) {
        if ($e['date'] === $date && $e['name'] === $name && $e['score'] === $score) { $rank = $k; break; }
    }
    $me = array('name' => $name, 'score' => $score, 'rooms' => $rooms, 'date' => $date);
    reply(array('ok' => true, 'list' => array_slice($all, 0, 10), 'rank' => $rank, 'me' => $me));
}

reply(array('ok' => true, 'list' => array_slice(read_scores($FILE), 0, 10), 'rank' => -1));
