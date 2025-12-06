<?php

namespace App\Services;

use App\Models\ValueObserver;
use App\Models\ValueObserverLog;
use App\Services\DynamicDatabaseService;
use App\Services\TelegramService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\ValueAlertEmail;
use Carbon\Carbon;

class ValueObserverService
{
    protected $dbService;
    protected $telegramService;

    public function __construct(DynamicDatabaseService $dbService, TelegramService $telegramService)
    {
        $this->dbService = $dbService;
        $this->telegramService = $telegramService;
    }

    public function runObservers(): void
    {
        $observers = ValueObserver::where('is_active', true)
            ->with('connectionTable.connection')
            ->get();

        foreach ($observers as $observer) {
            try {
                if ($this->shouldCheckObserver($observer)) {
                    $this->checkObserver($observer);
                }
            } catch (\Exception $e) {
                Log::error("Failed to check observer {$observer->id}: " . $e->getMessage());
            }
        }
    }

    private function shouldCheckObserver(ValueObserver $observer): bool
    {
        if (!$observer->last_checked_at) {
            return true;
        }

        $lastChecked = Carbon::parse($observer->last_checked_at);
        $nextCheck = $lastChecked->addMinutes($observer->check_interval_minutes);

        return now()->greaterThanOrEqualTo($nextCheck);
    }

    public function checkObserver(ValueObserver $observer): void
    {
        $connectionTable = $observer->connectionTable;
        $connection = $connectionTable->connection;

        $dbConn = $this->dbService->connect($connection->connection_config);

        $records = $dbConn->table($connectionTable->table_name)
            ->select([$connectionTable->primary_key, $observer->field_to_watch])
            ->get();

        $conditionMetCount = 0;

        foreach ($records as $record) {
            $currentValue = $record->{$observer->field_to_watch};
            $recordId = $record->{$connectionTable->primary_key};

            $conditionMet = $this->checkCondition(
                $currentValue,
                $observer->condition_type,
                $observer->threshold_value,
                $observer->string_value
            );

            $log = ValueObserverLog::create([
                'value_observer_id' => $observer->id,
                'record_id' => $recordId,
                'current_value' => is_numeric($currentValue) ? $currentValue : null,
                'current_string_value' => !is_numeric($currentValue) ? (string)$currentValue : null,
                'condition_met' => $conditionMet,
                'details' => $this->getConditionDetails($currentValue, $observer),
            ]);

            if ($conditionMet) {
                $conditionMetCount++;
                $this->sendNotification($observer, $log, $record, $currentValue);
            }
        }

        $observer->update([
            'last_checked_at' => now(),
            'last_triggered_at' => $conditionMetCount > 0 ? now() : $observer->last_triggered_at,
            'trigger_count' => $observer->trigger_count + $conditionMetCount,
        ]);
    }

    private function checkCondition($value, string $conditionType, $threshold = null, $stringValue = null): bool
    {
        switch ($conditionType) {
            case 'less_than':
                return is_numeric($value) && $value < $threshold;
            case 'greater_than':
                return is_numeric($value) && $value > $threshold;
            case 'equals':
                if (is_numeric($value) && is_numeric($threshold)) {
                    return $value == $threshold;
                }
                return (string)$value === (string)$stringValue;
            case 'not_equals':
                if (is_numeric($value) && is_numeric($threshold)) {
                    return $value != $threshold;
                }
                return (string)$value !== (string)$stringValue;
            case 'contains':
                return str_contains((string)$value, (string)$stringValue);
            case 'starts_with':
                return str_starts_with((string)$value, (string)$stringValue);
            case 'ends_with':
                return str_ends_with((string)$value, (string)$stringValue);
            default:
                return false;
        }
    }

    private function sendNotification(ValueObserver $observer, ValueObserverLog $log, $record, $currentValue): void
    {
        $connectionTable = $observer->connectionTable;
        $notificationSent = false;
        $sentTo = [];

        $data = [
            'observer' => $observer,
            'log' => $log,
            'record' => $record,
            'currentValue' => $currentValue,
            'tableName' => $connectionTable->name,
            'connectionName' => $connectionTable->connection->name,
            'conditionDescription' => $observer->getConditionDescription(),
            'checkedAt' => now()->format('Y-m-d H:i:s'),
        ];

        if ($observer->hasEmailNotifications()) {
            try {
                $this->sendEmailNotification($observer, $data);
                $notificationSent = true;
                $sentTo['emails'] = $observer->notification_emails;
            } catch (\Exception $e) {
                Log::error("Failed to send email notification for observer {$observer->id}: " . $e->getMessage());
            }
        }

        if ($observer->hasTelegramNotifications()) {
            try {
                $telegramResults = $this->sendTelegramNotification($observer, $data);
                $notificationSent = true;
                $sentTo['telegram'] = [
                    'chat_ids' => $observer->telegram_chat_ids,
                    'results' => $telegramResults,
                ];
            } catch (\Exception $e) {
                Log::error("Failed to send Telegram notification for observer {$observer->id}: " . $e->getMessage());
            }
        }

        if ($notificationSent) {
            $log->update([
                'notification_sent_to' => $sentTo,
                'sent_at' => now(),
            ]);
        }
    }

    private function sendEmailNotification(ValueObserver $observer, array $data): void
    {
        foreach ($observer->notification_emails as $email) {
            Mail::to($email)->send(new ValueAlertEmail($data));
        }
    }

    private function sendTelegramNotification(ValueObserver $observer, array $data): array
    {
        $message = $this->formatTelegramMessage($data);

        return $this->telegramService->sendBulkMessage(
            $observer->telegram_bot_token,
            $observer->telegram_chat_ids,
            $message,
            'HTML'
        );
    }

    private function formatTelegramMessage(array $data): string
    {
        $observer = $data['observer'];
        $record = $data['record'];
        $recordId = $record->{$observer->connectionTable->primary_key};

        $escape = function($text) {
            return htmlspecialchars($text, ENT_QUOTES | ENT_HTML5);
        };

        $message = "⚠️ <b>Database Value Alert</b>\n\n";
        $message .= "🔍 <b>Observer:</b> " . $escape($observer->name) . "\n";
        $message .= "🗄️ <b>Database:</b> " . $escape($data['connectionName']) . "\n";
        $message .= "📊 <b>Table:</b> " . $escape($data['tableName']) . "\n";
        $message .= "🎯 <b>Field:</b> " . $escape($observer->field_to_watch) . "\n";
        $message .= "📝 <b>Condition:</b> " . $escape($data['conditionDescription']) . "\n";
        $message .= "📈 <b>Current Value:</b> " . $escape($data['currentValue']) . "\n";
        $message .= "🆔 <b>Record ID:</b> " . $escape($recordId) . "\n";
        $message .= "⏰ <b>Checked At:</b> " . $escape($data['checkedAt']) . "\n\n";

        $recordJson = json_encode($record, JSON_PRETTY_PRINT);
        if (strlen($recordJson) > 1000) {
            $recordJson = substr($recordJson, 0, 1000) . "\n... (truncated)";
        }

        $message .= "<code>" . $escape($recordJson) . "</code>\n\n";
        $message .= "📋 <i>This is an automated alert from your Database Observer system.</i>";

        return $message;
    }

    private function getConditionDetails($value, ValueObserver $observer): string
    {
        $details = "Field: {$observer->field_to_watch}, ";
        $details .= "Condition: {$observer->getConditionDescription()}, ";
        $details .= "Current Value: {$value}";

        return $details;
    }

    public function testObserver(ValueObserver $observer): array
    {
        $connectionTable = $observer->connectionTable;
        $connection = $connectionTable->connection;

        $dbConn = $this->dbService->connect($connection->connection_config);

        $records = $dbConn->table($connectionTable->table_name)
            ->select([$connectionTable->primary_key, $observer->field_to_watch])
            ->limit(10)
            ->get();

        $results = [];

        foreach ($records as $record) {
            $currentValue = $record->{$observer->field_to_watch};

            $conditionMet = $this->checkCondition(
                $currentValue,
                $observer->condition_type,
                $observer->threshold_value,
                $observer->string_value
            );

            $results[] = [
                'record_id' => $record->{$connectionTable->primary_key},
                'value' => $currentValue,
                'condition_met' => $conditionMet,
                'condition_description' => $observer->getConditionDescription(),
            ];
        }

        return $results;
    }

    public function testNotification(ValueObserver $observer): array
    {
        $connectionTable = $observer->connectionTable;
        $connection = $connectionTable->connection;

        $dbConn = $this->dbService->connect($connection->connection_config);

        $record = $dbConn->table($connectionTable->table_name)
            ->select([$connectionTable->primary_key, $observer->field_to_watch])
            ->first();

        if (!$record) {
            throw new \Exception("No records found in table.");
        }

        $currentValue = $record->{$observer->field_to_watch};
        $recordId = $record->{$connectionTable->primary_key};

        $log = ValueObserverLog::create([
            'value_observer_id' => $observer->id,
            'record_id' => $recordId,
            'current_value' => is_numeric($currentValue) ? $currentValue : null,
            'current_string_value' => !is_numeric($currentValue) ? (string)$currentValue : null,
            'condition_met' => true,
            'details' => 'Test notification',
        ]);

        $data = [
            'observer' => $observer,
            'log' => $log,
            'record' => $record,
            'currentValue' => $currentValue,
            'tableName' => $connectionTable->name,
            'connectionName' => $connectionTable->connection->name,
            'conditionDescription' => $observer->getConditionDescription(),
            'checkedAt' => now()->format('Y-m-d H:i:s'),
        ];

        $results = [];

        if ($observer->hasEmailNotifications()) {
            try {
                $this->sendEmailNotification($observer, $data);
                $results['email'] = [
                    'success' => true,
                    'message' => 'Test email sent successfully',
                    'recipients' => $observer->notification_emails,
                ];
            } catch (\Exception $e) {
                $results['email'] = [
                    'success' => false,
                    'message' => $e->getMessage(),
                ];
            }
        }

        if ($observer->hasTelegramNotifications()) {
            try {
                $telegramResults = $this->sendTelegramNotification($observer, $data);
                $results['telegram'] = [
                    'success' => true,
                    'message' => 'Test Telegram message sent',
                    'results' => $telegramResults,
                ];
            } catch (\Exception $e) {
                $results['telegram'] = [
                    'success' => false,
                    'message' => $e->getMessage(),
                ];
            }
        }

        $log->delete();

        return $results;
    }
}
