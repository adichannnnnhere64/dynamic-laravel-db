<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class ValueObserver extends Model
{
    protected $table = 'value_observers';

    protected $fillable = [
        'connection_table_id',
        'name',
        'field_to_watch',
        'condition_type',
        'threshold_value',
        'string_value',
        'date_field_type',
        'days_before_alert',
        'days_after_alert',
        'alert_on_expired',
        'date_format',
        'is_active',
        'notification_emails',
        'telegram_chat_ids',
        'telegram_bot_token',
        'notification_subject',
        'notification_message',
        'check_interval_minutes',
        'last_checked_at',
        'last_triggered_at',
        'trigger_count',
    ];

    protected $casts = [
        'notification_emails' => 'array',
        'telegram_chat_ids' => 'array',
        'threshold_value' => 'decimal:4',
        'is_active' => 'boolean',
        'alert_on_expired' => 'boolean',
        'last_checked_at' => 'datetime',
        'last_triggered_at' => 'datetime',
        'days_before_alert' => 'integer',
        'days_after_alert' => 'integer',
    ];

    // Add date condition types to the existing array
    public static function getConditionTypes(): array
    {
        return [
            'less_than' => 'Less than',
            'greater_than' => 'Greater than',
            'equals' => 'Equals',
            'not_equals' => 'Not equals',
            'contains' => 'Contains',
            'starts_with' => 'Starts with',
            'ends_with' => 'Ends with',
            'date_near_expiry' => 'Near expiration date',
            'date_expired' => 'Expired',
            'date_future' => 'Future date',
            'date_past' => 'Past date',
        ];
    }

    public static function getDateFieldTypes(): array
    {
        return [
            'date' => 'Date (YYYY-MM-DD)',
            'datetime' => 'Date & Time',
            'timestamp' => 'Timestamp',
        ];
    }

    public function connectionTable()
    {
        return $this->belongsTo(ConnectionTable::class);
    }

    public function logs()
    {
        return $this->hasMany(ValueObserverLog::class);
    }

    public function getConditionDescription(): string
    {
        $conditions = self::getConditionTypes();

        $condition = $conditions[$this->condition_type] ?? $this->condition_type;

        // Numeric conditions
        if (in_array($this->condition_type, ['less_than', 'greater_than', 'equals', 'not_equals']) && $this->threshold_value !== null) {
            return "{$condition} {$this->threshold_value}";
        }

        // String conditions
        if (in_array($this->condition_type, ['equals', 'not_equals', 'contains', 'starts_with', 'ends_with']) && $this->string_value !== null) {
            return "{$condition} '{$this->string_value}'";
        }

        // Date conditions
        if ($this->isDateCondition()) {
            return $this->getDateConditionDescription();
        }

        return $condition;
    }

    public function isDateCondition(): bool
    {
        return in_array($this->condition_type, [
            'date_near_expiry',
            'date_expired',
            'date_future',
            'date_past',
        ]);
    }

    public function getDateConditionDescription(): string
    {
        $descriptions = [
            'date_near_expiry' => "Expires within {$this->days_before_alert} days",
            'date_expired' => $this->alert_on_expired ? 'Alert on expired' : 'Check expiration',
            'date_future' => 'Future date',
            'date_past' => 'Past date',
        ];

        return $descriptions[$this->condition_type] ?? $this->condition_type;
    }

    public function shouldCheck(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if (!$this->last_checked_at) {
            return true;
        }

        return $this->last_checked_at->addMinutes($this->check_interval_minutes)->isPast();
    }

    public function hasTelegramNotifications(): bool
    {
        return !empty($this->telegram_chat_ids) && !empty($this->telegram_bot_token);
    }

    public function hasEmailNotifications(): bool
    {
        return !empty($this->notification_emails);
    }

    public function hasAnyNotifications(): bool
    {
        return $this->hasEmailNotifications() || $this->hasTelegramNotifications();
    }

    public function getDefaultDateFormat(): string
    {
        return match($this->date_field_type) {
            'date' => 'Y-m-d',
            'datetime' => 'Y-m-d H:i:s',
            'timestamp' => 'Y-m-d H:i:s',
            default => 'Y-m-d H:i:s',
        };
    }
}
