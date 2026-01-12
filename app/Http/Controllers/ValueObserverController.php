<?php

namespace App\Http\Controllers;

use App\Models\ValueObserver;
use App\Models\ConnectionTable;
use App\Services\ValueObserverService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ValueObserverController extends Controller
{
    protected $observerService;

    public function __construct(ValueObserverService $observerService)
    {
        $this->observerService = $observerService;
    }

    public function index(Request $request)
    {
        $observers = ValueObserver::with(['connectionTable.connection'])
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('field_to_watch', 'like', "%{$search}%");
            })
            ->when($request->connection_id, function ($query, $connectionId) {
                $query->whereHas('connectionTable', function ($q) use ($connectionId) {
                    $q->where('db_connection_id', $connectionId);
                });
            })
            ->orderBy('is_active', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        $connections = auth()->user()->dbConnections()->with('tables')->get();

        return Inertia::render('ValueObservers/Index', [
            'observers' => $observers,
            'connections' => $connections,
            'filters' => $request->only(['search', 'connection_id']),
        ]);
    }

    public function create(Request $request)
    {
        $connections = auth()->user()->dbConnections()->with('tables')->get();

        $selectedConnection = $connections->first();
        $selectedTable = $selectedConnection->tables->first();

        if ($request->connection_id) {
            $selectedConnection = $connections->find($request->connection_id);
            $selectedTable = $selectedConnection->tables->first();
        }

        if ($request->table_id) {
            $selectedTable = ConnectionTable::find($request->table_id);
            $selectedConnection = $selectedTable->connection;
        }

        $fields = $selectedTable ? $selectedTable->fields : [];

        return Inertia::render('ValueObservers/Create', [
            'connections' => $connections,
            'selectedConnection' => $selectedConnection,
            'selectedTable' => $selectedTable,
            'fields' => $fields,
        ]);
    }


    public function show(ValueObserver $observer)
{
    $observer->load(['connectionTable.connection', 'logs' => function ($query) {
        $query->orderBy('created_at', 'desc')->limit(50);
    }]);

    // Add helper properties
    $observerArray = $observer->toArray();
    $observerArray['has_telegram_notifications'] = $observer->hasTelegramNotifications();
    $observerArray['has_email_notifications'] = $observer->hasEmailNotifications();
    $observerArray['has_any_notifications'] = $observer->hasAnyNotifications();

    return Inertia::render('ValueObservers/Show', [
        'observer' => $observerArray,
    ]);
}


        public function edit(ValueObserver $observer)
    {
        $observer->load('connectionTable.connection');
        $connections = auth()->user()->dbConnections()->with('tables')->get();

        $selectedConnection = $observer->connectionTable->connection;
        $selectedTable = $observer->connectionTable;

        // Add helper properties to the observer for the frontend
        $observerArray = $observer->toArray();
        $observerArray['has_telegram_notifications'] = $observer->hasTelegramNotifications();
        $observerArray['has_email_notifications'] = $observer->hasEmailNotifications();
        $observerArray['has_any_notifications'] = $observer->hasAnyNotifications();

        return Inertia::render('ValueObservers/Edit', [
            'observer' => $observerArray,
            'connections' => $connections,
            'selectedConnection' => $selectedConnection,
            'selectedTable' => $selectedTable,
            'fields' => $selectedTable->fields,
        ]);
    }


    public function store(Request $request)
{
    $request->validate([
        'connection_table_id' => 'required|exists:connection_tables,id',
        'name' => 'required|string|max:255',
        'field_to_watch' => 'required|string|max:255',
        'condition_type' => 'required|in:less_than,greater_than,equals,not_equals,contains,starts_with,ends_with,date_near_expiry,date_expired,date_future,date_past',
        'threshold_value' => 'nullable|numeric',
        'string_value' => 'nullable|string|max:255',
        'date_field_type' => 'nullable|required_if:condition_type,date_near_expiry,date_expired,date_future,date_past|in:date,datetime,timestamp',
        'days_before_alert' => 'nullable|integer|min:1|max:365',
        'days_after_alert' => 'nullable|integer|min:1|max:365',
        'alert_on_expired' => 'boolean',
        'date_format' => 'nullable|string|max:50',
        'is_active' => 'boolean',
        'notification_emails' => 'nullable|array',
        'notification_emails.*' => 'nullable|email',
        'telegram_chat_ids' => 'nullable|array',
        'telegram_chat_ids.*' => 'nullable|string',
        'telegram_bot_token' => 'nullable|string|max:255',
        'notification_subject' => 'required|string|max:255',
        'notification_message' => 'required|string',
        'check_interval_minutes' => 'required|integer|min:1|max:1440',
    ]);

    // Clean up empty values from arrays
    $notificationEmails = array_filter($request->notification_emails ?? [], function($email) {
        return !empty($email) && trim($email) !== '';
    });

    $telegramChatIds = array_filter($request->telegram_chat_ids ?? [], function($chatId) {
        return !empty($chatId) && trim($chatId) !== '';
    });

    // Validate that at least one notification method is provided
    $hasEmailNotifications = !empty($notificationEmails);
    $hasTelegramNotifications = !empty($telegramChatIds) && !empty(trim($request->telegram_bot_token ?? ''));

    if (!$hasEmailNotifications && !$hasTelegramNotifications) {
        return back()->withErrors([
            'notification_method' => 'Please provide at least one notification method (email or Telegram).',
        ]);
    }

    $observer = ValueObserver::create([
        'connection_table_id' => $request->connection_table_id,
        'name' => $request->name,
        'field_to_watch' => $request->field_to_watch,
        'condition_type' => $request->condition_type,
        'threshold_value' => $request->threshold_value,
        'string_value' => $request->string_value,
        'date_field_type' => $request->date_field_type,
        'days_before_alert' => $request->days_before_alert,
        'days_after_alert' => $request->days_after_alert,
        'alert_on_expired' => $request->alert_on_expired ?? false,
        'date_format' => $request->date_format,
        'is_active' => $request->is_active ?? true,
        'notification_emails' => $notificationEmails,
        'telegram_chat_ids' => $telegramChatIds,
        'telegram_bot_token' => $request->telegram_bot_token ? trim($request->telegram_bot_token) : null,
        'notification_subject' => $request->notification_subject,
        'notification_message' => $request->notification_message,
        'check_interval_minutes' => $request->check_interval_minutes,
    ]);

    return redirect()->route('value-observers.index')
        ->with('success', 'Value observer created successfully!');
}


    public function update(Request $request, ValueObserver $observer)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'field_to_watch' => 'required|string|max:255',
            'condition_type' => 'required|in:less_than,greater_than,equals,not_equals,contains,starts_with,ends_with',
            'threshold_value' => 'nullable|numeric',
            'string_value' => 'nullable|string|max:255',
            'is_active' => 'boolean',
            'notification_emails' => 'nullable|array',
            'notification_emails.*' => 'nullable|email',
            'telegram_chat_ids' => 'nullable|array',
            'telegram_chat_ids.*' => 'nullable|string',
            'telegram_bot_token' => 'nullable|string|max:255',
            'notification_subject' => 'required|string|max:255',
            'notification_message' => 'required|string',
            'check_interval_minutes' => 'required|integer|min:1|max:1440',
        ]);

        // Clean up empty values from arrays
        $notificationEmails = array_filter($request->notification_emails ?? [], function($email) {
            return !empty($email) && trim($email) !== '';
        });

        $telegramChatIds = array_filter($request->telegram_chat_ids ?? [], function($chatId) {
            return !empty($chatId) && trim($chatId) !== '';
        });

        // Validate that at least one notification method is provided
        $hasEmailNotifications = !empty($notificationEmails);
        $hasTelegramNotifications = !empty($telegramChatIds) && !empty(trim($request->telegram_bot_token ?? ''));

        if (!$hasEmailNotifications && !$hasTelegramNotifications) {
            return back()->withErrors([
                'notification_method' => 'Please provide at least one notification method (email or Telegram).',
            ]);
        }

        $observer->update([
            'name' => $request->name,
            'field_to_watch' => $request->field_to_watch,
            'condition_type' => $request->condition_type,
            'threshold_value' => $request->threshold_value,
            'string_value' => $request->string_value,
            'is_active' => $request->is_active ?? true,
            'notification_emails' => $notificationEmails,
            'telegram_chat_ids' => $telegramChatIds,
            'telegram_bot_token' => $request->telegram_bot_token ? trim($request->telegram_bot_token) : null,
            'notification_subject' => $request->notification_subject,
            'notification_message' => $request->notification_message,
            'check_interval_minutes' => $request->check_interval_minutes,
        ]);

        return redirect()->route('value-observers.show', $observer)
            ->with('success', 'Value observer updated successfully!');
    }


    public function destroy(ValueObserver $observer)
    {
        $observer->delete();

        return redirect()->route('value-observers.index')
            ->with('success', 'Value observer deleted successfully!');
    }

    public function test(ValueObserver $observer)
    {
        $results = $this->observerService->testObserver($observer);

        return response()->json([
            'success' => true,
            'results' => $results,
            'total_records' => count($results),
            'condition_met_count' => count(array_filter($results, fn($r) => $r['condition_met'])),
        ]);
    }

    public function testNotification(ValueObserver $observer)
    {
        $results = $this->observerService->testNotification($observer);

        return response()->json([
            'success' => true,
            'results' => $results,
        ]);
    }

    public function getTableFields($tableId)
    {
        $table = ConnectionTable::findOrFail($tableId);

        return response()->json([
            'fields' => $table->fields,
        ]);
    }

    public function logs(ValueObserver $observer)
{
    $logs = $observer->logs()->orderBy('created_at', 'desc')->paginate(50);

    // Load the necessary relationship
    $observer->load(['connectionTable.connection']);

    // Convert to array with helper properties
    $observerArray = $observer->toArray();
    $observerArray['has_telegram_notifications'] = $observer->hasTelegramNotifications();
    $observerArray['has_email_notifications'] = $observer->hasEmailNotifications();
    $observerArray['has_any_notifications'] = $observer->hasAnyNotifications();

    return Inertia::render('ValueObservers/Logs', [
        'observer' => $observerArray,
        'logs' => $logs,
    ]);
}
}
