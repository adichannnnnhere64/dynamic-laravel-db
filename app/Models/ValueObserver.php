<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
        'is_active',
        'notification_emails',
        'notification_subject',
        'notification_message',
        'check_interval_minutes',
        'last_checked_at',
        'last_triggered_at',
        'trigger_count',
    ];

    protected $casts = [
        'notification_emails' => 'array',
        'threshold_value' => 'decimal:4',
        'is_active' => 'boolean',
        'last_checked_at' => 'datetime',
        'last_triggered_at' => 'datetime',
    ];

    public function connectionTable()
    {
        return $this->belongsTo(ConnectionTable::class);
    }

    public function logs()
    {
        return $this->hasMany(ValueObserverLog::class);
    }

    // Helper methods
    public function getConditionDescription(): string
    {
        $conditions = [
            'less_than' => 'Less than',
            'greater_than' => 'Greater than',
            'equals' => 'Equals',
            'not_equals' => 'Not equals',
            'changes' => 'Changes',
            'contains' => 'Contains',
            'starts_with' => 'Starts with',
            'ends_with' => 'Ends with',
        ];

        $condition = $conditions[$this->condition_type] ?? $this->condition_type;

        if (in_array($this->condition_type, ['less_than', 'greater_than', 'equals', 'not_equals']) && $this->threshold_value !== null) {
            return "{$condition} {$this->threshold_value}";
        } elseif (in_array($this->condition_type, ['equals', 'not_equals', 'contains', 'starts_with', 'ends_with']) && $this->string_value !== null) {
            return "{$condition} '{$this->string_value}'";
        } elseif ($this->condition_type === 'changes') {
            return 'When value changes';
        }

        return $condition;
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
}
