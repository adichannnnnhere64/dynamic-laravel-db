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

        <div class="details">
            <h4>Alert Details</h4>
            <p><strong>Observer Name:</strong> {{ $observer->name }}</p>
            <p><strong>Database Connection:</strong> {{ $connectionName }}</p>
            <p><strong>Table:</strong> {{ $tableName }}</p>
            <p><strong>Field Being Watched:</strong> {{ $observer->field_to_watch }}</p>
            <p><strong>Condition:</strong> {{ $conditionDescription }}</p>
            <p><strong>Current Value:</strong> {{ $currentValue }}</p>
            <p><strong>Record ID:</strong> {{ $record->{$observer->connectionTable->primary_key} }}</p>
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
