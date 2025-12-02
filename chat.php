<?php
// chat.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // برای تست (بعداً آدرس سایتت رو بذار)
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// --- اطلاعات محرمانه (اینجا رو پر کن) ---
$apiKey = "sk-proj-....";    // کلید API خودت
$assistantId = "asst_....";  // آیدی دستیاری که ساختی
// -------------------------------------

$input = json_decode(file_get_contents('php://input'), true);
$userMessage = $input['message'] ?? '';

if (!$userMessage) {
    echo json_encode(['reply' => 'پیامی نیامد!']);
    exit;
}

// تابع کمکی برای ارسال درخواست به OpenAI
function callOpenAI($url, $data, $apiKey) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Content-Type: application/json",
        "Authorization: Bearer $apiKey",
        "OpenAI-Beta: assistants=v2"
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}

// 1. ساخت ترد و ارسال پیام و اجرا (همه در یک مرحله)
$runUrl = "https://api.openai.com/v1/threads/runs";
$runData = [
    "assistant_id" => $assistantId,
    "thread" => [
        "messages" => [
            ["role" => "user", "content" => $userMessage]
        ]
    ]
];

$run = callOpenAI($runUrl, $runData, $apiKey);
$threadId = $run['thread_id'] ?? null;
$runId = $run['id'] ?? null;

if (!$threadId || !$runId) {
    echo json_encode(['reply' => 'خطا در اتصال به هوش مصنوعی']);
    exit;
}

// 2. صبر کردن برای آماده شدن جواب (Polling)
while (true) {
    sleep(1); // یک ثانیه صبر
    
    $ch = curl_init("https://api.openai.com/v1/threads/$threadId/runs/$runId");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $apiKey",
        "OpenAI-Beta: assistants=v2"
    ]);
    $statusResponse = json_decode(curl_exec($ch), true);
    curl_close($ch);

    $status = $statusResponse['status'];
    
    if ($status == 'completed') {
        break;
    } elseif ($status == 'failed' || $status == 'cancelled') {
        echo json_encode(['reply' => 'مشکلی پیش آمد. دوباره تلاش کنید.']);
        exit;
    }
}

// 3. دریافت پیام نهایی
$ch = curl_init("https://api.openai.com/v1/threads/$threadId/messages");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer $apiKey",
    "OpenAI-Beta: assistants=v2"
]);
$messages = json_decode(curl_exec($ch), true);
curl_close($ch);

$reply = $messages['data'][0]['content'][0]['text']['value'];
// حذف رفرنس‌ها (اعداد داخل براکت مثل [source])
$reply = preg_replace('/【.*?】/', '', $reply);

echo json_encode(['reply' => $reply]);
?>
