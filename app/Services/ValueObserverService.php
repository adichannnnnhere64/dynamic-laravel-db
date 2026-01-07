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

        // Get all records from the table
        $records = $dbConn->table($connectionTable->table_name)
            ->select([$connectionTable->primary_key, $observer->field_to_watch])
            ->get();

        $conditionMetCount = 0;

        foreach ($records as $record) {
            $currentValue = $record->{$observer->field_to_watch};
            $recordId = $record->{$connectionTable->primary_key};

            // Check if condition is met
            $conditionMet = $this->checkCondition(
                $currentValue,
                $observer->condition_type,
                $observer->threshold_value,
                $observer->string_value,
                $observer // Pass observer for date conditions
            );

            // Log the check
            $log = ValueObserverLog::create([
                'value_observer_id' => $observer->id,
                'record_id' => $recordId,
                'current_value' => is_numeric($currentValue) ? $currentValue : null,
                'current_string_value' => !is_numeric($currentValue) ? (string)$currentValue : null,
                'current_date_value' => $this->parseDateValue($currentValue, $observer),
                'condition_met' => $conditionMet,
                'details' => $this->getConditionDetails($currentValue, $observer),
            ]);

            if ($conditionMet) {
                $conditionMetCount++;

                // Send notification if condition is met
                $this->sendNotification($observer, $log, $record, $currentValue);
            }
        }

        // Update observer
        $observer->update([
            'last_checked_at' => now(),
            'last_triggered_at' => $conditionMetCount > 0 ? now() : $observer->last_triggered_at,
            'trigger_count' => $observer->trigger_count + $conditionMetCount,
        ]);
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

       private function checkCondition($value, string $conditionType, $threshold = null, $stringValue = null, ?ValueObserver $observer = null): bool
    {

        \Log::info($conditionType);

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

            // Date conditions
            case 'date_near_expiry':
                return $this->checkDateNearExpiry($value, $observer);

            case 'date_expired':
                return $this->checkDateExpired($value, $observer);

            case 'date_future':
                return $this->checkDateFuture($value, $observer);

            case 'date_past':
                return $this->checkDatePast($value, $observer);

            default:
                return false;
        }
    }

    /**
     * Check if date is near expiry
     */
    private function checkDateNearExpiry($dateValue, ?ValueObserver $observer): bool
    {
        try {
            $date = $this->parseDate($dateValue, $observer);
            \Log::info($date);

            if (!$date) {
                return false;
            }

            $daysBefore = $observer->days_before_alert ?? 7;


            \Log::info($daysBefore);

            // Check if date is within the specified days before expiry
            return $date->isBetween(
                now(),
                now()->addDays($daysBefore)
            );
        } catch (\Exception $e) {
            Log::error("Failed to check date near expiry: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if date is expired
     */
    private function checkDateExpired($dateValue, ValueObserver $observer): bool
    {
        try {
            $date = $this->parseDate($dateValue, $observer);

            if (!$date) {
                return false;
            }

            $isExpired = $date->isPast();

            // If alert_on_expired is false, we're checking for NOT expired
            if (!$observer->alert_on_expired) {
                return !$isExpired;
            }

            return $isExpired;
        } catch (\Exception $e) {
            Log::error("Failed to check date expired: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if date is in future
     */
    private function checkDateFuture($dateValue, ValueObserver $observer): bool
    {
        try {
            $date = $this->parseDate($dateValue, $observer);

            if (!$date) {
                return false;
            }

            return $date->isFuture();
        } catch (\Exception $e) {
            Log::error("Failed to check date future: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if date is in past
     */
    private function checkDatePast($dateValue, ValueObserver $observer): bool
    {
        try {
            $date = $this->parseDate($dateValue, $observer);

            if (!$date) {
                return false;
            }

            return $date->isPast();
        } catch (\Exception $e) {
            Log::error("Failed to check date past: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Parse date value
     */
    private function parseDate($dateValue, ValueObserver $observer): ?Carbon
{
    if (empty($dateValue)) {
        return null;
    }

    try {
        // If it's already a Carbon instance or DateTime
        if ($dateValue instanceof Carbon) {
            return $dateValue;
        }

        if ($dateValue instanceof \DateTime) {
            return Carbon::instance($dateValue);
        }

        // If it's a timestamp (integer)
        if (is_numeric($dateValue)) {
            return Carbon::createFromTimestamp($dateValue);
        }

        // If it's a string, try to parse it
        if (is_string($dateValue)) {
            $dateString = trim($dateValue);

            // Check if it's a MySQL timestamp/datetime
            if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $dateString)) {
                // MySQL datetime format: Y-m-d H:i:s
                return Carbon::createFromFormat('Y-m-d H:i:s', $dateString);
            }

            // Check if it's a MySQL date
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateString)) {
                // MySQL date format: Y-m-d
                return Carbon::createFromFormat('Y-m-d', $dateString);
            }

            // Check if it's a timestamp with milliseconds
            if (preg_match('/^\d{10,13}$/', $dateString)) {
                $timestamp = (int) $dateString;
                // Handle milliseconds
                if (strlen($dateString) === 13) {
                    $timestamp = (int) ($timestamp / 1000);
                }
                return Carbon::createFromTimestamp($timestamp);
            }

            // Try with observer's specified format
            if ($observer->date_format) {
                try {
                    $date = Carbon::createFromFormat($observer->date_format, $dateString);
                    if ($date !== false) {
                        return $date;
                    }
                } catch (\Exception $e) {
                    // Format didn't work, try others
                }
            }

            // Try common formats in order
            $commonFormats = [
                'Y-m-d H:i:s',      // MySQL datetime
                'Y-m-d',            // MySQL date
                'd/m/Y H:i:s',      // UK datetime
                'd/m/Y',            // UK date
                'm/d/Y H:i:s',      // US datetime
                'm/d/Y',            // US date
                'Y-m-d\TH:i:sP',    // ISO 8601 with timezone
                'Y-m-d\TH:i:s',     // ISO 8601
                'D, d M Y H:i:s O', // RFC 2822
            ];

            foreach ($commonFormats as $format) {
                try {
                    $date = Carbon::createFromFormat($format, $dateString);
                    if ($date !== false) {
                        return $date;
                    }
                } catch (\Exception $e) {
                    continue;
                }
            }

            // Last resort: use Carbon's parse (less strict)
            return Carbon::parse($dateString);
        }

        return null;
    } catch (\Exception $e) {
        Log::warning("Failed to parse date: '{$dateValue}' - " . $e->getMessage(), [
            'observer_id' => $observer->id,
            'date_format' => $observer->date_format,
            'date_field_type' => $observer->date_field_type,
        ]);
        return null;
    }
}


    /**
     * Parse date value for logging
     */
    private function parseDateValue($dateValue, ValueObserver $observer): ?string
    {
        $date = $this->parseDate($dateValue, $observer);

        if (!$date) {
            return null;
        }

        return $date->toDateTimeString();
    }

    /**
     * Get condition details for logging
     */
    private function getConditionDetails($value, ValueObserver $observer): string
    {
        $details = "Field: {$observer->field_to_watch}, ";
        $details .= "Condition: {$observer->getConditionDescription()}, ";

        if ($observer->isDateCondition()) {
            $date = $this->parseDate($value, $observer);
            $details .= "Date Value: " . ($date ? $date->toDateTimeString() : 'Invalid date');

            if ($observer->condition_type === 'date_near_expiry' && $date) {
                $daysRemaining = now()->diffInDays($date, false);
                $details .= ", Days remaining: " . ($daysRemaining > 0 ? $daysRemaining : 'Expired');
            }
        } else {
            $details .= "Current Value: {$value}";
        }

        return $details;
    }

    /**
     * Format Telegram message for date alerts
     */
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

        if ($observer->isDateCondition()) {
            $dateValue = $data['currentValue'];
            $date = $this->parseDate($dateValue, $observer);

            if ($date) {
                $message .= "📅 <b>Date Value:</b> " . $escape($date->format('Y-m-d H:i:s')) . "\n";

                if ($observer->condition_type === 'date_near_expiry') {
                    $daysRemaining = now()->diffInDays($date, false);
                    $message .= "⏳ <b>Days Remaining:</b> " . $escape($daysRemaining > 0 ? $daysRemaining . ' days' : 'Expired') . "\n";
                }
            } else {
                $message .= "📅 <b>Date Value:</b> " . $escape($dateValue) . "\n";
            }
        } else {
            $message .= "📈 <b>Current Value:</b> " . $escape($data['currentValue']) . "\n";
        }

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
