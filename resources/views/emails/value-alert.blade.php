<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Database Value Alert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .date-warning { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>📊 Database Value Alert</h2>
        </div>

        <div class="alert">
            <h3>⚠️ Alert Triggered</h3>
            <p>The condition you set up has been triggered in your database.</p>
        </div>

        @if(in_array($observer['condition_type'], ['date_near_expiry', 'date_expired', 'date_future', 'date_past']))
        <div class="date-warning">
            <h3>📅 Date Alert</h3>
            <p><strong>Type:</strong> {{ ucfirst(str_replace('_', ' ', $observer['condition_type'])) }}</p>
            @if($observer['condition_type'] === 'date_near_expiry')
                <p><strong>Alert Before:</strong> {{ $observer['days_before_alert'] ?? 7 }} days</p>
            @endif
        </div>
        @endif

        <div class="details">
            <h4>Alert Details</h4>
            <p><strong>Observer Name:</strong> {{ $observer['name'] }}</p>
            <p><strong>Database Connection:</strong> {{ $connectionName }}</p>
            <p><strong>Table:</strong> {{ $tableName }}</p>
            <p><strong>Field Being Watched:</strong> {{ $observer['field_to_watch'] }}</p>
            <p><strong>Condition:</strong> {{ $conditionDescription }}</p>

            @if(in_array($observer['condition_type'], ['date_near_expiry', 'date_expired', 'date_future', 'date_past']))
                @php
                    $date = \Carbon\Carbon::parse($currentValue);
                    $daysRemaining = now()->diffInDays($date, false);
                @endphp
                <p><strong>Date Value:</strong> {{ $date->format('Y-m-d H:i:s') }}</p>
                @if($observer['condition_type'] === 'date_near_expiry')
                    <p><strong>Days Remaining:</strong> {{ $daysRemaining > 0 ? $daysRemaining . ' days' : 'Expired' }}</p>
                @endif
            @else
                <p><strong>Current Value:</strong> {{ $currentValue }}</p>
            @endif

            <p><strong>Record ID:</strong> {{ $record->{$observer['connectionTable']['primary_key']} }}</p>
            <p><strong>Checked At:</strong> {{ $checkedAt }}</p>
        </div>

        <div class="details">
            <h4>Full Record Details</h4>
            <pre>{{ json_encode($record, JSON_PRETTY_PRINT) }}</pre>
        </div>

        <div class="footer">
            <p>This is an automated alert from your Database Observer system.</p>
            <p>You can manage this alert in your dashboard.</p>
        </div>
    </div>
</body>
</html>
