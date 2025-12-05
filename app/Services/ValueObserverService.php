<?php

namespace App\Services;

use App\Models\ValueObserver;
use App\Models\ValueObserverLog;
use App\Services\DynamicDatabaseService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\ValueAlertEmail;
use Carbon\Carbon;

class ValueObserverService
{
    protected $dbService;

    public function __construct(DynamicDatabaseService $dbService)
    {
        $this->dbService = $dbService;
    }

    /**
     * Run all active observers that need checking
     */
    public function runObservers(): void
    {
        // Get all active observers
        $observers = ValueObserver::where('is_active', true)
            ->with('connectionTable.connection')
            ->get();

        foreach ($observers as $observer) {
            try {
                // Check if observer needs checking based on interval
                if ($this->shouldCheckObserver($observer)) {
                    $this->checkObserver($observer);
                }
            } catch (\Exception $e) {
                Log::error("Failed to check observer {$observer->id}: " . $e->getMessage());
            }
        }
    }

    /**
     * Check if observer needs checking based on interval
     */
    private function shouldCheckObserver(ValueObserver $observer): bool
    {
        // If never checked before, check it
        if (!$observer->last_checked_at) {
            return true;
        }

        // Calculate next check time
        $lastChecked = Carbon::parse($observer->last_checked_at);
        $nextCheck = $lastChecked->addMinutes($observer->check_interval_minutes);

        // Check if current time is past next check time
        return now()->greaterThanOrEqualTo($nextCheck);
    }

    /**
     * Check a single observer
     */
    public function checkObserver(ValueObserver $observer): void
    {
        $connectionTable = $observer->connectionTable;
        $connection = $connectionTable->connection;

        // Connect to the database
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
                $observer->string_value
            );

            // Log the check
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

    /**
     * Check if condition is met
     */
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

    /**
     * Send email notification
     */
    private function sendNotification(ValueObserver $observer, ValueObserverLog $log, $record, $currentValue): void
    {
        try {
            $emails = $observer->notification_emails;

            if (empty($emails)) {
                return;
            }

            $connectionTable = $observer->connectionTable;

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

            foreach ($emails as $email) {
                Mail::to($email)->send(new ValueAlertEmail($data));
            }

            // Update log with notification info
            $log->update([
                'notification_sent_to' => $emails,
                'sent_at' => now(),
            ]);

        } catch (\Exception $e) {
            Log::error("Failed to send notification for observer {$observer->id}: " . $e->getMessage());
        }
    }

    /**
     * Get condition details for logging
     */
    private function getConditionDetails($value, ValueObserver $observer): string
    {
        $details = "Field: {$observer->field_to_watch}, ";
        $details .= "Condition: {$observer->getConditionDescription()}, ";
        $details .= "Current Value: {$value}";

        return $details;
    }

    /**
     * Test an observer immediately (for manual testing)
     */
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
}
