<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    public function sendMessage(
        string $botToken,
        string $chatId,
        string $message,
        ?string $parseMode = 'HTML'
    ): array {
        try {
            $url = "https://api.telegram.org/bot{$botToken}/sendMessage";

            $response = Http::timeout(30)->post($url, [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => $parseMode,
                'disable_web_page_preview' => true,
            ]);

            $result = $response->json();

            if (!$response->successful() || !$result['ok']) {
                Log::error('Telegram API error:', [
                    'response' => $result,
                    'status' => $response->status(),
                ]);
                return [
                    'success' => false,
                    'error' => $result['description'] ?? 'Unknown error',
                ];
            }

            return [
                'success' => true,
                'message_id' => $result['result']['message_id'],
            ];
        } catch (\Exception $e) {
            Log::error('Failed to send Telegram message: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function sendBulkMessage(
        string $botToken,
        array $chatIds,
        string $message,
        ?string $parseMode = 'HTML'
    ): array {
        $results = [];

        foreach ($chatIds as $chatId) {
            $results[$chatId] = $this->sendMessage($botToken, $chatId, $message, $parseMode);

            // Small delay to avoid rate limiting
            usleep(100000); // 0.1 second
        }

        return $results;
    }
}
